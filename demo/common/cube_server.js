(function(){

    "use strict"

    var fs = require('fs');
    var EventEmitter = require('events').EventEmitter;
    var readLine = require('readline');
    var http = require('http');
    var path = require('path');
    var url = require('url');
    var pathStrToSrc = '../../src/';
    var treeMaker = require(pathStrToSrc + 'treeMaker.js');
    var queryEngine = require(pathStrToSrc + 'queryEngine.js');

    var und  = require('./../lib/underscore-min.js');
    var ee = new EventEmitter();
    var cube_server = {};
    var qcTree = null;
    var portNumber = 9090;
    var cubeSpec = null;
    var debugMode = true;

    cube_server.createCubeServer = createCubeServer;
    exportModule('cube_server', cube_server);

    function createCubeServer(cubeMeta, rootPath, appRoutes) {
        cubeSpec = cubeMeta.cubeSpec;
        qcTree = treeMaker.createTree(cubeMeta.tableData, cubeMeta.cubeSpec.aggregation);
        console.log(new Date() + ' computed cube ');
        startHttpServer(rootPath, appRoutes);
    }

    function startHttpServer(rootPath, appRoutes) {
        var rootPath =  __dirname;
        var startPath = appRoutes.startPath;

        var dictTypes = {
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.png':'image/png'
        };

        // yes I can use connect, for anything real I should use connect, this is minimal dependency
        http.createServer(function (request, response) {
            var requestUrl = request.url;
            var filePath;
            if (requestUrl.length !== 1) {
                filePath =  rootPath + '/../' + requestUrl;
            } else {
                filePath = rootPath + startPath;
            }

            fs.exists(filePath, function(exists) {
                var extname, contentType;
                if (exists) {
                    extname = path.extname(filePath);
                    contentType = dictTypes[extname] || 'text/html';
                    fs.readFile(filePath, function(error, content) {
                        if (error) {
                            response.writeHead(500);
                            response.end();
                        } else {
                            response.writeHead(200, { 'Content-Type': contentType });
                            response.end(content, 'utf-8');
                        }
                    });
                } else if (isJSONRequest(requestUrl)) {
                    handleJSONRequest(requestUrl, response);
                } else {
                    response.writeHead(500);
                    response.end();
                    console.log('could not find anything for '+ filePath);
                }
            });
        }).listen(portNumber);
        console.log('created server at port '+portNumber);
    }

    function isJSONRequest(requestUrl) {
        return (url.parse(requestUrl).pathname === '/find');
    }

    function handleJSONRequest(requestUrl, response) {
        var queryPayload, searchCriteria, methodArgs;
        try {
            queryPayload = url.parse(requestUrl, true).query.payload;
            if (queryPayload === 'cubeSpec') {
                sendJSONResponse(cubeSpec, response);
            } else {
                searchCriteria = JSON.parse(unescape(queryPayload));
                methodArgs = [qcTree];
                if (searchCriteria.args !== undefined && searchCriteria.args !== null) {
                    methodArgs.push(searchCriteria.args);
                    debugLog(methodArgs);
                }
                if (queryEngine[searchCriteria.method]) {
                    sendJSONResponse(queryEngine[searchCriteria.method].apply(this, methodArgs), response);
                } else {
                    response.writeHead(500);
                    response.end();
                }
            }
        }catch(e) {
            console.log(e);
            response.writeHead(500);
            response.end();
        }
    }

    function sendJSONResponse(payload, response) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(payload), 'utf-8');
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

    function debugLog(message) {
        if (debugMode) {
            console.log(message);
        }
    }
}());
