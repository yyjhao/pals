'use strict';

var express = require('express'),
    http = require('http'),
    path = require('path'),
    connect = require('connect'),
    Graph = require('./lib/Graph'),
    Facebook = require('facebook-node-sdk'),
    config = require('./config'),
    RedisStore = require('connect-redis')(connect),
    redis = require('redis').createClient(config.redis.unixSocket),
    FBGraphLoader = require('./lib/FBGraphLoader'),
    fs = require('fs');

var app = express();

config.redisStore.client = redis;

var sessionStore = new RedisStore(config.redisStore);

app.configure(function() {
    app.set('port', config.port);
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: config.secret, store: sessionStore }));
    app.use(Facebook.middleware({
        appId: config.fb.id,
        secret: config.fb.secret
    }));
});

app.configure('production', function() {
    app.use(express.static(path.join(__dirname, 'public-dist')));
});

app.configure('development', function() {
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.errorHandler());
});

app.get('/fb_login', Facebook.loginRequired(), function(req, res) {
    res.redirect('/');
});

app.get('/fb_ok_store_it', function(req, res) {
    if (!req.session.user_id) {
        return res.send(500);
    } else {
        console.log("getting fb data for user id", req.session.user_id)
        FBGraphLoader.load(req.facebook, function(err, data) {
            if (err) {
                console.log('err', err);
                res.send(500);
            } else if (data.error_code) {
                console.log('fb err', data);
                res.send(data);
            } else {
                fs.writeFile(req.session.user_id + '.json', JSON.stringify(data), function() {
                    res.send(data);
                });
            }
        });
    }
});

var fbTasks = {};
app.get('/fb', function(req, res) {
    res.connection.setTimeout(0);
    if (!req.session.user_id) {
        return res.send(500);
    } else {
        if (fbTasks[req.session.user_id]) {
            fbTasks[req.session.user_id].done(function(result) {
                if (err) {
                    console.log('compute community err', err, err.stack);
                    return res.send(500);
                }
                var err = result[0],
                    nc = result[1],
                    pos = result[2],
                    graph = result[3];
                res.send({
                    nodes: graph.nodes,
                    edges: graph.edges,
                    communities: nc,
                    positions: pos
                });
            });
        } else {
            console.log("getting fb data for user id", req.session.user_id)
            FBGraphLoader.load(req.facebook, function(err, data) {
                if (err) {
                    console.log('err', err);
                    res.send(500);
                } else if (data.error_code) {
                    console.log('fb err', data);
                    res.send(data);
                } else {
                    var graph = Graph.fromFB(data);
                    var task = graph.computeCommunities();
                    fbTasks[req.session.user_id] = task;
                    task.done(function(result) {
                        delete fbTasks[req.session.user_id];
                        var err = result[0],
                            nc = result[1],
                            pos = result[2];
                        if (err) {
                            console.log('compute community err', err, err.stack);
                            return res.send(500);
                        }
                        res.send({
                            nodes: graph.nodes,
                            edges: graph.edges,
                            communities: nc,
                            positions: pos
                        });
                    });
                }
            });
        }
    }
    // var graph = Graph.fromFB(require('./530811368.json'));
    // var graph = Graph.fromFB(require('./683128635.json'));
    // var graph = Graph.fromFB(require('./1578734144.json'));
    // var graph = Graph.fromFB(require('./100003367083848.json'));
    // var graph = Graph.fromFB(require('./654382555.json'));
    // var graph = Graph.fromFB(require('./629031919.json'));
    // graph.computeCommunities().done(function(err, nc, pos) {
    //     if (err) {
    //         return console.log(err);
    //     }
    //     res.send({
    //         nodes: graph.nodes,
    //         edges: graph.edges,
    //         communities: nc,
    //         positions: pos
    //     });
    // }));
});


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
// 