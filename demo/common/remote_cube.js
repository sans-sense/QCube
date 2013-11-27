/**
   * RemoteCube is a server aware Cube implementation, it handles communication with the 
   * server to get values.
   *
   */
function RemoteCube() {
    this.init();
}

(function(){
    var rootUrl, data, dimValues, dimNameVsIndexMap, dimCount;

    rootUrl = '/find?payload=';
    data = null;
    dimValues = [];
    dimNameVsIndexMap = {};
    
    function translateToQuery(currentDims) {
        var query, dimIndex;
        query = createRootQuery(dimCount);
        _.each(currentDims, function(dimName) {
            dimIndex = dimNameVsIndexMap[dimName];
            query[dimIndex] = dimValues[dimIndex];
        });
        return query;
    }

    function createQueryVsResultMap(data, currentDims) {
        var currentDimIndices, transformedResult;
        transformedResult = {};
        
        currentDimIndices = _.map(currentDims, function(dimName){return dimNameVsIndexMap[dimName]});
        _.each(data, function(result) {
            var queryCriteria;
            // for root query, no dim indices would be present
            if (currentDimIndices && currentDimIndices.length > 0) {
                queryCriteria = _.map(currentDimIndices, function(dimIndex){
                    return result.key[dimIndex];
                });
            } else {
                queryCriteria = "";
            }
            transformedResult[queryCriteria] = result.value;
        });
        return transformedResult;
    }

    function createRootQuery(dimCount) {
        var query, i;
        query = [];
        for(i = 0; i < dimCount; i++){
            query.push('*');
        }
        return query;
    }

    this.init = function() {
        var url = rootUrl + 'cubeSpec';
        var self = this;
        $.ajax({url:url, async:false, success: function(result){self.cubeSpec  = result}});
        dimCount = this.cubeSpec.dimensions.length;
        constructNameVsIndexMap(this.cubeSpec);
        constructDimValueArray(this.cubeSpec);
    };

    this.enhancePivotTableModel = function() {
        // wrap the original compute for remote tree
        var originalCompute = PivotTableModel.prototype.compute;

        (function () {
            // gets all the values for this dimensional combination
            this.compute = function() {
                var url, currDims;
                currDims = this.dimensions;
                url = rootUrl + createSearchSpec('find', translateToQuery(currDims));
                $.ajax({url:url, async:false, success: function(result){data = createQueryVsResultMap(result, currDims)}});
                originalCompute.call(this);
            }
        }).call(PivotTableModel.prototype);
    }

    this.remoteTree = {
        values:function(dimName) {
            return dimValues[dimNameVsIndexMap[dimName]];
        },

        findAll:function(criteria) {
            var key = _.map(criteria, function(value){return value}).toString();
            return data[key];
        }

    }

    this.values = function(dimension) {
        var url = rootUrl + createSearchSpec('findAllDimensionValues', dimensionIndex);
        var result = dimValues[dimensionIndex]
        if (!result) {
            $.ajax({url:url, async:false, success: function(dimData){result = dimData}});
            dimValues[dimensionIndex] = result;
        }
        return result;
    };

    this.findAll = function(criteria) {
        var key = _.map(criteria, function(value){return value}).toString();
        return data[key];
    };


    function createSearchSpec(methodName, methodArgs) {
        return escape(JSON.stringify({method:methodName, args: methodArgs}));
    }

    function constructNameVsIndexMap(cubeSpec) {
        var dims, i ;
        dims = cubeSpec.dimensions;
        for (i = 0; i < dims.length; i++) {
            dimNameVsIndexMap[dims[i]] = i;
        }
    }

    function constructDimValueArray(cubeSpec) {
        var url;
        _.each(cubeSpec.dimensions, function(d, index){
            url = rootUrl + createSearchSpec('findAllDimensionValues', index);
            $.ajax({url:url, async:true, success: function(result){
                dimValues.push(result);
            }});
        });
    }

}).call(RemoteCube.prototype)

