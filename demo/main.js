var srcRequire = require.config({
    baseUrl: "../src/",
});
window.onload = function() {
    srcRequire(['cubeMaker', 'queryEngine'], function(cubeMaker, queryEngine) {
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
        var tempClasses = cubeInternals.createTempClasses(tableData);
        $(tempClasses).map(function(){return {id:this[0], ub:this[1], lb:this[2], value:this[4]};}).get();
    });
}

