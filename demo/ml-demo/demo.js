var srcRequire = require.config({
    baseUrl: "../../src/",
});

var domainModels, domainInstances, tableData, qcTree, cubeSpec, ratingData;
window.onload = function() {
    srcRequire(['cubeMaker', 'queryEngine'], function(cubeMaker, queryEngine) {
        cubeSpec = {
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
        domainModels = createDomainModels();
        domainInstances = createDomainInstances(domainModels);
        tableData = flattenData(domainInstances);
        qcTree = cubeMaker.createCube(tableData, cubeSpec.aggregation);

        $('#myTab a').click(function (e) {
            //e.preventDefault();
            $(this).tab('show');
        });
        $('ul.nav-tabs a').on('show', function (e) {
            var url, hash, template;
            url = e.target.href;
            hash = url.substring(url.indexOf("#")+1);
            if (hash === 'tree') {
                if ($('#qcTree svg').size() < 1) {
                    plotQCTree(qcTree, '#qcTree', {treeOffset:20, width:1200, height:600});
                }
            } else if (hash === 'tableData') {
                if ($('#tableData table').size() < 1) {
                    template = Handlebars.compile($("#array-to-table-template").html());
                    $('#tableData').append(template({headers:[].concat(cubeSpec.dimensions).concat(cubeSpec.measure), rows:tableData}));
                }
            }
        });

        ratingData = createRatingData(queryEngine, qcTree);
        createRatingPlot(ratingData, '#chart');

    });
}

function createRatingPlot(data, selectorId) {
    var modData = [
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
            .datum(modData)
            .call(chart);
        nv.utils.windowResize(chart.update);
        return chart;
    });
}

function createRatingData(queryEngine, qcTree) {
    var values = queryEngine.find(qcTree, [qcTree.dimensionStats[0],qcTree.dimensionStats[1],'*','*']);
    var periodGenderRegex = /([M,F]),(\d{4}),*,*/;
    var maleRatings, femaleRatings;
    maleRatings = [];
    femaleRatings = [];
    values.forEach(function(result){
        var key, dimCombination, value, dimSplits;
        for (var key in result) {
            dimCombination = key;
            value = result[key]
        }
        
        dimSplits = periodGenderRegex.exec(dimCombination);
        if (dimSplits[1] === 'F') {
            femaleRatings.push( { x:dimSplits[2], y: value });
        } else {
            maleRatings.push( { x:dimSplits[2], y: value });
        }
    });
    return {
        male:maleRatings.sort(function(d1, d2) {return (d1.x < d2.x)? -1:1}),
        female:femaleRatings.sort(function(d1, d2) {return (d1.x < d2.x)? -1:1}),
    }
}


function createDomainModels() {
    var domainModels = {};
    createDomainModel(domainModels, User,  ['UserID','Gender','Age','Occupation','Zip-code'], /(\d+)::(.+)::(\d+)::(\d+)::(\d+)/);
    createDomainModel(domainModels, Movie,  ['MovieID','Title','Genres'], /(\d+)::(.+)::(\S+)/);
    createDomainModel(domainModels, Rating, ['UserID','MovieID','Rating','Timestamp'], /(\d+)::(\d+)::(\d+)::(\d+)/);
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

