if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(['treeMaker', 'queryEngine'], function(treeMaker, queryEngine) {
    var QC = {};

    (function(){
        "use strict";
        var qcTree, cubeSpec, data;

        this.createCube = function(pCubeSpec, pData) {
            cubeSpec = pCubeSpec;
            data = pData;
            qcTree = treeMaker.createTree(data, cubeSpec.aggregation);
            if (cubeSpec.measureNames.length === 1) {
                cubeSpec.measureName = cubeSpec.measureNames[0];
            }
            return new HyperCube();
        };

        function HyperCube() {
            
        }
        
        (function(){
            this.getSpec = function() {
                return cubeSpec;
            };
            this.find = function(criteria) {
                return queryEngine.find(qcTree, criteria);
            };
            this.findAllDimensionValues = function(dimensionIndex) {
                return queryEngine.findAllDimensionValues(qcTree, dimensionIndex);
            };
            this.getTableData = function() {
                return data;
            };
        }).call(HyperCube.prototype);
    }).call(QC);
    return QC;
});