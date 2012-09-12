(function(){

    var und;

    // compatibility with node
    try{
        if (_ && _.VERSION) {
            und = _;
        } else {
            und = require('./../../lib/underscore-min.js');;
        }
    }catch(e) {
        und = require('./../../lib/underscore-min.js');
    }

    function Indexer() {
    };

    (function(){
        var QC;
        var qCube;
        var data;
        var indexes;

        /**
         *  Indexes the data based on details from qCube. 
         *     This is the entry point for all subsequent calls, 
         */
        this.index = function(pData, pQCube, pQCNamespace) {
            QC = pQCNamespace;
            qCube = pQCube;
            data = pData;
            if (!QC.OrderedHash.prototype.add) {
                (function (){
                    this.add = function(key, value) {
                        var valueArray;
                        if (!(valueArray = this.get(key))) {
                            valueArray = [];
                            this.set(key, valueArray);
                        }
                        valueArray.push(value);
                    };
                    this.length = function(key) {
                        return (this.data[key] || []).length;
                    };
                }).call(QC.OrderedHash.prototype);
            }
            _index();
        };
        this.get = function(criteria) {
            if (!indexes) {
                throw "Need to create indexes before any operation, call the index method";
            }
            console.log(criteria);
            // simplest scenario, multiple dimensions, but single values
            // order the dims as per the length of values for value in that particular dim and then scan through
            var reverseLookup = {};
            var sortedDimValues = und.sortBy(criteria, function(value, dimName) {
                // will crash and burn if the value is same in two dimensions
                reverseLookup[value] = dimName;
                if (!(indexes[dimName].get(value))) {
                    console.log('No value found for ' + dimName + ' ' +value);
                }
                return -1 * (indexes[dimName].get(value) || []).length;
            });

            var filteredIndexes;
            und.each(sortedDimValues, function(dimValue) {
                var dimName = reverseLookup[dimValue];
                var rowIndexes = indexes[dimName].get(dimValue);
                if (filteredIndexes) {
                    filteredIndexes = und.intersection(filteredIndexes, rowIndexes);
                } else {
                    filteredIndexes = rowIndexes;
                }
            });

            return und.map(filteredIndexes, function(value) { return data[value];});
        };

        // Actual implementaion of index which goes through all dims and their values, creates an index per dim
        function _index() {
            var dims = qCube.dimensions();
            indexes = [];
            // create an index for each dimension
            und.each(dims, function(dimension) {
                var index = new QC.OrderedHash();
                indexes[dimension] = index;
            });
            und.each(data, function(row, rowNumber) {
                und.each(dims, function(dimension, dimIndex) {
                    indexes[dimension].add(row[dimIndex], rowNumber);
                });
            });
            console.log('Indexes created  for '+dims.length + ' dims and ' + data.length+'  row');
        }
        
    }).call(Indexer.prototype);

    var indexer = new Indexer();

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = indexer;
        }
        exports.indexer = indexer;
    }
}());
