var CB = {};

(function(){
    var tableData, factIndex, tempClasses, star, dimCount;

    star = '*';

    this.createCube = function(tableData, factIndex) {
        var rootNode;
        tableData = tableData;
        factIndex = factIndex;

        dimCount = tableData[0].length - 1;

        // this is the all star node
        rootNode = createRootNode(dimCount);

        tempClasses = [];

        //start with dfs on rootNode
        dfs(rootNode, createNaturalNumberArray(tableData.length), 0);

        // merge tempclasses

        // remove lower bounds that descendents in merged classes

        // TODO return what was really meant
        return tempClasses;
    };

    function createRootNode(wildCardCount) {
        var node = [], i;
        for (i = 0; i < wildCardCount; i++) {
            node.push(star);
        }
        return node;
    }

    function dfs(node, partition, dimNumber, pId) {
        var aggregate, stats;
        stats = new CompositeOrderedHash(dimCount);

        // we use stats while computing the upper bound jumps
        aggregate = collectStatsAndAdd(computeSum, partition, stats);
        
        upperBound = computeUpperBound(stats, node, dimCount);
    }

    // TODO this should handle any operation, meaning we need to get the initial value and then incrementatlly operate, something like iteratee
    function collectStatsAndAdd(operation, partition, dimStats) {
        var i, total, value, row, j, dimValue, dimStat;
        total = 0;
        for (i = 0; i < partition.length; i++) {
            row = tableData[rowIndex];
            value = row[factIndex];
            total = operation.apply(this, [value, total]);
            for (j = 0; j < dimCount; j++) {
                dimValue = row[j];
                dimStats.set(j, dimValue, i);
            }
        }
    }

    function computeSum(value, total) {
            return total + value;
    }

    function createNaturalNumberArray(arrayLength) {
        var naturalNumbers = [], i;
        for (i = 0; i < arrayLength; i++){
            naturalNumbers.push(i);
        }
    }
    
    function computeUpperBound(stats, lowerBound, dimCount) {
        var upperBound, i, dimValue;
        upperBound = [];
        upperBound.push.apply(upperBound, lowerBound);

        for (i = 0; i < dimCount; i++) {
            dimValue = lowerBound[i];
            
            if(dimValue === star){
                if(stats[i].order_keys.length === 1){
                    upperBound[i] = stats[i].order_keys[0];
                }
            }else{
                upperBound[i] = dimValue;
            }
        }
        return upperBound; 
    }

    function OrderedHash(){
        this.data = {};
        this.order_keys = [];
    }

    (function(){
        this.set = function(key, value) {
            this.data[key] = value;
            this.order_keys.push(key);
        };

        this.get = function(key) {
            return this.data[key];
        };
    }).call(OrderedHash.prototype);

    function CompositeOrderedHash() {
        var i;
        this.hashes = [];
        for( i = 0; i < dimCount; i++) {
            this.hashes.push(new OrderedHash());
        }
        this.get = function(index) {
            return this.hashes[index];
        };
        this.set = function(dimIndex, dimValue, rowIndex){
            var dimStat = this.hashes[dimIndex];
            if (!dimStat.get(value)) {
                dimStat.set(value, []);
            }
            //TODO: performance: we are doing get twice, should avoid
            dimStat.get(value).push(rowIndex);
        };
    }

    this.computeUpperBound = computeUpperBound;

}).call(CB);