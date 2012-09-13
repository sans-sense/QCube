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
            var model  = new PivotTableModel(dimensions, de.measure, de.tree);
            model.compute();
            de['model'] = model;
            new PivotRenderer('table', model).draw();
            $('i.icon-trash').click(function() {
                var dimName = $(this).parents('th').attr('data'); 
                if (_.contains(dimensions, dimName)){
                    dimensions = _.reject(dimensions, function(dim) {return dim === dimName;});
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
});