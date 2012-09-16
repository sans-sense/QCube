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
   
