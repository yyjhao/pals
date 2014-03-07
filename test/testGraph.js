var Graph = require("../lib/Graph");

var fb = Graph.fromFB(require('../graph'));

fb.computeCommunities(function(err, nc) {
    if (err) {
        console.log("err", err);
    } else {
        console.log(JSON.stringify(nc));
    }
});