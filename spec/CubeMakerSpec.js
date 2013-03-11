describe("CubeMaker", function() {
    beforeEach(function() {
        this.dimensionNames = ['store', 'product', 'season'];
        this.measureNames = ['sales'];
        this.cubeSpecOptions = {
            dimensionNames: this.dimensionNames,
            measureNames: this.measureNames
        };
        this.tableData = [
            ['S1', 'P1', 's', 6],
            ['S1', 'P2', 's', 12],
            ['S2', 'P1', 'f', 9]
        ];
    });
    
    it('UpperBound supports jumps, so from the cell c = (a2; *; *; *), we can go to(a2; b1; *; d1)', function(){
        var stats = [], upperBound;
        stats[1] = { order_keys : ['b1']};
        stats[2] = { order_keys : []};
        stats[3] = { order_keys : ['d1']};

        upperBound = CB.computeUpperBound(stats, ['a2', '*','*','*'], 4);
        expect(upperBound).toEqual(['a2', 'b1','*','d1']);
    });
});
    
