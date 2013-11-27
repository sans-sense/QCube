(function(){
    var utils = {};
    var pathStrToLib = './../lib/';
    var und  = require(pathStrToLib + 'underscore-min.js');
    var domainModels = {};

    exportModule('utils', utils);

    function exportModule(name, moduleToExport) {
        if (typeof exports !== 'undefined') {
            if (typeof module !== 'undefined' && module.exports) {
                exports = module.exports = moduleToExport;
            } else {
                exports[name] = moduleToExport;
            }
        };
    }

    function createFields (actualPrototype, fields){
        und.each(fields, function(field) {
            actualPrototype[field] = null;
        });
    };

    utils.data2Array = function(data) {
        var lines = [];
        var newline = '\n';
        var currentLine = '';
        var i = 0;
        var val;

        for (i = 0; i < data.length; i++) {
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

    utils.createDomainModel = function(model, fields, regex) {
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
            }
        }
    };
    utils.exportModule = exportModule;
}());
