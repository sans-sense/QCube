/**
   * RemoteCube is a server aware Cube implementation, it handles communication with the 
   * server to get values.
   *
   */
function RemoteCube() {
}

(function(){
    var rootUrl, data, dimValues, dimNameVsIndexMap, dimCount;

    rootUrl = '/find?payload=';
    data = null;
    dimValues = [];
    dimNameVsIndexMap = {};

    this.initialize = function() {
        var url = rootUrl + 'cubeSpec';
        var self = this;
        $.ajax({url:url, async:false, success: function(result){self.cubeSpec  = result}});
        dimCount = this.cubeSpec.dimensions.length;
        constructNameVsIndexMap(this.cubeSpec);
    };

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

    this.startCompute = function(currentDims) {
        var dimIndexes, criteria, url;
        dimIndexes = _.map(currentDims, function(dimName) { return dimNameVsIndexMap[dimName]; });
        criteria = createAllStarCriteria(dimCount);
        _.each(dimIndexes, function(dimIndex) { criteria[dimIndex] = this.values(dimIndex)});
        url = rootUrl + createSearchSpec('find', criteria);
        $.ajax({url:url, async:false, success: function(result){
            _.each(result, function(value) {
                for (key in value) {
                    data[key] = value[key];
                }
            });
        }});
    }

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

}).call(RemoteTree.prototype)