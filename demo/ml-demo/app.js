(function(){
    var fs = require('fs');
    
    var und  = require('./../../lib/underscore-min.js');
    var QC  = require('./../../src/qcube.js');

    var demo = require('./demo.js');
    var domainInstances = {User:[], Movie:[], Rating:[]};
    var EventEmitter = require('events').EventEmitter;
    var ee = new EventEmitter();
    var instanceTypes = und.map(domainInstances, function(val, key) {return key});
    var readLine = require('readline');

    console.log(new Date() + ' started app.js');

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
                        domainInstances[key][currentDomainInstance.id] = currentDomainInstance
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
        })
    }());

    ee.on('all-instances-created', function() {
        console.log(new Date() + ' all-instances-created');
        demo.eventManager.on('cube-computed', function() {ee.emit('cube-computed');});
        demo.computeQCTree(domainInstances);
        //(function sanityPrint(){ und.each(domainInstances, function(val, key){ for (var i= 0; i < 10; i++){ console.log(val[i]);}})}())
    });


    ee.on('cube-computed', function startRepl() {
        console.log(new Date() + ' cube computed');
        var rl = readLine.createInterface({input: process.stdin, output: process.stdout});
        var result;
        rl.setPrompt('>Enter query');
        rl.prompt();
        rl.on('line', function(line) {
            switch(line.trim()) {
            case 'quit':
                rl.close();
                break;
            default:
                result = demo.tree.findAll(eval('('+line+')'));
                console.log(getResultValue(result));
                break;
            }
            rl.prompt();
        }).on('close', function(){
            console.log('Have a great day!');
            process.exit(0);
        });
    });

    function getResultValue(result) {
        if (result && result.length > 0) {
            return result[0]['Rating'];
        } else {
            return 0;
        }
    }

    function data2Array(data) {
        var lines = [];
        var newline = '\n';
        var j = 0;
        var currentLine = '';
        var i = 0;

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
        };
        return lines;
    }
}());