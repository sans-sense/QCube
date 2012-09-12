(function(){
    var utils = {};

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

    utils.data2Array = function(data) {
        var lines = [];
        var newline = '\n';
        var currentLine = '';
        var i = 0;
        var val;

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
        }
        return lines;
    }

    console.log(utils);
    utils.exportModule = exportModule;
}());
