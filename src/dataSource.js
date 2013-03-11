var DS = {};

(function(){
 
    /**
      * Datasource manages the tabular data, it indexes and supports data queries. The construction of the 
      * cube depends on identifying the different values of the dimension and then effective queries for 
      * getting data applicable to dimension combinations. In a traditional  perspective it would be 
      * something akin to a db.
      */
    var dbRegistry = {};
    var dbSettings = {};


    function DataSource() {
    }
        
    (function(){
        
        this.createTable = function(columnNames) {
            var table =  new InMemoryTable(columnNames);
            dbRegistry[table] = new TableDetail();
            return table;
        };
        
        this.insertData = function(table, data) {
            dbRegistry[table].addData(data, dbSettings.playSafe);
            return data.length;
        };

        this.index = function(table, columnNames) {
            var columnKeys = [];
            columnNames.forEach(function(columnName){
                columnKeys.push(table.getColumnKey(columnName));
            });
            updateIndices(dbRegistry[table].indexes, columnKeys, dbRegistry[table].data);
        };

        this.getDistinct = function(table, columnName) {
            var index, distinctValues;
            distinctValues = [];
            index = dbRegistry[table].indexes[table.getColumnKey(columnName)];
            if (index) {
                for (var dimIndex in index) {
                    distinctValues.push(dimIndex);
                }
                return distinctValues;
            } else {
                throw "Searching for distinct on unindexed column";
            }
        };

        this.getDistinctCombinations = function(table) {
            
        };
        this.count = function(table) {
            return dbRegistry[table].data.length;
        };

        this.truncate = function(table) {
             dbRegistry[table].truncate();
        };

        this.filter = function(table, filterSpec)  {
        };

        this.set = function(key, value) {
            dbSettings[key] = value;
        };

        function updateIndices(indexes, columnKeys, data) {
            var i, j, row, columnValue;

            // lets make sure we have placeholders for all columnKeys
            for (i = 0; i < columnKeys.length; i++) {
                    if (! indexes[i]) {
                        indexes[i] = {};
                    }
            }

            // iterate through the data capturing each unique value in the columnKeys
            for (i = 0; i < data.length; i++) {
                row = data[i];
                for (j = 0; j < columnKeys.length; j++) {
                    columnValue = row[j];
                    if (! indexes[j][columnValue] ) {
                        indexes[j][columnValue] = [];
                    }
                    indexes[j][columnValue].push(i);
                }
            }
        }
    }).call(DataSource.prototype);

    function InMemoryTable(columnNames) {
        this.columns = columnNames;
    }

    (function(){
        // gets the integer value used as key for this column name
        this.getColumnKey = function(columnName) {
            return this.columns.indexOf(columnName);
        };

    }).call(InMemoryTable.prototype);
    
    function TableDetail() {
        this.data = [];
        this.indexes = {};
        this.distinctCombinations = {};
    }

    ( function(){

        // data is a two dimensional array, array of row data
        this.addData = function(data, playSafe) {
            // we copy all contents unless the user decides to change reference to passed param
            playSafe = (playSafe === undefined) || playSafe;
            if (this.data.length > 0 || playSafe) {
                this.data.push.apply(this.data, data);
            } else {
                this.data = data;
            }
        };

        this.truncate = function() {
            this.data = [];
            this.indexs = {};
            this.distinctCombinations = {};
        };
    }).call(TableDetail.prototype);

    this.DataSource = new DataSource();
}.call(DS));