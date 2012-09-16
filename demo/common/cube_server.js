(function(){
    
    var fs = require('fs');
    var EventEmitter = require('events').EventEmitter;
    var readLine = require('readline');
    var http = require('http');
    var path = require('path');
    var url = require('url');

    var und  = require('./../../lib/underscore-min.js');
    var QC  = require('./../../src/qcube.js');

    var utils = require('./utils.js');
    var indexer = require('./indexer.js');

    var ee = new EventEmitter();
    var demo;

    var cube_server = {};
    cube_server.createCube = createCube;
    cube_server.createServer = createServer;
    cube_server.createIndexes = function(){};
    exportModule('cube_server', cube_server);

    function createCube(dimensions, measure,  tableData, demoScope) {
        var qcTable = new QC.Table(dimensions.concat(measure), tableData);
        var qCube = new QC.Cube(qcTable, dimensions, measure);
        demo = demoScope;

        qCube.build(QC.Util.getCountFunction(measure[0]));
        demo['cube'] = qCube;
        var treeData = {};
        
        var tree = new QC.TreeBuilder(qCube, treeData).build();
        demo['tree'] = tree;
    }


    function createServer(rootPath, appRoutes) {
        var routes = appRoutes || {
            '/lib/jquery.min.js':'/../../lib/jquery.min.js',
            '/lib/underscore-min.js':'/../../lib/underscore-min.js',
            '/lib/bootstrap.min.js':'/../../lib/bootstrap.min.js',
            '/lib/bootstrap.min.css':'/../../lib/bootstrap.min.css',
            '/img/glyphicons-halflings.png':'/../../lib/glyphicons-halflings.png',
            '/demo.ui.js':'/../common/demo.ui.js',
            '/demo.js':'/../common/demo.js',
            '/pivot.js':'/../common/pivot.js'
        };

        console.log(rootPath);
        var dictTypes = {
            '.js': 'text/javascript',
            '.css': 'text/css',
            'png':'image/png'
        };

        // yes I can use connect, for anything real I should use connect, this is minimal dependency
        http.createServer(function (request, response) {
            var requestUrl = request.url;
            var filePath = rootPath + request.url;

            if (requestUrl.length === 0) {
                filePath =  rootPath + '/n-demo.htm';
            } else if (routes[requestUrl]) {
                filePath =  rootPath + routes[requestUrl];
            }
            
            var extname = path.extname(filePath);
            var contentType = 'text/html';
            
            fs.exists(filePath, function(exists) {
                var searchCriteria;
                if (exists) {
                    var contentType = dictTypes[extname] || 'text/html';
                    fs.readFile(filePath, function(error, content) {
                        if (error) {
                            response.writeHead(500);
                            response.end();
                        } else {
                            response.writeHead(200, { 'Content-Type': contentType });
                            response.end(content, 'utf-8');
                        }
                    });
                }  else if (isJsonRequest(requestUrl)) {
                    try {
                        searchCriteria = url.parse(requestUrl, true).query.payload;
                        searchCriteria = JSON.parse(unescape(searchCriteria));
                    }catch(e) {
                        console.log(e);
                    }
                    if (searchCriteria) {
                        var method = searchCriteria.method;
                        var filter = searchCriteria.filter;
                        response.writeHead(200, { 'Content-Type': 'application/json' });
                        if (method === 'get') {
                            response.end(JSON.stringify(indexer.get(filter)), 'utf-8');
                        } else if (method === 'getAll') {
                            response.end(JSON.stringify(getAllValueCombinations(filter)), 'utf-8');
                        } else {
                            response.end(JSON.stringify(demo.tree[method].call(demo.tree, filter)), 'utf-8');
                        }
                    } else {
                        response.writeHead(500);
                        response.end();
                    }
                } else {
                    response.writeHead(404);
                    response.end();
                }
            });
        }).listen(8080);
    }

    function getAllValueCombinations(dimensions) {
        function crossProduct(sets) {
            var n = sets.length, carets = [], args = [];

            function init() {
                for (var i = 0; i < n; i++) {
                    carets[i] = 0;
                    args[i] = sets[i][0];
                }
            }

            function next() {
                if (!args.length) {
                    init();
                    return true;
                }
                var i = n - 1;
                carets[i]++;
                if (carets[i] < sets[i].length) {
                    args[i] = sets[i][carets[i]];
                    return true;
                }
                while (carets[i] >= sets[i].length) {
                    if (i == 0) {
                        return false;
                    }
                    carets[i] = 0;
                    args[i] = sets[i][0];
                    carets[--i]++;
                }
                args[i] = sets[i][carets[i]];
                return true;
            }

            return {
                next: next,
                do: function (block, _context) {
                    return block.apply(_context, args);
                }
            }
        }
        var dimSets = und.map(dimensions, function(dimName) {return demo.tree.values(dimName);});
        var crossProducts = crossProduct(dimSets);
        var ctr = 0;
        var measure = demo.tree.measures()[0];
        var xpResults = {};

        while(crossProducts.next()) {
            if (ctr++ === 1000) {
                break;
            }

            crossProducts.do(function(){
                var criteria = {}, i, result = 0;
                for ( i = 0; i < dimensions.length; i++) {
                    criteria[dimensions[i]] = arguments[i];
                }
                //console.log(criteria);
                var results = demo.tree.findAll(criteria);
                if (results && results.length > 0) {
                    result = results[0][measure];
                }
                xpResults[Array.prototype.slice.call(arguments).toString()] = result;
                //console.log(xpResults);
            }, this);
        }
        return xpResults;
    }

    function isJsonRequest(requestUrl) {
        return (url.parse(requestUrl).pathname === '/find');
    }

    function getResultValue(result, measureName) {
        if (result && result.length > 0) {
            return result[0][measureName];
        } else {
            return 0;
        }
    }



    function exportModule(name, moduleToExport) {
        if (typeof exports !== 'undefined') {
            if (typeof module !== 'undefined' && module.exports) {
                exports = module.exports = moduleToExport;
            } else {
                exports[name] = moduleToExport;
            }
        };
    }

}());