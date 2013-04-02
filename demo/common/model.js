if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function(require) {

    var und = require('underscore');

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
            }
        }
        return model;
    };

    function createFields (actualPrototype, fields){
        und.each(fields, function(field) {
            actualPrototype[field] = null;
        });
    };

    return {
        'createDomainModel' : createDomainModel,
        'createFields' : createFields
    }
});
