var express = require('express'),
    Graph = require('./lib/Graph'),
    Facebook = require('facebook-node-sdk'),
    config = require('./config');

var app = express();

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: config.secret }));
    app.use(Facebook.middleware({
        appId: config.fb.id,
        secret: config.fb.secret
    }));
    app.use(express.static(__dirname + '/public'));
});

app.get('/fb_login', Facebook.loginRequired(), function(req, res) {
    res.redirect('/');
});

// app.get('/graph', function(req, res) {
//     res.send([
//         {
//             id: '1',
//             name: "me desu",
//             adjacencies: [
//                 '2', '3'
//             ]
//         },
//         {
//             id: '2',
//             name: "you desu",
//             adjacencies: [
//                 '1'
//             ]
//         },
//         {
//             id: '3',
//             name: "he desu",
//             adjacencies: [
//                 '1'
//             ]
//         }
//     ]);
// });

function fbGraph(data) {
    return data.map(function(d) {
        return {
            id: d.id,
            name: d.name,
            adjacencies: d.mutualfriends && d.mutualfriends.data.map(function(f) { return f.id; })
        };
    });
}

function graphToEdgeList(graph) {
    var edges = [];
    var inEdge = {};
    var nodes = {};
    var nCount = 0;

    graph.forEach(function(node) {
        var iNode;
        if (!nodes[node.id]) {
            nodes[node.id] = nCount++;
        }
        iNode = nodes[node.id];
        if (node.adjacencies) {
            node.adjacencies.forEach(function(anode) {
                if (!nodes[anode]) {
                    nodes[anode] = nCount++;
                }
                var iANode = nodes[anode];
                if (!inEdge[iANode + " " + iNode]) {
                    edges.push([iNode, iANode]);
                    inEdge[iNode + " " + iANode] = true;
                }
            });
        }
    });

    return edges;
}

var eh;

app.get('/fb', function(req, res) {
    // if (eh) {
    //     return res.send(eh);
    // }
    // req.facebook.api('/me/friends?fields=mutualfriends,name', function(err, data) {
    //     if (err) {
    //         console.log('err', err);
    //         return res.status(500);
    //     } else if (data.error_code) {
    //         console.log('err', data);
    //     } else {
    //         var graph = Graph.fromFB(data.data);
    //         graph.computeCommunities(function(err, nc, pos) {
    //             if (err) {
    //                 console.log(err);
    //                 return res.status(500);
    //             }
    //             res.send({
    //                 nodes: graph.nodes,
    //                 edges: graph.edges,
    //                 communities: nc,
    //                 positions: pos
    //             });
    //         });
    //     }
    // });
    var graph = Graph.fromFB(require('./graph'));
    graph.computeCommunities(function(err, nc, pos) {
        if (err) {
            return console.log(err);
        }
        res.send({
            nodes: graph.nodes,
            edges: graph.edges,
            communities: nc,
            positions: pos
        });
    });
});

app.listen(3000);
