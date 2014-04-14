$('.start-button').click(function() {
    'use strict';
    localStorage.setItem('last-try', 0);
    localStorage.setItem('anon-last-try', 0);
    $("#loading-screen").show();
    $.ajax({
        url: '/fb',
        timeout: 3600 * 1000
    }).done(function(json) {
        $("#loading-screen").hide();
        $('#graph-viewer').height(window.innerHeight);
        $('html, body').animate({
            scrollTop: $('#graph-viewer').offset().top
        }, 1000);
        if (json.error_code) {
            alert(json.error_msg);
        }
        window.g = new GraphRenderer($('#graph-viewer'), json);
    }).fail(function() {
        localStorage.setItem('last-try', Date.now());
        location = '/fb_login';
    });
});

$('.anon-start-button').click(function() {
    'use strict';
    localStorage.setItem('anon-last-try', 0);
    localStorage.setItem('last-try', 0);
    $("#loading-screen").show();
    $.ajax({
        url: '/fb',
        timeout: 3600 * 1000
    }).done(function(json) {
        $("#loading-screen").hide();
        $('#graph-viewer').height(window.innerHeight);
        $('html, body').animate({
            scrollTop: $('#graph-viewer').offset().top
        }, 1000);
        if (json.error_code) {
            alert(json.error_msg);
        }
        window.g = new GraphRenderer($('#graph-viewer'), json, true);
    }).fail(function() {
        localStorage.setItem('anon-last-try', Date.now());
        location = '/fb_login';
    });
});

if (Date.now() - parseInt(localStorage.getItem('anon-last-try'), 10) < 300000) {
    $('.anon-start-button').click();
} else if (Date.now() - parseInt(localStorage.getItem('last-try'), 10) < 300000) {
    $('.start-button').click();
}
