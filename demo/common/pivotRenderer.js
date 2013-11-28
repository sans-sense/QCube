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
            table.find(cellSelector).prepend($('<td>').text(value).attr('data', rowIndex));
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
