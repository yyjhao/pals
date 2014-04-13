// modified from http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
function hslToRgbNormalized(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b];    
}

function genHex(num) {
    var integer = Math.round(num * 255);
    if (integer < 16) {
        return '0' + integer.toString(16);
    } else {
        return integer.toString(16);
    }
}

function hslToHex(h, s, l) {
    return '#' + hslToRgbNormalized(h, s, l).map(genHex).join("");
}

window.GraphRenderer = function(dom, json, anon) {
    'use strict';

    var satu = 0.5, light = 0.4;

    sigma.settings.defaultEdgeColor = "#bbf";
    sigma.settings.edgeColor = "default";
    sigma.settings.defaultNodeColor = '#369';
    var comms = {};
    var graphContainer = dom.find('.graph-container')[0];
    var s = new sigma(graphContainer);
    var nodesInfo = {};
    if (anon) {
        json.nodes.forEach(function(n) {
            n.name = n.id.toString(36);
        });
    }
    json.nodes.forEach(function(n) {
        nodesInfo[n.id] = n;
        n.id += '';
        n.label = n.name;
        n.size = 0;
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

            json.nodes[nc.id].size += 1;
        });
    });
    var numColors = Object.keys(comms).filter(function(k) {
        return comms[k].length > 1;
    }).length + 3;

    var colorStep = 0.8 / numColors;
    console.log('num', numColors);
    Object.keys(comms).filter(function(k) {
        return comms[k].length > 1;
    }).forEach(function(k, ind) {
        comms[k].forEach(function(nid) {
            if (!nodesInfo[nid].rgbColorAll) nodesInfo[nid].rgbColorAll = hslToRgbNormalized(colorStep * ind, satu, light);
            else {
                hslToRgbNormalized(colorStep * ind, satu, light).forEach(function(val, ind) {
                    nodesInfo[nid].rgbColorAll[ind] += val;
                });
            }
            if (!nodesInfo[nid].colorCount) {
                nodesInfo[nid].colorCount = 1;
            } else {
                nodesInfo[nid].colorCount++;
            }
        });
    });

    Object.keys(nodesInfo).forEach(function(k) {
        if (nodesInfo[k].rgbColorAll) {
            var rgbAverage = nodesInfo[k].rgbColorAll.map(function(val) {
                return val / nodesInfo[k].colorCount;
            });
            nodesInfo[k].color = nodesInfo[k].oriColor = '#' + rgbAverage.map(genHex).join("");
        } else {
            nodesInfo[k].color = nodesInfo[k].oriColor = '#' + hslToRgbNormalized(colorStep * (numColors - 2), satu, light).map(genHex).join("");
        }
    });

    var highlightColor = hslToHex(colorStep * (numColors - 1), satu, light);

    var doms = Object.keys(comms).map(function(k) {
        var arr = comms[k];
        var dom = document.createElement('div');
        dom.className = 'community-entry';
        dom.innerHTML = arr.map(function(id, ind) {
            return '<span class="person" data-nid="' + id + '" style="background-color: ' + nodesInfo[id].color + '">' +
                    nodesInfo[id].name + '</span>';
        }).join('');
        $(dom).hover(function() {
            $(dom).addClass('highlight');
            s.graph.nodes(arr).forEach(function(n) {
                n.color = highlightColor;
                n.size++;
            });
            s.refresh();
        }, function() {
            $(dom).removeClass('highlight');
            s.graph.nodes(arr).forEach(function(n) {
                n.color = n.oriColor;
                n.size--;
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
