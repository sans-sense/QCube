Demo
=========

There are currently two demos, one for analyzing git log of any project and the other for analyzing movie lens data.

### Git Log demo (folder git-demo)

1. QC is computed from the project git log. Run git log --shortstat >project.log to generate the project git log.
2. Run node app.js (app.js present in the git-demo folder), this would go through the project log and compute the cube.
3. Once the server is started go to http://<machine-ip>:8080/n-demo.htm

The git log cube uses commit counts as measures with 'Author', 'Team', 'Month', 'Year', 'Day', 'Complexity'. It assumes that all author details are provided as email ids, with the email domain being the team name. Complexity is Low [n= 0-499], Medium [n = 500-999], HIgh [n >999] where n= (5 * number of files) + (number of insertions and deletions). 

### Movie Lens demo

Demo of 100k/1k data of movie lens, further details in README.md in ml-demo folder.
   
### Quick Test
getCubeSpec -> $.getJSON( "find?payload=cubeSpec", function( data ) {
    console.log(data);
})

find -> 
curl 'http://localhost:9090/find?payload=%7B%22method%22%3A%22find%22%2C%22args%22%3A%5B%22*%22%2C%22*%22%2C%22*%22%5D%7D' -H 'Host: localhost:9090' -H 'Accept: application/json, text/javascript, */*; q=0.01' 
var urlAppend = escape(JSON.stringify({method:"find", 'args':['*','*','*']}));
$.getJSON( "find?payload="+urlAppend, function( data ) {
    console.log(data);
})

var urlAppend = escape(JSON.stringify({method:"findAllDimensionValues", 'args':2}));
$.getJSON( "find?payload="+urlAppend, function( data ) {
    console.log(data);
})


var findArgs = ['ap_nat@yahoo.com'];
_.each(_.range(5), function(){findArgs.push('*');})
var urlAppend = escape(JSON.stringify({method:"find", 'args':findArgs}));
$.getJSON( "find?payload="+urlAppend, function( data ) {
    console.log(data);
})
