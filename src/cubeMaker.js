
var CB = {};

(function(){
    "use strict";

    var tableData, factIndex, tempClasses, star, dimCount;

    star = '*';
    
    this.createCube = function(tableData) {
        var qcTree;
        configure(tableData);
        tempClasses = createTempClasses(dimCount, tableData, factIndex);
        tempClasses = sortTempClasses(tempClasses);
        qcTree = createQCTree(tempClasses);
        return qcTree;
    };

    function configure(pTableData) {
        tableData = pTableData;
        dimCount = tableData[0].length - 1;
        factIndex = dimCount;
    }

    function createTempClasses() {
        var allStarNode;
        tempClasses = [];

        allStarNode = createAllStarNode(dimCount);
        dfs(allStarNode, createNaturalNumberArray(tableData.length), 0);

        return tempClasses;
    }

    function sortTempClasses(tempClasses) {
        return tempClasses.sort(function(clazz1, clazz2) {
            return (clazz1[1] < clazz2[1])? -1:1;
        });
    }

    function createQCTree(tempClasses) {
        var qcTree, lastUB, currentUB, i;
        qcTree = {};
        qcTree.root = new QNode('root', -1, tempClasses[0][4]);
        lastUB = tempClasses[0][1];

        for ( i = 1; i < tempClasses.length; i++) {
            currentUB = tempClasses[i][1];
            if (isEqual(currentUB, lastUB)) {
                //TODO create edge between current ub and last UB for the dim on which they differ
            } else {
                insertNodes(qcTree, currentUB, tempClasses[i][4]);
                lastUB = currentUB;
            }
        }
        return qcTree;
    }

    function createAllStarNode(wildCardCount) {
        var node = [], i;
        for (i = 0; i < wildCardCount; i++) {
            node.push(star);
        }
        return node;
    }

    function dfs(lowerBound, dataIndices, dimNumber, pId) {
        var aggregate, stats, classId, upperBound, tempClass;

        // if there are no elements in the partition, we can skip it
        if (dataIndices.length === 0) {
            return;
        }
        stats = new CompositeStat(dimCount);
        classId = tempClasses.length;

        aggregate = collectStatsAndAdd(computeSum, dataIndices, stats);
        upperBound = computeUpperBound(stats, lowerBound, dimCount);

        // we do not handle multiple measures yet
        tempClass = [classId, upperBound, lowerBound, dimNumber, aggregate];
        tempClasses.push(tempClass);
        
        if (redundantCompute(dimNumber, lowerBound, upperBound)) {
            return;
        }

        processChildren(dimNumber, upperBound, stats);
    }


    // TODO this should handle any operation, meaning we need to get the initial value and then incrementatlly operate, something like iteratee
    // TODO: performance: currently this is run for every partition, this means for the same n records it works again and again
    function collectStatsAndAdd(aggOperation, partition, dimStats) {
        var i, total, value, row, j, dimValue, dimStat, rowIndex;
        total = 0;
        for (i = 0; i < partition.length; i++) {
            rowIndex = partition[i];
            row = tableData[rowIndex];
            value = row[factIndex];
            total = aggOperation.call(value, total);
            for (j = 0; j < dimCount; j++) {
                dimValue = row[j];
                dimStats.set(j, dimValue, i);
            }
        }
        return total;
    }

    function computeUpperBound(stats, lowerBound, dimCount) {
        var upperBound, i, dimValue;
        upperBound = cloneArray(lowerBound);

        for (i = 0; i < dimCount; i++) {
            dimValue = lowerBound[i];
            
            if(dimValue === star){
                if(stats.get(i).order_keys.length === 1){
                    upperBound[i] = stats.get(i).order_keys[0];
                }
            }else{
                upperBound[i] = dimValue;
            }
        }
        return upperBound; 
    }

    /**
      * if lowerBound is (*,*,10) and upperBound is (*,F,10) and dimNumber 2, the compute is redundant
      * as all combinations have already been computed.  Original data was [[80,f,10], [97, f,10]]
      */
    function redundantCompute(dimNumber, lowerBound, upperBound) {
        var i;
        for( i = 0; i < (dimNumber -1); i++){
            if((lowerBound[i] === star ) && (upperBound[i] !== star)){
                return true;
            }
        }
        return false;
    }

    function processChildren(dimNumber, upperBound, stats) {
        var i, partitions, partition, j;

        for ( i = dimNumber; i < dimCount; i++) {
            if (upperBound[i] === star) {
                partitions = createPartitions(stats, i, upperBound);
                for ( j = 0; j < partitions.length; j++) {
                    partition = partitions[j];
                    dfs(partition.lowerBound, partition.dataIndices, partition.dimNumber);
                }
            }
        }
    }

    function createPartitions(stats, dimNumber, parentUpperBound) {
        var stat, keyLength, i, partitions, dimValue, lowerBound;
        stat = stats.get(dimNumber);
        keyLength = stat.order_keys.length;
        partitions = [];

        for (i = 0; i < keyLength; i++) {
            dimValue = stat.order_keys[i];
            lowerBound = cloneArray(parentUpperBound);
            lowerBound[dimNumber] = dimValue;
            partitions.push({lowerBound:lowerBound, dimNumber: dimNumber, dataIndices: stat.data[dimValue]});
        }
        return partitions;
    }


    function computeSum(value, total) {
            return total + value;
    }

    function createNaturalNumberArray(arrayLength) {
        var naturalNumbers = [], i;
        for (i = 0; i < arrayLength; i++){
            naturalNumbers.push(i);
        }
        return naturalNumbers;
    }
    
    function insertNodes(tree, upperBound, value) {
        var i, dimValue, parentNode, childNode;
        parentNode = tree.root;
        // insert all the non * as nodes in the tree
        for ( i = 0; i < upperBound.length; i++) {
            dimValue = upperBound[i];
            if (dimValue !== star) {
                childNode = parentNode.findChild(i, dimValue);
                if (childNode) {
                    parentNode = childNode;
                } else {
                    childNode = new QNode(dimValue, i);
                    if ( noStarAfterThis(upperBound, i)) {
                        childNode.value = value;
                        childNode.isLeaf = true;
                    }
                    parentNode.addChild(childNode);
                    parentNode = childNode;
                }
            }
        }
    }

    function noStarAfterThis(valueArray, currentIndex) {
        var i;
        for ( i = currentIndex + 1; i < valueArray.length; i++) {
            if (valueArray[i] !== star) {
                return false;
            }
        }
        return true;
    }

    /**
      * Captures information about a dimension, details like which data correspond to 
      * these value and what are the possible values allowed for this dimension
      */
    function DimensionStat(){
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
    }).call(DimensionStat.prototype);

    /**
      * Placeholder for multiple DimensionStat
      */
    function CompositeStat() {
        var i;
        this.hashes = [];
        for( i = 0; i < dimCount; i++) {
            this.hashes.push(new DimensionStat());
        }
        this.get = function(index) {
            return this.hashes[index];
        };
        this.set = function(dimIndex, dimValue, rowIndex){
            var dimStat = this.hashes[dimIndex];
            if (!dimStat.get(dimValue)) {
                dimStat.set(dimValue, []);
            }
            //TODO: performance: we are doing get twice, should avoid
            dimStat.get(dimValue).push(rowIndex);
        };
    }

    /**
      * A node that captures label, value and children
      */
    function QNode(label, dimNumber, value, isLeaf) {
        this.label = label;
        this.value = value;
        this.children = [];
        this.edges = [];
        this.dimNumber = dimNumber;
        this.isLeaf = (isLeaf)? true:false;
    }

    (function(){
        this.addChild = function(childNode) {
            this.children.push(childNode);
        };
        this.findChild = function(dimNumber, label) {
            var i, child;
            for ( i = 0; i < this.children.length; i++) {
                child = this.children[i];
                if (( child.dimNumber === dimNumber ) && (child.label === label)) {
                    return child;
                }
            }
            return null;
        };
    }).call(QNode.prototype);

    /**
      * Named Link to any other node.
      */
    function QLink(label, endNode) {
        this.label = label;
        this.endNode = endNode;
    }

    function cloneArray(original) {
        var clonedArray = [];
        clonedArray.push.apply(clonedArray, original);
        return clonedArray;
    }

    function isEqual(a1, a2) {
        return (a1.toString() === a2.toString());
    }

    /**
      * Ideally we do not need to see the guts of the implementation, however for 
      * testing, it makes sense to have a magic reference to the important 
      * methods. So exportTo exports the internal methods out for testing. In actual
      * production we should not need this at all.
      */
    function exportTo(nameSpaceHolder) {
        nameSpaceHolder.computeUpperBound = computeUpperBound;
        nameSpaceHolder.createTempClasses = createTempClasses;
        nameSpaceHolder.configure = configure;
        nameSpaceHolder.sortTempClasses = sortTempClasses;
        nameSpaceHolder.createQCTree = createQCTree;
    }

    this.exportTo = exportTo;
}).call(CB);