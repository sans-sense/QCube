var QE = {};

(function(){
    "use strict";

    var star;
    star = '*';

    this.find = function(qcTree, query) {
        return doPointQuery(qcTree, query);
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
            if (newRoot.value !== null) {
                value = newRoot.value;
            } else {
                // keep picking the child corresponding to the last dimension 
                // of the current node till we hit one with aggregate
                value = pickLast(newRoot).value;
            }
        }
        return value;
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

    function searchRoot(root, criteria) {
        var newRoot, i, rootIndex;

        if (criteria === null) {
            return null;
        } else {
            // if root points to any edge or link labeled criteria return the end of that edge or link
            for ( i = 0; i < root.children.length; i++) {
                if (criteria.matches(root.children[i])) {
                    return  root.children[i];
                }
            }
            
            // if root points to any link
            for (i = 0; i < root.links.length; i++) {
                if (criteria.matches(root.links[i].end)) {
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
        this.matches = function(node) {
            return (this.index === node.dimNumber) && (this.value === node.label);
        };
    }

}).call(QE);