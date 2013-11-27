(function(){
    var fs = require('fs');
    var EventEmitter = require('events').EventEmitter;
    var ee = new EventEmitter();
    var und = require('../lib/underscore-min.js');
    var domainInstances = {User:[], Movie:[], Rating:[]};
    var domainModels = createDomainModels();
    var qcTree;
    var cubeSpec = {
            dimensions: [ 'Gender', 'Period', 'Age', 'Occupation'],
            measure: ['Rating'],
            aggregation: {
                start: 0,
                iterativeOperation: function(value, total) {
                    return total + parseInt(value, 10);
                },
                summaryOperation: function(total, partition) {
                    return (total / partition.length).toFixed(2);
                }
            }
        };

    var cubeServer = require('../common/cube_server.js');

    und.each(domainInstances, function(value, dimension) {
        var readStream = fs.ReadStream("/data/work/ss-git/js/QCube/data/ml-1m/"+dimension.toLowerCase()+"s.dat");
        var key = dimension;

        readStream.setEncoding('ascii');
        readStream.on('data', function(data) {
            var lines = data2Array(data);
            var currentDomainInstance;

            und.each(lines, function(line) {
                currentDomainInstance = domainModels[dimension].create(line);
                if (currentDomainInstance) {
                    if (currentDomainInstance.id) {
                        domainInstances[key][currentDomainInstance.id] = currentDomainInstance;
                    } else {
                        domainInstances[key].push(currentDomainInstance);
                    }
                }
            });
        });

        readStream.on('close', function() {
            console.log(new Date() + ' read file for instance '+key);
            ee.emit('instances-created');
        });
    });

    (function() {
        var read = 0;
        ee.on('instances-created', function() {
            read++;
            if (read === und.size(domainInstances)) {
                ee.emit('all-instances-created');
            }
        });
    }());

    ee.on('all-instances-created', function() {
        console.log(new Date() + ' all-instances-created');
        var tableData = flattenData(domainInstances);
        console.log(new Date() + ' flattened to create ' + tableData.length);
        cubeServer.createCubeServer({tableData: tableData, cubeSpec:cubeSpec}, __dirname, {startPath: '/../ml-demo/n-demo.htm'});
        ee.emit('cube-computed', tableData);
    });



    // duplication, remove this
    function data2Array(data) {
        var lines = [];
        var newline = '\n';
        var currentLine = '';
        var i = 0;
        var val;

        for (i = 0; i < data.length; i++)  {
            val = data[i];
            if (val === newline) {
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = '';
                }
            } else {
                currentLine += val;
            }
        }
        return lines;
    }

    function flattenData(domainInstances) {
        var yearRegex = /.*\((\d{4})\)/;
        var tableData = [];
        function getPeriod(yearString) {
            var year = parseInt(yearRegex.exec(yearString)[1]);
            return year;
        }
        var ratings = domainInstances['Rating'], users = domainInstances['User'], movies = domainInstances['Movie'];
        und.each(ratings, function(rating) {
            var user = users[rating.UserID], movie = movies[rating.MovieID];
            if (user && movie) {
                tableData.push([user.Gender || 'uk', getPeriod(movie.Title) || 'uk',  user.Age || '0', user.Occupation || '0', rating.Rating]); 
            } else {
                console.log("could not find detail for "+rating);
            }
        });
        return tableData;
    }

    function extractModelType(elementId) {
        var modelType;
        modelType = elementId.substring(('txt_area_').length);
        modelType = modelType[0].toUpperCase() +  modelType.substring(1);
        return modelType;
    }

    function User() {this.pk = 'UserID'; };
    function Movie() { this.pk = 'MovieID';};
    function Rating() {};

    function createDomainModels() {
        var domainModels = {};
        createDomainModel(domainModels, User,  ['UserID','Gender','Age','Occupation','Zip-code'], /(\d+)::(.+)::(\d+)::(\d+)::(\d+)/);
        createDomainModel(domainModels, Movie,  ['MovieID','Title','Genres'], /(\d+)::(.+)::(\S+)/);
        createDomainModel(domainModels, Rating, ['UserID','MovieID','Rating','Timestamp'], /(\d+)::(\d+)::(\d+)::(\d+)/);
        return domainModels;
    }

    function createDomainModel(domainModels, model, fields, regex) {
        domainModels[model.name] = model;
        createFields(model['prototype'], fields);
        model['prototype'].toString = function() {
            return model + ' ' +model['prototype'][fields[0]] + ' ' +model['prototype'][fields[1]]
        }
        if (regex) {
            model['create'] = function(stringVal) {
                var val, splits;
                splits = regex.exec(stringVal);
                if (splits) {
                    val = new domainModels[model.name]();
                    und.each(fields, function(field, index) {
                        if (index === 0 && val.pk) {
                            val.id = splits[index + 1]
                        }
                        val[field] = splits[index + 1];
                    });
                }
                return val;
            };
        }
        return model;
    };

    function createFields (actualPrototype, fields){
        und.each(fields, function(field) {
            actualPrototype[field] = null;
        });
    };

}());
