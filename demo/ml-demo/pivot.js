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
        if (result && result.length > 0) {
            return result[0][measure];
        } else {
            return 0;
        }
    };

    this.compute = function() {
        self = this;
        columnModels = [];
        currentColumnIndex = 0;
        prevColumnModel = null;

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
        var i, dimValues;
        for (i = 0; i < combinationsTillMe; i++) {
            dimValues = _.map(self.dimensions, function(dimension, index) {return columnModels[index].value(i);});
            preComputedValues.push(new CellData(i, 1, getFactValue(self.dimensions, dimValues,self.measure, self.qcTree)));
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
                if (combinationsFromMe === 1) {
                    return this.uniqueValues[index % this.uniqueValues.length];
                } else {
                    return this.uniqueValues[Math.floor( index / combinationsFromMe)];
                }
            //     combinationsFromMe = this.combinationsFromMe();
            //     if (combinationsFromMe === 1) {
            //         val = this.cellDatas[index];
            //     } else {
            //         for ( i = 0; i < this.cellDatas.length; i++){
            //             if (index < this.cellDatas[i].rowIndex){
            //                 val = this.cellDatas[i];
            //                 break;
            //             }
            //         }
            //     }
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

function PivotRenderer(tableSelector, model) {
    this.tableSelector = tableSelector;
    this.model = model;
}

(function(){
    var table;
    function addCellWithContent(rowIndex, rowSpan, value, addRow) {
        var cellSelector = 'tbody tr:eq('+rowIndex+')';
        if (addRow) {
            table.find('tbody').append($('<tr>'));
        }
        if (rowSpan > 1) {
            table.find(cellSelector).prepend($('<td>').text(value).attr('rowspan', rowSpan));
        } else {
            table.find(cellSelector).prepend($('<td>').text(value));
        }
    };

    function addColumnHeader(columnName, canBeDeleted) {
        table.find('thead tr').prepend($('<th>').text(columnName).attr('data', columnName));
        if (canBeDeleted) {
            table.find('thead tr th:first').append($('<i>').attr('class', 'icon-trash'));
        }
    }
    function render(model){
        var  i, columnModel, iterator = model.columnModelIterator(), columnModels = [];
        table.find('thead').append($('<tr>'));
        while((columnModel = iterator.next())) {
            columnModels.push(columnModel);
        };
        for (i = columnModels.length; i > 0; i--) {
            columnModel = columnModels[i - 1 ];
            addColumnHeader(columnModel.columnName, !columnModel.isMeasure);
            _.each(columnModel.data(), function(cellData) {
                addCellWithContent(cellData.rowIndex, cellData.rowSpan, cellData.value, columnModel.isMeasure);
            });
        }
    };
    this.draw = function() {
        table = $(this.tableSelector);
        table.find('tbody tr').remove();
        table.find('thead tr').remove();

        render(this.model);
   }
}).call(PivotRenderer.prototype);
