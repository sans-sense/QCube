describe("Cube", function() {
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
    
    it("creates a cube spec from the passed dimension and measure names", function() {
        var cube = QC.createCube(this.cubeSpecOptions, this.tableData);
        var cubeSpec = cube.getSpec();
        console.log(cubeSpec);
        expect(cubeSpec.dimensionNames).toEqual(this.dimensionNames);
        expect(cubeSpec.measureNames).toEqual(this.measureNames);
        expect(cubeSpec.measureName).toEqual(this.measureNames[0]);
    });
    
    it("supplies the table data on demand", function() {
        var cube = QC.createCube(this.cubeSpecOptions, this.tableData);
        expect(cube.getTableData()).toEqual(this.tableData);
    });
});