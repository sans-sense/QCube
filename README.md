Quotient Cube
===============
JS implementation of Quotient Cube and the QC tree.  Read about what they are  in the relevant papers in the docs section.

Use
-------
QCs allow a denser and semantic representation of data cube (details in Lakshman, yzhao papers in the docs section). A pure js implementation of this can be used for visualizing any tabular data as a queryable cube.

Demo
--------

### Movie Lens Demo
Aggregated Rating information from Movie Lens data against multiple dimensions can be seen in this demo. A detailed README is also available in README.md file in the demo/ml-demo folder.

#### Standalone
Open the demo.html file in your firefox browser. The page would create a QCTree which can be queried with the table presented in the UI. We can add more dimensions to the table by dragging them. 

#### Server Based
A  version  can also be run on node.js, run node app.js present in the demo folder

Build
--------
We can use the qcube.js in src folder directly. We can also use grunt to do a proper build. grunt would lint and uglify.



