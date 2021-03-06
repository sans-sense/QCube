// PivotTableModel is a model for pivot table which can compute using the qc tree via compute method
// dimensions is string array and measure is single string value
// contract for qcTree, must have methods "[] values(dimension)" ""
function PivotTableModel(dimensions, measure, qcTree) {
    this.dimensions = dimensions;
    this.measure = measure;
    this.qcTree = qcTree;
}

(function(){
    var currentColumnIndex;
    var columnModels;

    function getDimensionValues(dimension, qcTree) {
        return qcTree.values(dimension);
    };

    function getFactValue(dimensions, dimensionValues, measure, qcTree) {
        var criteria = {}, result;
        _.map(dimensions, function(dimension, index) {
            criteria[dimension] = dimensionValues[index];
        });
        result = qcTree.findAll(criteria);
        return (result)? result : 0;
    };

    this.compute = function() {
        self = this;
        columnModels = [];
        currentColumnIndex = 0;
        prevColumnModel = null;

        if (this.qcTree.startCompute) {
            this.qcTree.startCompute(this.dimensions);
        }

        // create column model for each dimension
        _.each(this.dimensions, function(dimension) {
            var columnModel = new ColumnModel(dimension, prevColumnModel);
            columnModel.uniqueValues = getDimensionValues(dimension, self.qcTree);
            columnModels.push(columnModel);
            prevColumnModel = columnModel;
        });

        _.each(columnModels, function(columnModel) {columnModel.data();});

        // one for the fact
        var factModel = new ColumnModel(this.measure, prevColumnModel, true);
        // calculate the data for fact model
        var preComputedValues = [];
        var combinationsTillMe = (factModel.previous)? factModel.previous.combinationsTillMe():1;
        var i, dimValues, measureValue;
        for (i = 0; i < combinationsTillMe; i++) {
            dimValues = _.map(self.dimensions, function(dimension, index) {return columnModels[index].value(i);});
            measureValue = getFactValue(self.dimensions, dimValues,self.measure, self.qcTree);
            preComputedValues.push(new CellData(i, 1, measureValue));
        }
        factModel.preComputedValues = preComputedValues;
        columnModels.push(factModel);
    };

    
    this.columnModelIterator = function() {
        return new ColumnIterator(columnModels);
    };

    function ColumnIterator(models) {
        var cursor = 0;
        this.next = function() {
            return models[cursor++];
        };
        this.rewind = function() {
            cursor = 0;
        }
    }
    
    function ColumnModel(columnName, previous, isMeasure) {
        this.columnName = columnName;
        this.uniqueValues;
        this.previous = previous;
        this.cellDatas = [];
        this.isMeasure = isMeasure || false;

        if (previous && this.isMeasure === false) {
            previous.next = this;
        }
        this.preComputedValues;
    };
    
    (function(){

        this.value = function(index) {
            var val = null, combinationsFromMe, i;
            if (this.isMeasure) {
                val = this.preComputedValues[index];
            } else {
                combinationsFromMe = this.combinationsFromMe();
                return this.uniqueValues[Math.floor( index / combinationsFromMe) % this.uniqueValues.length];
            }
            if (!val) {
                throw 'Value missing in '+ index + ' for ' + this.columnName;
            }
            return (val && val.value)? val.value:val;
        };
        this.data = function() {
            if (this.isMeasure) {
                return this.preComputedValues;
            } else {
                var i = 0, combinationsTillMe = this.combinationsTillMe(), currentCellData, cellDatas = this.cellDatas = [], combinationsFromMe = this.combinationsFromMe();
                // return array of celldata
                for (; i < combinationsTillMe; i++) {
                    currentCellData = new CellData(i * combinationsFromMe, combinationsFromMe, this.uniqueValues[i % this.uniqueValues.length]);
                    cellDatas.push(currentCellData);
                }
                this.cellDatas = cellDatas;
                return cellDatas;
            }
        };
        this.combinationsTillMe = function() {
            if (this.previous) {
                return this.uniqueValues.length * this.previous.combinationsTillMe();
            } else {
                return this.uniqueValues.length;
            }
        };
        this.combinationsFromMe = function() {
            if (this.next) {
                return this.next.uniqueValues.length * this.next.combinationsFromMe();
            } else {
                return 1;
            }
        };
    }).call(ColumnModel.prototype);

    function CellData(rowIndex, rowSpan, value) {
        this.rowIndex = rowIndex;
        this.value = value;
        this.rowSpan = rowSpan;
    };

}).call(PivotTableModel.prototype);

