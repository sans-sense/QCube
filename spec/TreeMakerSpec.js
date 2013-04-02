describe("CubeMaker", function() {
    var shouldLog = false;

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

         // "cId, ub, lb, agg, dimNumber, pId",
        this.sortedTempClassesAsString = [
            "0, (*,*,*), (*,*,*), 0, 27, -1",
            "5, (*,P1,*), (*,P1,*), 1, 15, 0",
            "1, (S1,*,s), (S1,*,*), 0, 18, 0",
            "9, (S1,*,s), (*,*,s), 2, 18, 0",
            "2, (S1,P1,s), (S1,P1,s), 1, 6, 1",
            "6, (S1,P1,s), (*,P1,s), 2, 6, 5",
            "3, (S1,P2,s), (S1,P2,s), 1, 12, 1",
            "8, (S1,P2,s), (*,P2,*), 1, 12, 0",
            "4, (S2,P1,f), (S2,*,*), 0, 9, 0",
            "7, (S2,P1,f), (*,P1,f), 2, 9, 5",
            "10, (S2,P1,f), (*,*,f), 2, 9, 0"
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
        log(JSON.stringify(tempClasses));
        expect(tempClasses.length).toEqual(11);
    });

    it('child tempclass contain parent id', function(){
        this.cmInternals.configure(this.tableData);
        tempClasses = this.cmInternals.createTempClasses();
        expect(tempClasses[5][5]).toEqual(0);
    });

    it('tempclasses are compared in dictionary order of upper bounds, * rules', function() {
        var unsortedBounds, compareValue, tempClasses;

        unsortedBounds = [["-1","*","*"], ["*","*","*"]];
        tempClasses = createNestedArray(unsortedBounds, 1);
        compareValue = this.cmInternals.compareTempClasses(tempClasses[0], tempClasses[1]);
        expect(compareValue).toEqual(1);
    });

    it('tempclasses are sorted with same upper bound values together and are of the same length after sort', function() {
        var tempClasses, originalLength, i, actualSortedTempClasses;

        this.cmInternals.configure(this.tableData);
        tempClasses = this.cmInternals.createTempClasses();
        originalLength = tempClasses.length;
        tempClasses = tempClasses.sort(this.cmInternals.compareTempClasses);
        expect(tempClasses.length).toEqual(originalLength);
        expect(tempClasses[10][1]).toEqual(tempClasses[9][1]);
        actualSortedTempClasses = this.cmInternals.prettyFormat(tempClasses);
        actualSortedTempClasses = actualSortedTempClasses.split('\n');
        for (i = 0; i < this.sortedTempClassesAsString.length; i++) {
            expect(actualSortedTempClasses[i]).toEqual(this.sortedTempClassesAsString[i]);
        }
    });

    it('tree contains nodes for all tempclasses', function(){
        var upperBounds, qcTree;
        upperBounds = [['*', '*', '*'], ['*', 'p1', '*'], ['S1', '*', 's']];
        qcTree  = this.cmInternals.createQCTree(createNestedArray(upperBounds, 1));
        expect(qcTree.root.label).toEqual('*');
        log(JSON.stringify(qcTree));
    });

    it('tree contains edges for traversal', function(){
        var upperBounds, qcTree;

        this.cmInternals.configure(this.tableData);
        tempClasses = this.cmInternals.createTempClasses();
        originalLength = tempClasses.length;
        tempClasses = tempClasses.sort(this.cmInternals.compareTempClasses);
        qcTree = this.cmInternals.createQCTree(tempClasses);
        log(JSON.stringify(qcTree));
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

    function log(logMessage) {
        if (shouldLog) {
            console.log(logMessage);
        }
    }
});
    
