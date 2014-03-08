'use strict';

$('.start-button').click(function() {
    localStorage.setItem('last-try', 0);
    $("#loading-screen").show();
    $.get('/fb').done(function(json) {
        $("#loading-screen").hide();
        $('#graph-viewer').height(window.innerHeight);
        $('html, body').animate({
            scrollTop: $('#graph-viewer').offset().top
        }, 1000);
        window.g = new GraphRenderer($('#graph-viewer'), json);
    }).fail(function() {
        localStorage.setItem('last-try', Date.now());
        location = '/fb_login';
    });
});

if (Date.now() - parseInt(localStorage.getItem('last-try'), 10) < 300000) {
    $('.start-button').click();
}