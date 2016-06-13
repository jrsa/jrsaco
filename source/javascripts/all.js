var cwekhja = 'gtm-t3rc5w';
(function(x,y,z,l,i) {
    x[l] = x[l] || [];
    x[l].push({
        event: 'gtm.js',
        'gtm.start': new Date().getTime()
    });
    var f = y.getElementsByTagName(z)[0];
    var j = y.createElement(z), dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = '//www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', cwekhja.toUpperCase());