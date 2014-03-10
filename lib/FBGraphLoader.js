'use strict';

var Q = require('q');

var LIMIT = 200;

function getCount(fb) {
    var d = Q.defer();
    fb.api('/me/?fields=friends.fields(id)', function(err, data) {
        if (err) {
            d.reject(err);
        } else {
            d.resolve(data.friends.data.length);
        }
    });
    return d.promise;
}

function apiDefer(fb, apiCall) {
    var d = Q.defer();
    fb.api(apiCall, function(err, data) {
        if (err) {
            d.reject(err);
        } else {
            d.resolve(data);
        }
    });
    return d.promise;
}

var FBGraphLoader = module.exports = {
    load: function(fb, callback) {
        getCount(fb).then(function(count) {
            var offsets = [];
            for (var o = 0; o < count; o += LIMIT) {
                offsets.push(o);
            }
            return Q.all(offsets.map(function(off) {
                return apiDefer(fb,
                    '/me/?fields=friends.limit(' + LIMIT +
                        ').offset(' + off +
                        ').fields(name,mutualfriends.fields(id))');
            }));
        }).then(function(dataArr) {
            callback(null, [].concat.apply([], dataArr.map(function(data) {
                return data.friends.data;
            })));
        }, function(err) {
            callback(err);
        });
    }
};
