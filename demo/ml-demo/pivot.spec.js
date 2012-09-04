describe("Pivot specs", function() {
    
    var dimensionsWithData, measure = 'rating', qcTree = {}, dimensions, pivotModel, dimLengths;

    // three dimensions with 2, 6 and 9 unique values
    dimensionsWithData= {'Gender':['M', 'F'], 'Age':['1', '25', '35', '45', '50', '56'], 'Occupation':['1', '10', '12', '15', '16', '17', '20', '7', '9' ]};

    // a dummy qc tree
    qcTree.values = function(dimension) {
        return dimensionsWithData[dimension];
    };
    qcTree.findAll = function(criteria) {
        return {'rating' : 10 };
    };

    // actual dimension names
    dimensions = _.map(dimensionsWithData, function(value, key){return key});
    dimLengths  = _.map(dimensionsWithData, function(value, key){return value.length});

    pivotModel = new PivotTableModel(dimensions, measure, qcTree);
    pivotModel.compute();

    function getDimensionData(index, iterator) {
        var i = 0;
        for (i; i < index; i++) {
            iterator.next();
        }
        return iterator.next().data();
    };

    it('Pivot model should compute n * m * o values for third dimension for a three level dimension setup with n, m and o unique records',
       function(){
           var thirdDimensionData, dimensionIterator;

           dimensionIterator = pivotModel.columnModelIterator();
           thirdDimensionData = _.pluck(getDimensionData(2, dimensionIterator), 'value');
           expect(thirdDimensionData.length).toEqual(dimLengths[0] * dimLengths[1] * dimLengths[2]);
       });

    it('model should have first level dimension values of size n with cell index as i * m * o where i = [0, n) and m and o are the other dimension sizes', function() {
        var firstDimData = pivotModel.columnModelIterator().next().data();

        expect(firstDimData.length).toEqual(dimLengths[0]);
        expect(_.pluck(firstDimData, 'rowIndex')).toEqual([0, dimLengths[1] * dimLengths[2]]);
        expect(_.pluck(firstDimData, 'value')).toEqual(['M', 'F']);
    });

    it('model should have third level dimension values of size n * m * o with 3rd dim unique values repeated', function() {
        var thirdDimData, dimensionIterator = pivotModel.columnModelIterator();

        thirdDimData = getDimensionData(2, dimensionIterator);
        expect(thirdDimData.length).toEqual(dimLengths[0] * dimLengths[1] * dimLengths[2]);
        expect(_.pluck(thirdDimData, 'rowIndex')[0]).toEqual(0);
        expect(_.pluck(thirdDimData, 'rowIndex')[thirdDimData.length -1 ]).toEqual(dimLengths[0] * dimLengths[1] * dimLengths[2] -1);
        expect(_.pluck(thirdDimData, 'value')[0]).toEqual(dimensionsWithData[dimensions[2]][0]);
    });

});
	
