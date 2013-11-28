function setupDemo(demoExports) {
    var de; 
    var tree;
    var measure;
    var currentDimensions;

    de = demoExports;
    currentDimensions = [];

    if (typeof String.prototype.format !== 'function') {
        String.prototype.format = function() {
            var formatted = this, i;
            for (i = 0; i < arguments.length; i++) {
                formatted = formatted.replace("[" + i + "]", arguments[i]);
            }
            return formatted;
        };
    }
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            var str = this;nct
            // AN typeof recipe for disaster in IE8
            // if (!str || typeof str !== 'string') {
            if (!str) {
                return "";
            } else {
                str = str.toString();
                return str.replace(/^[\s]+/, '').replace(/[\s]+$/, '').replace(/[\s]{2,}/, ' ');
            }
        };
    }

    function drawModel() {
        var model = new PivotTableModel(currentDimensions, measure, tree);
        model.compute();
        de['model'] = model;
        new PivotRenderer('table', model).draw();
        $('i.icon-trash').click(function() {
            var dimName = $(this).parents('th').attr('data');
            if (_.contains(currentDimensions, dimName)){
                currentDimensions = _.reject(currentDimensions, function(dim) {return dim === dimName;});
                drawModel();
            }
        });
    }


    // create drag functionality and add it to the relevant sections
    function addDragDrop(measure) {
        function doDragOver(event) {
            var isLink = event.dataTransfer.types.contains("text/uri-list");
            if (isLink)
                event.preventDefault();
        }


        function handleDrop(e) {
            var urlTokens, tableName;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            urlTokens = e.dataTransfer.getData("text/uri-list").split("#");
            if (urlTokens && urlTokens.length > 0) {
                tableName = urlTokens [1];
                if (_.contains(currentDimensions, tableName) === false) {
                    currentDimensions.push(tableName);
                    drawModel(currentDimensions);
                }
            }
            return false;
        }

        var selector = "div.report";
        $(selector).each(function() {
            this.ondrop = handleDrop
            this.ondragover = doDragOver;
        });
    }

    
    function addCompute() {
        var targetBtn = 'button#toggle-data';
        $(targetBtn).click(function(){
            var btnHtml;
            $('div.data').toggle();
            btnHtml = (($('div.data:visible').length > 0)? 'Hide':'Show') + ' Data';
            $(targetBtn).html(btnHtml);
        });

        $('button#compute-tree').click(function(){
            var domainInstances = createDomainInstances();
            demoExports.computeQCTree(domainInstances);
        });
    }
    
    function addDimensionAndMeasureToPage(dimensions, measure) {
        _.each(measure, function(measure){
            $('ul.facts li:last').after('<li >[0]</li>'.format(measure));
        });


        _.each(dimensions, function(dimension){
            $('ul.dimensions li:last').after('<li ><a href="#[0]">[1]</a></li>'.format(dimension, dimension));
        });
    }

    function setupPage(cube) {
        var cubeSpec, dimensions;
        cubeSpec = cube.cubeSpec;
        // AN hack get your cubespec right
        dimensions = cubeSpec.dimensions || cubeSpec.dimensionNames;
        measure = cubeSpec.measure || cubeSpec.measureNames;
        tree = cube.tree;
        addDimensionAndMeasureToPage(dimensions, measure);
        addDragDrop(measure);
        drawModel();
    }

    de['setupPage'] = setupPage;
}
