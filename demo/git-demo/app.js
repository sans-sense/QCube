(function(){
    var fs = require('fs');
    var EventEmitter = require('events').EventEmitter;
    var ee = new EventEmitter();

    var pathStrToCommon = '../common/';
    var pathStrToLib = './../lib/';

    var utils = require(pathStrToCommon + 'utils.js');
    var und  = require(pathStrToLib + 'underscore-min.js');

    var cube_server = require(pathStrToCommon + 'cube_server.js');

    var projectName = 'wavemaker';
    var dimensions = ['Author', 'Team', 'Month', 'Year', 'Day', 'Complexity'];
    var measure = ['Commit'];

    var cubeSpec = {
        dimensions: dimensions,
        measure: measure,
        aggregation: {
            start: 0,
            iterativeOperation: function(value, total) {
                return total + parseInt(value, 10);
            },
            summaryOperation: function(total, partition) {
                return partition.length;
            }
        }
    };

    console.log(new Date() + ' started app.js');

    //create domain model
    function Commit(){};
    utils.createDomainModel(Commit, dimensions.concat(measure));
    readProjectLog();

    ee.on('instances-created', function(commits) {
        var tableData = flattenData(commits);
        console.log(new Date() + ' all-instances-created');
        cube_server.createCubeServer({tableData: tableData, cubeSpec:cubeSpec}, __dirname, {startPath: '/../git-demo/n-demo.htm'});
        ee.emit('cube-computed', tableData);
    })

    ee.on('cube-computed', function(args) {
        console.log(new Date() + ' cube-computed');
        ee.emit('server-created', args)
    });


    function flattenData(commits) {
        var tableData = [];
        und.each(commits, function(commit) {
            if ((!(commit.Team)) || (!(commit.date))) {
                console.log('problem reading ' +  commit.CommitId);
            } else {
                tableData.push([commit.Author, commit.Team, commit.Month, commit.Year, commit.Day, commit.Complexity || 'Low', commit.CommitId]);
            }
        });
        return tableData;
    }

    function readProjectLog() {
        var readStream = fs.ReadStream(__dirname + "/"+projectName+".log");
        var commits = [];
        var currCommit = null;
        var val;

        var commitRegex = /^commit (\S+)/;
        var authorRegex = /^Author:.+<(\S+)>/;
        var dateRegex = /^Date: (.+) [\+\-]\d+/;
        var changeLogRegex = / (\d+) file(s)? changed, (((\d+) insertions\(\+\))?)((, )?)(((\d+) deletions\(\-\))?)/;
        var teamRegex =  /\S+@(\S+)\.\S+/;

        readStream.setEncoding('ascii');

        readStream.on('data', function(data) {
            var lines = data2Array(data);
            und.each(lines, function(line) {
                var splits;
                var totalComplexity = 0;
                if (splits = commitRegex.exec(line)) {
                    if (currCommit) {
                        commits.push(currCommit);
                    }
                    currCommit = new Commit();
                    currCommit.CommitId =  splits[1];
                } else if (splits = authorRegex.exec(line)) {
                    currCommit.Author = splits[1];
                    try {
                        currCommit.Team = teamRegex.exec(currCommit.Author)[1];
                    }catch(e) {console.log('problem reading ' + line);}

                } else if (splits = dateRegex.exec(line)) {
                    currCommit.date = new Date(splits[1].trim());
                    currCommit.Month = currCommit.date.getMonth();
                    currCommit.Year = currCommit.date.getFullYear();
                    currCommit.Day = currCommit.date.getDay();
                } else if (splits = changeLogRegex.exec(line)) {
                    totalComplexity = (5 * parseInt(splits[1])) + ((splits[5])? parseInt(splits[5]):0) + ((splits[10])? parseInt(splits[10]):0);
                    currCommit.Complexity = (totalComplexity > 1000) ? "High":((totalComplexity > 500)? "Medium":"Low");
                }
            });
        });

        readStream.on('close', function() {
            console.log(new Date() + ' read log for  ' + projectName);
            if (currCommit) {
                commits.push(currCommit);
            }
            ee.emit('instances-created', commits);
        });
    };

    var data2Array = utils.data2Array;
    //cube_server.setModel
}());
