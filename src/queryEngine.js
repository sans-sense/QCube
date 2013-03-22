define(function(require) {
    var QE = {};

    (function(){
        "use strict";

        var star;
        star = '*';

        this.find = function(qcTree, query) {
            var i;
            for ( i = 0; i < query.length; i++) {
                if (isArray(query[i])) {
                    return doRangeQuery(qcTree, query);
                }
            }
            return doPointQuery(qcTree, query);
        };

        this.findAllDimensionValues = function(qcTree, dimensionIndex) {
            return qcTree.dimensionStats[dimensionIndex];
        };

        /**
         * Output: aggregate value(s) of q.
         * Method:
         * // process the dimension values in q one by one. find a
         * route in QC-tree by calling a function searchRoute.
         * 1. Initialize newRoot. newRoot=the root node of T
         * 2. for each value vi in q && newRoot 6= NULL
         * // reach for the next node with label vi
         * newRoot = searchRoute(newRoot; vi);
         * 3. if newRoot = NULL, return null;
         * else if it has aggregate value(s)
         * return its aggregate(s);
         * else
         * Keep picking the child corresponding to the last
         * dimension of the current node, until we reach a
         * node with aggregate values, and return them;
         * Function searchRoute(newRoot; vi)
         * // find a route from newRoot to a node labeled vi:
         * if newRoot has a child or link pointing to N labeled vi
         * newRoot = N;
         * else
         * Pick the last child N of newRoot labeled by a value
         * in the last dimension, say j;
         * if (j < the dimension of vi) call searchRoute(N; vi);
         * else return null;
         */
        function doPointQuery(qcTree, query) {
            var i, criteria, value, newRoot;

            value = null;
            criteria = createCriteria(query);

            // initialize newRoot to root
            newRoot = qcTree.root;

            while(criteria.next !== null && newRoot !== null) {
                criteria = criteria.next;
                newRoot = searchRoot(newRoot, criteria);
            }

            if (newRoot)  {
                value = getNodeWithValue(newRoot).value;
            }
            return value;
        }

        /**
         *  Function rangeQuery(q; newRoot; i)
         *  base case;
         * if i > the last non-* dimension in q,
         *if newRoot = NULL. do nothing;
         *if newRoot has aggregate value
         *Add its aggregate to results
         *else
         *Keep picking the child with a value on the last
         *dimension until we reach a node with aggregate value,
         *add its aggregate to results.
         *return;
         * recursion;
         *if in q, i is not a range dimension
         *Call searchRoute(newRoot; vi),
         *Let newRoot be the return node
         *if newRoot is not NULL
         *Call rangeQuery(q; newRoot; i + 1)
         *
         *else, for each value vim in the range
         *Call searchRoute(newRoot; vim),
         *Let newRoot be the return node
         *if newRoot is not NULL
         *Call rangeQuery(q; newRoot; i + 1)
         */

        function doRangeQuery(qcTree, query) {
            var criteria, results;
            results = [];
            criteria = createCriteria(query);
            recursiveRangeQuery(qcTree, criteria.next, qcTree.root, 0, results, query);
            return results;
        }

        function createCriteria(query) {
            var i, criteria, lastTuple;
            criteria = new QueryDimTuple(-1, star);
            lastTuple = criteria;

            for ( i = 0; i < query.length; i++) {
                if (query[i] !== star) {
                    lastTuple.next = new QueryDimTuple(i, query[i]);
                    lastTuple = lastTuple.next;
                }
            }
            return criteria;
        }

        function searchRoot(root, criteria, valueIndex) {
            var newRoot, i, rootIndex;

            if (criteria === null) {
                return null;
            } else {
                // if root points to any edge or link labeled criteria return the end of that edge or link
                for ( i = 0; i < root.children.length; i++) {
                    if (criteria.matches(root.children[i], valueIndex)) {
                        return  root.children[i];
                    }
                }
                
                // if root points to any link
                for (i = 0; i < root.links.length; i++) {
                    if (criteria.matches(root.links[i], valueIndex)) {
                        return root.links[i].end;
                    }
                }

                // we did not find any edge or link, so pick the last child N of root with j < criteria.index
                for ( i = 0; i < root.children.length; i++ ) {
                    if (root.children[i].dimNumber < criteria.index) {
                        return searchRoot(root.children[i], criteria);
                    }
                }
            }
            return null;
        }

        function getNodeWithValue(qNode) {
            var nodeWithAgg;
            nodeWithAgg = (qNode.value !== null)? qNode : pickLast(qNode);
            return nodeWithAgg;
        }


        function recursiveRangeQuery(qcTree, criteria, newRoot, index, results, query) {
            var  currRoot, i, nodeWithValue, result;
            if (!criteria) {
                if (newRoot) {
                    nodeWithValue = getNodeWithValue(newRoot);
                    result = {};
                    result[nodeWithValue.upperBound] = nodeWithValue.value;
                    results.push(result);
                }
            }

            if (criteria) {
                if (!isArray(query[criteria.index])) {
                    currRoot = searchRoot(newRoot, criteria);
                    if (currRoot) {
                        recursiveRangeQuery(qcTree, criteria.next, currRoot, index + 1, results, query);
                    }
                } else {
                    for ( i = 0; i < criteria.value.length; i++) {
                        currRoot = searchRoot(newRoot, criteria, i);
                        if (currRoot) {
                            recursiveRangeQuery(qcTree, criteria.next, currRoot, index + 1, results, query);
                        }
                    }
                }
            }
        }


        function pickLast(qNode) {
            if (qNode.value !== undefined && qNode.value !== null) {
                return qNode;
            } else {
                return pickLast(qNode.children[0]);
            }
        }

        function QueryDimTuple(index, value) {
            this.index = index;
            this.value = value;
            this.next = null;
            this.matches = function(node, valueIndex) {
                var firstValue;
                firstValue = (isArray(this.value))? this.value[valueIndex] : this.value;
                return (this.index === node.dimNumber) && (firstValue === node.label);
            };
            this.last = function() {
                return ((this.next && this.next.last()) || this);
            };
        }

        function isArray(value) {
            return (value && Object.prototype.toString.call(value) == '[object Array]');
        }

    }).call(QE);
    return QE;
});