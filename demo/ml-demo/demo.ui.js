$(function() {
    var de = demoExports;

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

    (function addToggleBehavior() {
        var targetBtn = 'button#toggle-data';
        $(targetBtn).click(function(){ 
            var btnHtml;
            $('div.data').toggle(); 
            btnHtml =  (($('div.data:visible').length > 0)? 'Hide':'Show') + ' Data';
            $(targetBtn).html(btnHtml);
        });
    }()); // end of add toggle

    $('button#compute-tree').click(function(){         
        var domainInstances = createDomainInstances();
        demoExports.computeQCTree(domainInstances);
    });
    
    de['eventManager'].on('cube-computed', function(treeData) {
        var avgRating = treeData["1:{Rating}"];
        $('#cube_summary').html("Average rating of movies analyzed is "+ avgRating);
        $('table').find("tbody tr").remove();
        $('table').find('tbody')
            .append($('<tr>')
                    .append($('<td>').text(avgRating))
                   );
    });

    // read the inputs and create the domain instances
    function createDomainInstances(){
        var domainInstances = {};
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
        return domainInstances;
    }

    $('button#compute-tree').click();
});