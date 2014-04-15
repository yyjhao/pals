function startLoading(anon) {
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
        window.g = new GraphRenderer($('#graph-viewer'), json, anon);
    }).fail(function() {
        if (anon) {
            localStorage.setItem('anon-last-try', Date.now());
        } else {
            localStorage.setItem('last-try', Date.now());
        }
        location = '/fb_login';
    });
}

$('.start-button').click(function() {
    startLoading();
});

$('.anon-start-button').click(function() {
    startLoading(true);
});

if (Date.now() - parseInt(localStorage.getItem('anon-last-try'), 10) < 300000) {
    $('.anon-start-button').click();
} else if (Date.now() - parseInt(localStorage.getItem('last-try'), 10) < 300000) {
    $('.start-button').click();
}
