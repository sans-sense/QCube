var srcRequire = require.config({
    baseUrl: "../src/",
    shim: {
        "handlebars": {
            exports: 'Handlebars'
        },
        'd3' : {
            exports :'d3'
        },
        'jquery': {
            exports : '$'
        }
    },
    paths: {
        "handlebars" : '../demo/lib/handlebars-1.0.0-rc.3',
        "d3" : '../demo/lib/d3-3.0.8.min',
        "jquery" : '../demo/lib/jquery-1.9.1'
    }
});

window.onload = function() {
    srcRequire(['cubeMaker', 'queryEngine', 'handlebars', 'd3', 'jquery'], function(cubeMaker, queryEngine, Handlebars, d3, $) {
        var tempClasses, columnNames, cubeInternals, tableData, template;
        columnNames = ['id', 'ub', 'lb', 'dim', 'agg', 'pid'];

        tableData = $('#salesData tbody tr').map(function(){
            return [$(this).find('td').map(function(){
                return $(this).text();
            }).get()];
        }).get();

        template = Handlebars.compile($("#array-to-table-template").html());
        cubeInternals = {};
        cubeMaker.exportTo(cubeInternals);
        cubeInternals.configure(tableData);

        tempClasses = cubeInternals.createTempClasses(tableData);
        createTable('#tempClasses', template, columnNames, tempClasses);

        tempClasses = tempClasses.sort(cubeInternals.compareTempClasses);
        createTable('#sortedTempClasses', template, columnNames, tempClasses);

        qcTree = cubeInternals.createQCTree(tempClasses);
        plotQCTree(qcTree, '#qcTree');
    });
    
    function createTable(parentDivIdentifier, template, columnNames, rowData)  {
        var tableIdetifier = parentDivIdentifier + ' table' ;
        $(tableIdetifier).remove();
        $(parentDivIdentifier).append(template({names: columnNames, rows: rowData}));
    }

}

function plotQCTree(qcTree, selector, dims) {
    var dims = dims || {treeOffset:20, width:300, height:300 };
    var vis = d3.select(selector).
        append('svg:svg').attr('width', dims.width).attr('height', dims.height).
        append('svg:g').attr('transform', 'translate(10,10)');

    var tree = d3.layout.tree().size([dims.width - dims.treeOffset,dims.height - dims.treeOffset]);

    var rootNode = qcTree.root;
    var nodes = tree.nodes(rootNode).reverse();
    var i = 0;

    //add id to all of them, no graphic part just associated data
    var allDataNodes = vis.selectAll("g.node").data(nodes, function(d) { return d.id || (d.id = ++i); });

    var allGraphNodes = allDataNodes.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

    allGraphNodes.append("svg:circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d.isLeaf ? "#fff" : "lightsteelblue"; });

    allGraphNodes.append("svg:text")
        .attr("x", function(d) { return d.isLeaf? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.isLeaf ? "end" : "start"; })
        .text(function(d) { return '[' + d.label + ']' + ((d.isLeaf)? ' ' + d.value: ''); })
        .style("fill-opacity", 1);


    // diagonal needed for connectors
    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x -2.25 , d.y -2.25]; });

    var allPathLinks = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    allPathLinks.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            return diagonal({source: d.source, target: d.target});
        })

    var nonEdgeLinks = [];
    function extractNonEdgeLinks(node) {
        var i;
        for ( i = 0; i < node.links.length; i++) {
            nonEdgeLinks.push({source:node, target: node.links[i].end});
        }
        for ( i = 0; i < node.children.length; i++) {
            extractNonEdgeLinks(node.children[i]);
        }
    }
    extractNonEdgeLinks(rootNode);

    var allNonEdgePaths = vis.selectAll("path.nelink")
        .data(nonEdgeLinks, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    allNonEdgePaths.enter().insert("svg:path", "g")
        .attr("class", "nelink")
        .attr("d", function(d) {
            return diagonal({source: d.source, target: d.target});
        })
    
}
