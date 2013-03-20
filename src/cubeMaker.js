define(function(require) {
    var CB = {};

    (function(){
        "use strict";

        var tableData, factIndex, tempClasses, star, dimCount, tcIndex, aggOperation;

        star = '*';
        // since tempclasses are arrays, indices of each field
        tcIndex = {
            classId : 0,
            upperBound : 1,
            lowerBound : 2,
            dimNumber : 3,
            aggregate : 4,
            parentId : 5 
        };

        this.createCube = function(tableData, aggOperation) {
            var qcTree;
            configure(tableData, aggOperation);
            tempClasses = createTempClasses(dimCount, tableData, factIndex);
            tempClasses = tempClasses.sort(compareTempClasses);
            qcTree = createQCTree(tempClasses);
            cleanup();
            return qcTree;
        };

        function configure(pTableData, pAggOperation) {
            tableData = pTableData;
            dimCount = tableData[0].length - 1;
            factIndex = dimCount;
            aggOperation = pAggOperation || { start: 0, iterativeOperation : sumOperation, summaryOperation:null};
        }

        function createTempClasses() {
            var allStarNode;
            tempClasses = [];

            allStarNode = createAllStarNode(dimCount);
            dfs(allStarNode, createNaturalNumberArray(tableData.length), 0, -1);

            return tempClasses;
        }

        /**
         * Array.sort is not guaranteed to be stable by ECMAScript
         */
        function compareTempClasses(clazz1, clazz2) {
            if (('' + clazz1[1]) === ('' + clazz2[1])) {
                // upper bounds are equal so reverse on lower bounds
                return (clazz1[2] < clazz2[2])? 1:-1;
            } else {
                return (clazz1[1] < clazz2[1])? -1:1;
            }
        }

        function createQCTree(tempClasses) {
            var qcTree, lastUB, currentUB, i, classIdVsNodeMap, currentTC, lastNode, parentIdNode;

            qcTree = {};
            classIdVsNodeMap = {};
            currentTC = tempClasses[0];
            lastNode = new QNode(star, -1);
            lastNode.setValueAndUpperBound(currentTC);

            qcTree.root = lastNode;
            lastUB = lastNode.upperBound;
            classIdVsNodeMap[currentTC[tcIndex.classId]]  = lastNode;

            for ( i = 1; i < tempClasses.length; i++) {
                currentTC = tempClasses[i];
                currentUB = currentTC[tcIndex.upperBound];
                if (isEqual(currentUB, lastUB)) {
                    parentIdNode = classIdVsNodeMap[currentTC[tcIndex.parentId]];
                    addEdge(qcTree, currentTC[tcIndex.lowerBound], parentIdNode, lastNode);
                } else {
                    lastNode = insertNodesAndGetLeafNode(qcTree, currentUB, currentTC);
                    classIdVsNodeMap[currentTC[tcIndex.classId]] = lastNode;
                    lastUB = currentUB;
                }
            }
            return qcTree;
        }

        function cleanup() {
            // cleanup after the tree
            tempClasses = null;
            tableData = null;
        }

        function createAllStarNode(wildCardCount) {
            var node = [], i;
            for (i = 0; i < wildCardCount; i++) {
                node.push(star);
            }
            return node;
        }

        /**
         * pid is called chdID in the original paper, they mean the class is a child of chdId, we are
         * calling it parentID instead.
         */
        function dfs(lowerBound, dataIndices, dimNumber, parentId) {
            var aggregate, stats, classId, upperBound, tempClass;

            // if there are no elements in the partition, we can skip it
            if (dataIndices.length === 0) {
                return;
            }
            stats = new CompositeStat(dimCount);
            classId = tempClasses.length;

            aggregate = collectStatsAndCompute(aggOperation, dataIndices, stats);
            upperBound = computeUpperBound(stats, lowerBound, dimCount);

            // we do not handle multiple measures yet
            tempClass = [classId, upperBound, lowerBound, dimNumber, aggregate, parentId];
            tempClasses.push(tempClass);
            
            if (redundantCompute(dimNumber, lowerBound, upperBound)) {
                return;
            }

            processChildren(dimNumber, upperBound, stats, classId);
        }


        // TODO: performance: currently this is run for every partition, this means for the same n records it works again and again
        function collectStatsAndCompute(aggOperation, partition, dimStats) {
            var i, total, value, row, j, dimValue, dimStat, rowIndex;
            total = aggOperation.start;
            for (i = 0; i < partition.length; i++) {
                rowIndex = partition[i];
                row = tableData[rowIndex];
                value = row[factIndex];
                total = aggOperation.iterativeOperation.call(null, value, total);
                for (j = 0; j < dimCount; j++) {
                    dimValue = row[j];
                    dimStats.set(j, dimValue, rowIndex);
                }
            }
            if (aggOperation.summaryOperation) {
                total = aggOperation.summaryOperation.call(null, total, partition);
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

        function processChildren(dimNumber, upperBound, stats, parentId) {
            var i, partitions, partition, j;

            for ( i = dimNumber; i < dimCount; i++) {
                if (upperBound[i] === star) {
                    partitions = createPartitions(stats, i, upperBound);
                    for ( j = 0; j < partitions.length; j++) {
                        partition = partitions[j];
                        dfs(partition.lowerBound, partition.dataIndices, partition.dimNumber, parentId);
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


        function sumOperation(value, total) {
            return total + parseInt(value, 10);
        }

        function createNaturalNumberArray(arrayLength) {
            var naturalNumbers = [], i;
            for (i = 0; i < arrayLength; i++){
                naturalNumbers.push(i);
            }
            return naturalNumbers;
        }
        
        /**
         * Inserts all the nodes needed for the upper bound returning the leaf Node
         *
         */ 
        function insertNodesAndGetLeafNode(tree, upperBound, tempClass) {
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
                            childNode.value = tempClass[tcIndex.aggregate];
                            childNode.upperBound = tempClass[tcIndex.upperBound];
                            childNode.isLeaf = true;
                        }
                        parentNode.addChild(childNode);
                        parentNode = childNode;
                    }
                }
            }
            return childNode;
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

        function  addEdge(tree, tcLowerBound, parentNode, endNode) {
            var i, currentDimValue, parentUpperBound, qLink;
            
            // Find the first dim D s.t.ub:D = * && lb:D != *
            if (parentNode) {
                parentUpperBound = parentNode.upperBound;

                for ( i = 0; i < tcLowerBound.length; i++) {
                    currentDimValue = tcLowerBound[i];
                    if (currentDimValue !== star && parentUpperBound[i] === star) {
                        qLink = new QLink(currentDimValue, i);
                        parentNode.link(qLink, endNode);
                    }
                }
            } else {
                return;
            }
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
        function QNode(label, dimNumber) {
            this.label = label;
            this.dimNumber = dimNumber;
            this.value = null;
            this.upperBound = null;

            this.isLeaf = false;
            this.children = [];
            this.links = [];
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
            this.setValueAndUpperBound = function(tempClass) {
                this.value = tempClass[tcIndex.aggregate];
                this.upperBound = tempClass[tcIndex.upperBound];
            };
            this.link = function(qLink, linkEnd) {
                qLink.end = linkEnd;
                this.links.push(qLink);
            };
        }).call(QNode.prototype);

        /**
         * Named Link to any other node.
         */
        function QLink(label, dimNumber) {
            this.label = label;
            this.dimNumber = dimNumber;
            this.end = null;
        }

        function cloneArray(original) {
            var clonedArray = [];
            clonedArray.push.apply(clonedArray, original);
            return clonedArray;
        }

        function isEqual(a1, a2) {
            return (a1.toString() === a2.toString());
        }
        function prettyFormat(tempClasses) {
            var str = "";
            tempClasses.forEach(function(clazz) {
                str +=  clazz[0] + ", ("+clazz[1] +"), ("+clazz[2] +"), " + clazz[3] + ", " + clazz[4] + ", " + clazz[5] + '\n';
            });
            return str;
        }

        /**
         * Ideally we do not need to see the guts of the implementation, however for 
         * testing, it makes sense to have a magic reference to the important 
         * methods. So exportTo exports the internal methods out for testing. In actual
         * production we should not need this at all.
         */
        this.exportTo = function(nameSpaceHolder) {
            nameSpaceHolder.computeUpperBound = computeUpperBound;
            nameSpaceHolder.createTempClasses = createTempClasses;
            nameSpaceHolder.configure = configure;
            nameSpaceHolder.compareTempClasses = compareTempClasses;
            nameSpaceHolder.createQCTree = createQCTree;
            nameSpaceHolder.prettyFormat = prettyFormat;
        };

    }).call(CB);
    return CB;
});