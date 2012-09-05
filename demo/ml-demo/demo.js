var demoExports = {};
(function(){
    var de = demoExports;
    var domainModels = {};
    var und;
    var QCRoot;

    // compatibility with node
    try{
        if (_ && _.VERSION) {
            und = _;
        } else {
            und = require('./../../lib/underscore-min.js');;
        }
    }catch(e) {
        und = require('./../../lib/underscore-min.js');
    }

    try {
        if (QC) {
            QCRoot = QC;
        } else {
            QCRoot = require('./../../src/qcube.js');
        }
    } catch(e) {
        QCRoot = require('./../../src/qcube.js');
    }

    if (!(console)) {
        console = {};
        console.log = function(){};
    }

    de['eventManager'] = (function() {
        var eventManager = {};
        var eventVsCallbacks = {};
       
        eventManager.emit = function(eventName, data) {
            if (eventVsCallbacks[eventName]) {
                und.each(eventVsCallbacks[eventName], function(callback) {
                    callback.call(this, data);
                });
            }
        };
        eventManager.on = function(eventName, callback) {
            if (!(eventVsCallbacks[eventName])) {
                eventVsCallbacks[eventName] = [];
            }
            eventVsCallbacks[eventName].push(callback);
        };
        return eventManager;
    }());

    // create the domain models
    (function addDomainModels() {
        function createDomainModel(model, fields, regex) {
            domainModels[model.name] = model;
            createFields(model['prototype'], fields);
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
        };

        function createFields (actualPrototype, fields){
            und.each(fields, function(field) {
                actualPrototype[field] = null;
            });
        };
        
        function User() {this.pk = 'UserID'; };
        function Movie() { this.pk = 'MovieID';};
        function Rating() {};

        // UserID::Gender::Age::Occupation::Zip-code
        //MovieID::Title::Genres
        //UserID::MovieID::Rating::Timestamp
        createDomainModel(User,  ['UserID','Gender','Age','Occupation','Zip-code'], /(\d+)::(.+)::(\d+)::(\d+)::(\d+)/);
        createDomainModel(Movie,  ['MovieID','Title','Genres'], /(\d+)::(.+)::(\S+)/);
        createDomainModel(Rating, ['UserID','MovieID','Rating','Timestamp'], /(\d+)::(\d+)::(\d+)::(\d+)/);
    }()); // end of addDomainModels

    demoExports['dm'] = domainModels;


    function computeQCTree(domainInstances) {        
        var eventManager = de['eventManager'];

        // flatten rating to get the QC table from which we can create the cube
        var tableData = [];
        // TODO take genres into picture, complexity involved as it is multi valued and I currently do not know how to handle that
        var tableModel = ['Title', 'Gender', 'Age', 'Occupation', 'Rating'];
        var ratings = domainInstances['Rating'], users = domainInstances['User'], movies = domainInstances['Movie'];
        und.each(ratings, function(rating) {
            var user = users[rating.UserID] || {}, movie = movies[rating.MovieID] || {};
            tableData.push([movie.Title || 'uk', user.Gender || 'uk', user.Age || '0', user.Occupation || '0', rating.Rating]);
        });
        demoExports['data'] = tableData;
        demoExports['model'] = tableModel;

        console.log(new Date() + ' flattened data available');

        var qcTable = new QCRoot.Table(tableModel, tableData);
        var qCube = new QCRoot.Cube(qcTable, und.filter(tableModel, function(value, index){return index !== 4;}), [tableModel[4]]);
        qCube.build(QCRoot.Util.getAvgFunction('Rating'));
        demoExports['cube'] = qCube;
        var treeData = {};
        
        var tree = new QCRoot.TreeBuilder(qCube, treeData).build();
        demoExports['tree'] = tree;
        eventManager.emit('cube-computed', treeData);
    }; // end of compute QC Tree
    de['computeQCTree'] = computeQCTree;

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = demoExports;
        }
        exports.demoExports = demoExports;
    }
}());
