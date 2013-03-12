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
        this.cmInternals = {};
        CB.exportTo(this.cmInternals);
    });
    
    it('UpperBound supports jumps, so from the cell c = (s1; *; *), we can go to(s1; *; s) in case there is only one value s for S1', function(){
        var  upperBound, statsWrapper;

        statsWrapper = createTestStats([null, ['P1', 'P2'], 's']);
        upperBound = this.cmInternals.computeUpperBound(statsWrapper, ['s1', '*','*'], 3);

        expect(upperBound).toEqual(['s1', '*','s']);
    });

    it('tempclasses are generated for all dimension combinations existing in the data', function(){
        var tempClasses;

        this.cmInternals.configure(this.tableData);
        tempClasses = this.cmInternals.createTempClasses();
        console.log(JSON.stringify(tempClasses));
        expect(tempClasses.length).toEqual(11);
    });

    it('tempclasses are sorted in dictionary order, * rules', function() {
        var unsortedBounds = [["-1","*","*"], ["*","*","*"], ["*","P","*"]], sortedClasses;
        sortedClasses = this.cmInternals.sortTempClasses(createNestedArray(unsortedBounds, 1));
        expect(sortedClasses.length).toEqual(3);
        expect(sortedClasses[0][1]).toEqual(unsortedBounds[1]);
        expect(sortedClasses[2][1]).toEqual(unsortedBounds[0]);
    });

    it('tree contains nodes for all tempclasses', function(){
        var upperBounds, qcTree;
        upperBounds = [['*', '*', '*'], ['*', 'p1', '*'], ['S1', '*', 's']];
        qcTree  = this.cmInternals.createQCTree(createNestedArray(upperBounds, 1));
        expect(qcTree.root.label).toEqual('root');
        console.log(JSON.stringify(qcTree));
    });

    /**
      * Creates test stats about dimensional values. Each value passed in the dimension is added
      * as an entry against order_key field in the stat for that dimension. For null values creates
      * an empty stat entry. e.g if values is [null, ['P1', 'P2'], 's'], will create
      *  {"stats":[{"order_keys":[]},{"order_keys":["P1", "P2"]},{"order_keys":['s']}]}
      */
    function createTestStats(values) {
        var stats, i, value, statsWrapper, statValue;
        stats = [];
        for ( i = 0; i < values.length; i++) {
            value = values[i];
            statValue = [];
            if (value) {
                if (value instanceof Array) {
                    statValue.push.apply(statValue, value);
                } else {
                    statValue.push(value);
                }
            }
            stats.push({ order_keys: statValue});
        }
        statsWrapper = {
            stats : stats,
            get: function(index) {
                return stats[index];
            }
        };
        return statsWrapper;
    }

    function createNestedArray(values, valuePosition) {
        var results = [], i, j, row1;
        for ( i = 0; i < values.length; i++) {
            row1 = [];
            row1[valuePosition] = values[i];
            results.push(row1);
        }
        return results;
    }
});
    
