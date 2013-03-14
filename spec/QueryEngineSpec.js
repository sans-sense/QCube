describe("QueryEngine", function() {
    var shouldLog = false;

    beforeEach(function() {
        this.tableData = [
            ['S1', 'P1', 's', 6],
            ['S1', 'P2', 's', 12],
            ['S2', 'P1', 'f', 9]
        ];
        this.qcTree = CB.createCube(this.tableData);
    });
    
    it('for *,*,*  gives a sum of all table data i.e 27, root works', function(){
        var total, row;
        total = 0;
        this.tableData.forEach(function(row){ total += row[3];});
        expect(QE.find(this.qcTree, ['*', '*', '*'])).toEqual(total);
    });

    it('for S1, P1, *  gives sum of all records with S1 and P1 i.e. 6, searchRoute last child logic' , function() {
        expect(QE.find(this.qcTree, ['S1', 'P1', '*'])).toEqual(6);
    });

    it('for [S1, *, *]  gives sum of all records with S1  i.e. 18, pick last dim child logic' , function() {
        expect(QE.find(this.qcTree, ['S1', '*', '*'])).toEqual(18);
    });

    it('for impossible combinations like [S1, P1, f] should give null as there are no records with S1, P1 and f' , function() {
        expect(QE.find(this.qcTree, ['S1', 'P1', 'f'])).toEqual(null);
    });

    it('for [[S1, S2, S3], [P1, P3], s] gives 6', function(){
        expect(QE.find(this.qcTree, [['S1','S2','S3'], ['P1','P3'], 's'])).toEqual([6]);
    });
});
