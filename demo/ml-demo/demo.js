var demoExports = {};
$(function(){
    var domainModels = {};

    // create drag functionality and add it to the relevant sections
    (function addDrag(){
        var dimensions = [];
        function doDragOver(event) {
            var isLink = event.dataTransfer.types.contains("text/uri-list");
            if (isLink)
                event.preventDefault();
        }

        function drawModel() {
            var model  = new PivotTableModel(dimensions, 'Rating', de.tree);
            model.compute();
            de['model'] = model;
            new PivotRenderer('table', model).draw();
            $('i.icon-trash').click(function() {
                var tableName = $(this).parents('th').attr('data'); 
                if (_.contains(dimensions, tableName)){
                    var newDims = [];
                    _.each(dimensions, function(dim) {
                        if (dim !== tableName) {
                            newDims.push(dim);
                        }
                    });
                    dimensions = newDims;
                    drawModel();
                }
            });

        }
        function handleDrop(e) {
            var urlTokens, tableName;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            urlTokens = e.dataTransfer.getData("text/uri-list").split("#");
            if (urlTokens && urlTokens.length > 0) {
                tableName = urlTokens [1];
                if (_.contains(dimensions, tableName) === false) {
                    dimensions.push(tableName);
                    drawModel();
                }
            }
            return false;
        }

        var selector = "div.report";
        $(selector).each(function() {
            this.ondrop = handleDrop
            this.ondragover = doDragOver;
        });
    }()); // end of addDrag

    // create the domain models
    (function addDomainModels() {
        function createDomainModel(model, fields, regex) {
            domainModels[model.name] = model;
            createFields(model['prototype'], fields);
            model['create'] = function(stringVal) {
                var val, splits;
                splits = regex.exec(stringVal);
                if (splits) {
                    val = new domainModels[model.name]();
                    _.each(fields, function(field, index) {
                        if (index === 0 && val.pk) {
                            val.id = splits[index + 1]
                        }
                        val[field] = splits[index + 1];
                    });
                }
                return val;
            }
        };

        function createFields (actualPrototype, fields){
            _.each(fields, function(field) {
                actualPrototype[field] = null;
            });
        };
        
        function User() {this.pk = 'UserID'; };
        function Movie() { this.pk = 'MovieID';};
        function Rating() {};

        // UserID::Gender::Age::Occupation::Zip-code
        //MovieID::Title::Genres
        //UserID::MovieID::Rating::Timestamp
        createDomainModel(User,  ['UserID','Gender','Age','Occupation','Zip-code'], /(\d+)::(.+)::(\d+)::(\d+)::(\d+)/);
        createDomainModel(Movie,  ['MovieID','Title','Genres'], /(\d+)::(.+)::(\S+)/);
        createDomainModel(Rating, ['UserID','MovieID','Rating','Timestamp'], /(\d+)::(\d+)::(\d+)::(\d+)/);
    }()); // end of addDomainModels

    $('button#toggle-data').click(function(){ 
        var btnHTML;
        $('div.data').toggle(); 
        if ($('div.data:visible').length > 0){
            btnHTML = 'Hide Data';
        } else {
            btnHTML = 'Show Data';
        }
        $('button#toggle-data').html(btnHTML);
    });

    demoExports['dm'] = domainModels;
    var domainInstances = {};

    // read the inputs and create the domain instances
    function createDomainInstances(){
        $('div.data textarea').each(function() {
            var elementId = this.id, elementType, values, currentDomainInstance;
            elementType = elementId.substring(9);
            elementType = elementType[0].toUpperCase() + elementType.substring(1);
            domainInstances[elementType] = [];
            values = this.value.split('\n');
            _.each(values, function(value, index) {
                if (value.trim().length > 0) {
                    currentDomainInstance = demoExports['dm'][elementType].create(value.trim());
                    if (currentDomainInstance.id) {
                        domainInstances[elementType][currentDomainInstance.id] = currentDomainInstance
                    } else {
                        domainInstances[elementType].push(currentDomainInstance);
                    }
                }
            });
        });
        demoExports['di'] = domainInstances;

    }

    function computeQCTree() {        
        createDomainInstances();

        // flatten rating to get the QC table from which we can create the cube
        var tableData = [];
        // TODO take genres into picture, complexity involved as it is multi valued and I currently do not know how to handle that
        var tableModel = ['Title', 'Gender', 'Age', 'Occupation', 'Rating'];
        var ratings = domainInstances['Rating'], users = domainInstances['User'], movies = domainInstances['Movie'];
        _.each(ratings, function(rating) {
            var user = users[rating.UserID] || {}, movie = movies[rating.MovieID] || {};
            tableData.push([movie.Title || 'uk', user.Gender || 'uk', user.Age || '0', user.Occupation || '0', rating.Rating]);
        });
        demoExports['data'] = tableData;
        demoExports['model'] = tableModel;

        var qcTable = new QC.Table(tableModel, tableData);
        var qCube = new QC.Cube(qcTable, _.filter(tableModel, function(value, index){return index !== 4;}), [tableModel[4]]);
        qCube.build(QC.Util.getAvgFunction('Rating'));
        demoExports['cube'] = qCube;
        var treeData = {};
        
        var tree = new QC.TreeBuilder(qCube, treeData).build();
        demoExports['tree'] = tree;
        var avgRating = treeData["1:{Rating}"];
        $('#cube_summary').html("Average rating of movies analyzed is "+ avgRating);
        $('table').find("tbody tr").remove();
        $('table').find('tbody')
            .append($('<tr>')
                    .append($('<td>').text(avgRating))
                   );

    }; // end of compute QC Tree
    computeQCTree();
    $('button#compute-tree').click(function(){ computeQCTree();});


});

var de = demoExports;



