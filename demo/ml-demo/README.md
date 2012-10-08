Demo
===============

## Simple Movie Rating Demo
### Intro
A simple demo of movie ratings based on 1k records from the 1M data set from http://www.grouplens.org/system/files/ml-1m.zip. Open demo.html in your browser, no server needed. 

app.js is a node app which can do better crunching upto 100k within 1 min, once the cube is created, it opens a http server which can serve the cube (run n-demo.htm from http://localhost:8080/n-demo.htm). The current implementation unfortunately suffers from non-linear time expansion, so for 1M it takes for ever. All numbers are based on my ubuntu 12.04 dual core 2.2 ghz T660 intel latop with 3gb ram.

### Files
The main file is demo.html, it uses pivot, demo and demo.ui js files.

In case you want to look at the pivot table internals, look at the specs for pivot in pivot.spec.js and it can be run with pivot-test.html

### How To Run

The demo.html page can run in standalone mode and has 1k of the 1M dataset harcoded in it.

For the node version, extract the zip and create a ratings.dat file with upto 100k records and then run app.js.

### FAQ

1.  What does it do?
  Show movie ratings and lets us add dimensions and other fun stuff associated with pivot tables.


    


