describe("DataSource", function() {
    beforeEach(function() {
        this.columnNames = ['store', 'product', 'season', 'sales'];
        this.tableData = [
            ['S1', 'P1', 's', 6],
            ['S1', 'P2', 's', 12],
            ['S2', 'P1', 'f', 9]
        ];
    });

    it('insert will return number of rows inserted', function(){
        var table, ds, rowsInserted;
        ds = DS.DataSource;
        table = ds.createTable(this.columnNames);
        rowsInserted = ds.insertData(table, this.tableData);
        expect(rowsInserted).toEqual(3);
    });

    it('count gives the number of records in a table', function() {
        var table, ds, distinctValues;
        ds = DS.DataSource;
        table = ds.createTable(this.columnNames);
        ds.insertData(table, this.tableData);
        expect(ds.count(table)).toEqual(3);
    });

    it('getDistinct  returns distinct values for given columnName', function(){
        var table, ds, distinctValues;
        ds = DS.DataSource;
        table = ds.createTable(this.columnNames);
        ds.insertData(table, this.tableData);
        ds.index(table, this.columnNames.slice(0, this.columnNames.length - 1));
        expect(ds.getDistinct(table, this.columnNames[0])).toEqual(['S1', 'S2']);
        expect(ds.getDistinct(table, this.columnNames[1])).toEqual(['P1', 'P2']);
    });

    it('truncate removes all the data', function() {
        var table, ds, distinctValues;
        ds = DS.DataSource;
        table = ds.createTable(this.columnNames);
        ds.insertData(table, this.tableData);
        ds.truncate(table);
        expect(ds.count(table)).toEqual(0);
    });

});
