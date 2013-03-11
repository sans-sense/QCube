var QC = {};

(function(){
    var all = '___all';
    var QueryTypes = {point:"point",range:"range"};
    var cubeSpec;
    var hyperCube;
    var tableData;

    this.createCube = function(cubeSpecOptions, tableData) {
        cubeSpec = new CubeSpec(cubeSpecOptions);
        hyperCube = new HyperCube(tableData);
        return hyperCube;
    };

    this.getSpec = function() {
        return cubeSpec;
    };

    this.star = '*';

    var sumFunction = function(table,partition){
        var sum =0;
        var i,rowIndex;
        for(i=0;i<partition.length;i++) {
            rowIndex = partition[i];
            sum = sum + parseInt(table.dataValue(rowIndex,measure), 10);
        }
        return [(sum/partition.length).toFixed(2)];
    };

    this.aggregationFunctions = {
        'sum' :  sumFunction,
        'count': function(table,partition){
            return partition.length;
        }
    };


    function CubeSpec(modelSpec) {
        this.dimensionNames = modelSpec.dimensionNames || [];
        this.measureNames = modelSpec.measureNames ||  [];
        this.aggregationFunction = modelSpec.aggregationFunction || sumFunction;
        this.measureName = this.measureNames[0];
    }

    (function() {
    }).call(CubeSpec.prototype);

    function HyperCube(pTableData) {
        tableData = pTableData || [];
    }

    (function() {
        this.getSpec = function() {
            return cubeSpec;
        };
        this.getTableData = function() {
            return tableData;
        };
    }).call(HyperCube.prototype);




    // internal utils
    function min(a, b) {
        return (a < b)? a : b;
    }
    function max(a, b) {
        return (a < b)? b : a;
    }
    function isArray(object) {
        return Object.prototype.toString.call(object) === "[object Array]";
    }
}).call(QC);
