'use strict';

var temp = require('temp'),
    fs = require('fs'),
    sys = require('sys'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn;

var Graph = module.exports = function(nodes, edges) {
    var normNodes = {},
        inEdge = {},
        nodesCount = 0;

    nodes.forEach(function(n) {
        if (!normNodes[n.uid]) {
            normNodes[n.uid] = nodesCount++;
        }
        n.id = normNodes[n.uid];
    });

    var tranEdge = [];
    edges.forEach(function(e) {
        var na = normNodes[e[0]],
            nb = normNodes[e[1]];

        if (!inEdge[na + ' ' + nb]) {
            inEdge[na + ' ' + nb] = true;
            tranEdge.push([na, nb]);
        }
    });

    this.nodes = nodes;
    this.edges = tranEdge;
};

Graph.fromFB = function(fbGraph) {
    var nodes = fbGraph.map(function(friend) {
        return {
            uid: friend.id,
            name: friend.name
        };
    });
    var edges = [];
    fbGraph.forEach(function(friend) {
        if (friend.mutualfriends && friend.mutualfriends.data) {
            friend.mutualfriends.data.forEach(function(mf) {
                edges.push([friend.id, mf.id]);
            });
        }
    });
    return new Graph(nodes, edges);
};

Graph.prototype.writeToEdgeList = function(weight, callback) {
    var graph = this;
    temp.open({suffix: '.txt'}, function(err, info) {
        fs.writeFile(info.path, graph.toEdgeListString(weight), null, null, null, function(err) {
            callback(err, info);
        });
    });
};

Graph.prototype.toNodeCommunityPair = function() {
    return this.node_communities.map(function(nc) {
        return nc.id + ' ' + nc.communities.length + ' ' + nc.communities.map(function(c) {
            return c[1];
        }).join(' ');
        // return [nc.id, 1, nc.communities[0]].join(' ');
    }).join('\n');
};

Graph.prototype.toEdgeListString = function(weight) {
    return this.edges.map(function(e) {
        return e.join(' ') + (weight ? ' ' + weight : '');
    }).join('\n');
};

Graph.prototype.computeMSG = function(callback) {
    var self = this;
    this.writeToEdgeList(1, function(err, tempFile) {
        exec(__dirname + '/../bin/msg ' + tempFile.path + ' 100',
            function(error, stdout, stderr) {
                if (error || stderr) {
                    return callback(error || stderr);
                } else {
                    var node_communities = stdout.trim().split('\n').map(function(line) {
                        var tokens = line.split(/\s+/);
                        return {
                            id: tokens[0],
                            communities: [[1, tokens[1]]]
                        };
                    });
                    self.node_communities = node_communities;
                    callback(null, node_communities);
                }
            });
    });
};

Graph.prototype.computeFuzzyClust = function(callback) {
    var self = this;
    this.writeToEdgeList(null, function(err, tempFile) {
        exec(__dirname + '/../bin/fuzzyclust -q -t 0.5 ' + tempFile.path,
                function(error, stdout, stderr) {
                if (error || (stderr && stderr.indexOf("CPU time used:") != 0)) {
                    return callback(error || stderr);
                } else {
                    var isData = false;
                    var node_communities = [];
                    stdout.split('\n').forEach(function(line) {
                        if (line[0] == '0') {
                            isData = true;
                        }
                        if (isData) {
                            var tokens = line.trim().split(/\s+/);
                            var len = tokens.length;
                            if (len == 1) return;
                            var communities = tokens.slice(1, len - 4).map(function(c, ind) {
                                return [parseFloat(c), ind];
                            });
                            communities.sort(function(a, b) {
                                return b[0] - a[0];
                            });
                            communities = communities.filter(function(c) {
                                return c[0] > 0.35;
                            });

                            node_communities.push({
                                id: tokens[0],
                                bridge: tokens[len - 1],
                                communities: communities
                            });
                        }
                    });
                    self.node_communities = node_communities;
                    return callback(null, node_communities);
                }
            });
    });
};

Graph.prototype.computePosition = function(callback) {
    var renderer = spawn(__dirname + '/../bin/renderGraph');

    var outs = [];
    renderer.stdout.on('data', function(data) {
        outs.push(data);
    });

    var self = this;
    renderer.on('exit', function() {
        var stdout = outs.join('');
        self.position = stdout.split('\n').map(function(line) {
            var tokens = line.trim().split(' ');
            return {
                id: parseInt(tokens[0], 10),
                x: parseFloat(tokens[1]),
                y: parseFloat(tokens[2])
            };
        });
        callback(null, self.position);
    });

    renderer.stdin.write(this.toEdgeListString() +
                        '\n\n' +
                         this.toNodeCommunityPair() +
                        '\n');
    renderer.stdin.end();
};

Graph.prototype.computeCommunities = function(callback) {
    var self = this;
    this.computeFuzzyClust(function(err, node_communities) {
        if (err) {
            return callback(err);
        } else {
            return self.computePosition(function(err, positions) {
                callback(err, node_communities, positions);
            });
        }
    });
};
