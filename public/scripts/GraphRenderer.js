window.GraphRenderer = function(dom, json) {
    'use strict';

    sigma.settings.defaultEdgeColor = "#bbf";
    sigma.settings.edgeColor = "default";
    sigma.settings.defaultNodeColor = '#369';
    var comms = {};
    var graphContainer = dom.find('.graph-container')[0];
    var s = new sigma(graphContainer);
    var nodesInfo = {};
    json.nodes.forEach(function(n) {
        nodesInfo[n.id] = n;
        n.id += '';
        n.label = n.name;
        n.size = 1;
    });
    var commsScore = {};
    json.communities.forEach(function(nc) {
        nc.communities.forEach(function(c) {
            if (!comms[c[1]]) {
                comms[c[1]] = [];
                commsScore[c[1]] = [];
            }
            comms[c[1]].push(nc.id + '');
            commsScore[c[1]].push(c[0]);
        });
    });
    var doms = Object.keys(comms).map(function(k) {
        var arr = comms[k];
        var dom = document.createElement('div');
        dom.className = 'community-entry';
        dom.innerHTML = arr.map(function(id, ind) {
            return '<span class="person" data-nid="' + id + '">' +
                    nodesInfo[id].name + '</span>';
        }).join('');
        $(dom).hover(function() {
            $(dom).addClass('highlight');
            s.graph.nodes(arr).forEach(function(n) {
                n.color = '#693';
            });
            s.refresh();
        }, function() {
            $(dom).removeClass('highlight');
            s.graph.nodes(arr).forEach(function(n) {
                n.color = '#369';
            });
            s.refresh();
        });
        return dom;
    }).forEach(function(d) {
        dom.find('.graph-sidebar').append(d);
    });
    json.positions.forEach(function(pos) {
        if (!pos.id) return;
        nodesInfo[pos.id].x = pos.x;
        nodesInfo[pos.id].y = pos.y;
    });
    json.nodes.forEach(function(n) {
        if (!n.x) {
            n.x = Math.random();
            n.y = Math.random();
        }
    });
    s.graph.read({
        nodes: json.nodes,
        edges: json.edges.map(function(e, ind) {
            return {
                id: 'e' + ind,
                source: e[0] + '',
                target: e[1] + ''
            };
        })
    });
    s.refresh();

    this.s = s;
    this.data = json;
};
