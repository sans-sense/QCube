(function(){
    var fs = require('fs');
    var EventEmitter = require('events').EventEmitter;
    var ee = new EventEmitter();
    
    var pathStrToCommon = '../common/';
    var pathStrToLib = './../../lib/';

    var utils = require(pathStrToCommon + 'utils.js');
    var demo = require(pathStrToCommon + 'demo.js');
    var und  = require(pathStrToLib + 'underscore-min.js');

    var cube_server = require(pathStrToCommon + 'cube_server.js');

    var domainInstances = {User:[], Movie:[], Rating:[]};
    var instanceTypes = und.map(domainInstances, function(val, key) {return key});
    var dimensions = ['Period', 'Gender', 'Age', 'Occupation']
    var measure = ['Commit'];

    console.log(new Date() + ' started app.js');
    function User() {this.pk = 'UserID'; };
    function Movie() { this.pk = 'MovieID';};
    function Rating() {};

    // UserID::Gender::Age::Occupation::Zip-code
    //MovieID::Title::Genres
    //UserID::MovieID::Rating::Timestamp
    demo.createDomainModel(User,  ['UserID','Gender','Age','Occupation','Zip-code'], /(\d+)::(.+)::(\d+)::(\d+)::(\d+)/);
    demo.createDomainModel(Movie,  ['MovieID','Title','Genres'], /(\d+)::(.+)::(\S+)/);
    demo.createDomainModel(Rating, ['UserID','MovieID','Rating','Timestamp'], /(\d+)::(\d+)::(\d+)::(\d+)/);


    und.each(domainInstances, function(value, dimension) {
        var readStream = fs.ReadStream(__dirname + "/"+dimension.toLowerCase()+"s.dat");
        var key = dimension;

        readStream.setEncoding('ascii');
        readStream.on('data', function(data) {
            var lines = data2Array(data);
            var currentDomainInstance;

            und.each(lines, function(line) {
                currentDomainInstance = demo.dm[dimension].create(line);
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
            if (read === instanceTypes.length) {
                ee.emit('all-instances-created');
            }
        });
    }());

    ee.on('all-instances-created', function() {
        console.log(new Date() + ' all-instances-created');
        var tableData = flattenData(domainInstances);
        cube_server.createCube(dimensions, measure, tableData, demo);
        ee.emit('cube-computed', tableData);
    });


    ee.on('cube-computed', function(args) {
        console.log(new Date() + ' cube computed');
        var routes = {
            '/lib/jquery.min.js':'/../../lib/jquery.min.js',
            '/lib/underscore-min.js':'/../../lib/underscore-min.js',
            '/demo.ui.js':'/../common/demo.ui.js',
            '/demo.js':'/../common/demo.js',
            '/pivot.js':'/../common/pivot.js'

        };
        cube_server.createServer(routes, __dirname);
        ee.emit('server-created', args)
    });

    ee.on('server-created', function(tableData) {
        cube_server.createIndexes(tableData);
    });

    function flattenData(domainInstances) {
        // flatten rating to get the QC table from which we can create the cube
        var tableData = [];
        var yearRegex = /.*\((\d{4})\)/;
        // TODO take genres into picture, complexity involved as it is multi valued and I currently do not know how to handle that
        var tableModel = dimensions.concat(measure);
        var ratings = domainInstances['Rating'], users = domainInstances['User'], movies = domainInstances['Movie'];
        und.each(ratings, function(rating) {
            var user = users[rating.UserID], movie = movies[rating.MovieID];
            if (user && movie) {
                tableData.push([getPeriod(yearRegex.exec(movie.Title)[1]) || 'uk', user.Gender || 'uk', user.Age || '0', user.Occupation || '0', rating.Rating]);
            } else {
                console.log("could not find detail for "+rating);
            }
        });
        console.log(new Date() + ' flattened data available');
        return tableData;
    }

    function getPeriod(yearString) {
        var year = parseInt(yearString);
        var diff = year - 1900;
        if (diff < 80) {
            return '1900-1980';
        } else {
            return ((diff % 2) === 0)? (year + '-' + (year + 1)):((year - 1) + '-' + year);
        }
    }

    var data2Array = utils.data2Array;
}());