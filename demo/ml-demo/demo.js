var srcRequire = require.config({
    baseUrl: "../../src/",
});

var domainModels, domainInstances, tableData, qcTree;
window.onload = function() {
    srcRequire(['cubeMaker', 'queryEngine'], function(cubeMaker, queryEngine) {
        var cubeSpec = {
            dimensions: [ 'Period', 'Gender', 'Age', 'Occupation'],
            measure: ['Rating'],
            aggregation: {
                start: 0,
                iterativeOperation: function(value, total) {
                    return total + parseInt(value, 10);
                },
                summaryOperation: function(total, partition) {
                    return (total / partition.length).toFixed(2);
                }
            }
        };
        domainModels = createDomainModels();
        domainInstances = createDomainInstances(domainModels);
        tableData = flattenData(domainInstances);
        qcTree = cubeMaker.createCube(tableData, cubeSpec.aggregation);

        $('#myTab a').click(function (e) {
            //e.preventDefault();
            $(this).tab('show');
        });
        $('ul.nav-tabs a').on('show', function (e) {
            var url, hash, template;
            url = e.target.href;
            hash = url.substring(url.indexOf("#")+1);
            if (hash === 'tree') {
                if ($('#qcTree svg').size() < 1) {
                    plotQCTree(qcTree, '#qcTree', {treeOffset:20, width:1200, height:600});
                }
            } else if (hash === 'tableData') {
                if ($('#tableData table').size() < 1) {
                    template = Handlebars.compile($("#array-to-table-template").html());
                    $('#tableData').append(template(tableData));
                }
            }
        });
    });

}

function createDomainModels() {
    var domainModels = {};
    createDomainModel(domainModels, User,  ['UserID','Gender','Age','Occupation','Zip-code'], /(\d+)::(.+)::(\d+)::(\d+)::(\d+)/);
    createDomainModel(domainModels, Movie,  ['MovieID','Title','Genres'], /(\d+)::(.+)::(\S+)/);
    createDomainModel(domainModels, Rating, ['UserID','MovieID','Rating','Timestamp'], /(\d+)::(\d+)::(\d+)::(\d+)/);
    return domainModels;
}
function createDomainInstances(domainModels) {
    var domainInstances = {};
    $('div.data textarea').each(function() {
        var textAreaId, modelType, values, currentDomainInstance;
        modelType =extractModelType( this.id);
        domainInstances[modelType] = [];
        values = this.value.split('\n');
        _.each(values, function(value, index){
            if (value.trim().length > 0) {
                currentDomainInstance = domainModels[modelType].create(value.trim());
                if (currentDomainInstance.id) {
                    domainInstances[modelType][currentDomainInstance.id] = currentDomainInstance
                } else {
                    domainInstances[modelType].push(currentDomainInstance);
                }
            }
        });
    });
    return domainInstances;
}

function flattenData(domainInstances) {
    var yearRegex = /.*\((\d{4})\)/;
    var tableData = [];
    function getPeriod(yearString) {
        var year = parseInt(yearRegex.exec(yearString)[1]);
        var diff = year - 1900;
        if (diff < 80) {
            return '1900-1980';
        } else {
            return ((diff % 2) === 0)? (year + '-' + (year + 1)):((year - 1) + '-' + year);
        }
    }
    var ratings = domainInstances['Rating'], users = domainInstances['User'], movies = domainInstances['Movie'];
    und.each(ratings, function(rating) {
        var user = users[rating.UserID], movie = movies[rating.MovieID];
        if (user && movie) {
            tableData.push([getPeriod(movie.Title) || 'uk', user.Gender || 'uk', user.Age || '0', user.Occupation || '0', rating.Rating]); 
        } else {
            console.log("could not find detail for "+rating);
        }
    });
    return tableData;
}

function extractModelType(elementId) {
    var modelType;
    modelType = elementId.substring(('txt_area_').length);
    modelType = modelType[0].toUpperCase() +  modelType.substring(1);
    return modelType;
}

function User() {this.pk = 'UserID'; };
function Movie() { this.pk = 'MovieID';};
function Rating() {};

