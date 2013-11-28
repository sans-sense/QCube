var srcRequire = require.config({
    baseUrl: "../../src/",
    shim: {
        "handlebars": {
            exports: 'Handlebars'
        },
        'd3' : {
            exports :'d3'
        },
        'underscore': {
            exports : '_'
        },
        'nv.d3' : {
            exports: 'nv'
        },
        'PivotTableModel' : {
            exports: 'PivotTableModel'
        },
        'PivotRenderer' : {
            exports: 'PivotRenderer'
        },
        'demoUI' : {
            exports: 'setupDemo'
        }
    },
    paths: {
        "handlebars" : '../demo/lib/handlebars-1.0.0-rc.3',
        "d3" : '../demo/lib/d3-3.0.8.min',
        'underscore': '../demo/lib/underscore-min',
        'nv.d3': '../demo/lib/nv.d3',
        'model' : '../demo/common/model',
        'PivotTableModel' : '../demo/common/pivotTableModel',
        'PivotRenderer' : '../demo/common/pivotRenderer',
        'demoUI' : '../demo/common/demo.ui'
    }
});


window.onload = function() {
    var domainModels, domainInstances, tableData, cube, cubeSpec, ratingData;
    srcRequire(['qCube', 'model', 'handlebars', 'd3', 'underscore', 'nv.d3', 'PivotTableModel', 'PivotRenderer', 'demoUI'], function(qCube, model, Handlebars, d3, und, nv, PivotTableModel, PivotRenderer, demoUI) {
        var dimNameVsIndexMap;

        function constructNameVsIndexMap(cubeSpec) {
            var dims, i;
            dimNameVsIndexMap = [];
            dims = cubeSpec.dimensionNames;
            for (i = 0; i < dims.length; i++) {
                dimNameVsIndexMap[dims[i]] = i;
            }
        }

        cubeSpec = {
            dimensionNames: [ 'Gender', 'Period', 'Age', 'Occupation'],
            measureNames: ['Rating'],
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
        domainModels = createDomainModels();
        domainInstances = createDomainInstances(domainModels);
        tableData = flattenData(domainInstances);
        cube = qCube.createCube(cubeSpec, tableData);
        cube.cubeSpec = cubeSpec;
        constructNameVsIndexMap(cubeSpec);
        cube.tree = {
            values:function(dimName) {
                return this.sortValues(cube.findAllDimensionValues(dimNameVsIndexMap[dimName]));
            },
            findAll:function(criteria) {
                var i, query = this.createRootQuery();
                for (i in criteria) {
                    query[dimNameVsIndexMap[i]] = criteria[i];
                }
                return cube.find(query)[0].value;
            },
            createRootQuery:function(dimCount) {
                return _.map(cubeSpec.dimensionNames, function(){return '*'});
            },
            sortValues: function(values) {
                var compareFunction;
                if (values[0] == parseInt(values[0])) {
                    compareFunction = function(v){return parseInt(v)}
                } else {
                    compareFunction = function(v){return v}
                }
                values = _.sortBy(values, compareFunction);
                return values;
            }

        };

        ratingData = createRatingData(cube);
        createRatingPlot(ratingData, '#chart');
        addUIActionListeners();
        var demoExports = {};
        demoUI(demoExports);
        demoExports.setupPage(cube);

        function createRatingPlot(data, selectorId) {
            var plotData = [
                {
                    values: data.female,
                    key: 'Female',
                    color: 'orange'
                },
                {
                    values: data.male,
                    key: 'Male',
                    color: '#2ca02c'
                }
            ];
            nv.addGraph(function() {
                var chart = nv.models.lineChart();
                chart.xAxis
                    .axisLabel('Year');
                chart.yAxis
                    .axisLabel('Rating')
                    .tickFormat(d3.format('.02f'));
                d3.select('#chart svg')
                    .datum(plotData)
                    .call(chart);
                nv.utils.windowResize(chart.update);
                return chart;
            });
        }

        function createRatingData(qCube) {
            var values = qCube.find([cube.findAllDimensionValues(0),cube.findAllDimensionValues(1),'*','*']);
            var maleRatings, femaleRatings, currentGenderRatings;
            maleRatings = [];
            femaleRatings = [];
            currentGenderRatings;
            values.forEach(function(result){
                var value, queryKey;
                queryKey = result.key;
                value = result.value
                var key, dimCombination, value, dimSplits;
                for (var key in result) {
                    dimCombination = key;
                    value = result[key]
                }
                
                currentGenderRatings = (queryKey[0] === 'F')? femaleRatings : maleRatings;
                currentGenderRatings.push( { x:queryKey[1], y: value });
            });
            return {
                male:maleRatings.sort(function(d1, d2) {return (d1.x < d2.x)? -1:1}),
                female:femaleRatings.sort(function(d1, d2) {return (d1.x < d2.x)? -1:1}),
            }
        }


        function createDomainModels() {
            var domainModels = {};
            model.createDomainModel(domainModels, User,  ['UserID','Gender','Age','Occupation','Zip-code'], /(\d+)::(.+)::(\d+)::(\d+)::(\d+)/);
            model.createDomainModel(domainModels, Movie,  ['MovieID','Title','Genres'], /(\d+)::(.+)::(\S+)/);
            model.createDomainModel(domainModels, Rating, ['UserID','MovieID','Rating','Timestamp'], /(\d+)::(\d+)::(\d+)::(\d+)/);
            return domainModels;
        }

        function createDomainInstances(domainModels) {
            var domainInstances = {};
            $('div.data textarea').each(function() {
                var textAreaId, modelType, values, currentDomainInstance;
                modelType =extractModelType( this.id);
                domainInstances[modelType] = [];
                values = this.value.split('\n');
                _.each(values, function(value, index){
                    if (value.trim().length > 0) {
                        currentDomainInstance = domainModels[modelType].create(value.trim());
                        if (currentDomainInstance.id) {
                            domainInstances[modelType][currentDomainInstance.id] = currentDomainInstance
                        } else {
                            domainInstances[modelType].push(currentDomainInstance);
                        }
                    }
                });
            });
            return domainInstances;
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
    });

    function addUIActionListeners() {
        $('#myTab a').click(function (e) {
            $(this).tab('show');
        });

        $('ul.nav-tabs a').on('show', function (e) {
            var url, hash, template;
            url = e.target.href;
            hash = url.substring(url.indexOf("#")+1);
            if (hash === 'tableData') {
                if ($('#tableData table').size() < 1) {
                    template = Handlebars.compile($("#array-to-table-template").html());
                    $('#tableData').append(template({headers:[].concat(cubeSpec.dimensionNames).concat(cubeSpec.measureNames), rows:tableData}));
                }
            }
        });
    }
}
