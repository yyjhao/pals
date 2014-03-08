'use strict';

$.get("/fb").done(function(json) {
    window.g = new GraphRenderer($("#graph-viewer"), json);
});