var srcRequire = require.config({
    baseUrl: "../src/",
});
window.onload = function() {
    srcRequire(['cubeMaker', 'queryEngine'], function(cubeMaker, queryEngine) {
        var tempClasses, source, template, tempHTML, columnNames;
        columnNames = ['id', 'ub', 'lb', 'dim', 'agg', 'pid'];
        window.cubeMaker = cubeMaker;
        window.queryEngine = queryEngine;
        var tableData = $('#salesData tbody tr').map(function(){
            return [$(this).find('td').map(function(){
                return $(this).text();
            }).get()];
        }).get();
        var colNames = $('#salesData thead tr th').map(function(){ return $(this).text()}).get();
        var cubeInternals = {};
        cubeMaker.exportTo(cubeInternals, function sum(value, total){ return total + parseInt(value);});
        cubeInternals.configure(tableData);
        tempClasses = cubeInternals.createTempClasses(tableData);
        source   = $("#array-to-table-template").html();
        template = Handlebars.compile(source);

        $('#tempClasses table').remove();
        $('#tempClasses').append(template({names: columnNames, rows: tempClasses}));

        tempClasses = tempClasses.sort(cubeInternals.compareTempClasses);
        $('#sortedTempClasses table').remove();
        $('#sortedTempClasses').append(template({names: columnNames, rows: tempClasses}));
    });
}

