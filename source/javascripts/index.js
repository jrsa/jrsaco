
(function(d) {
    var setup_info_toggling = function() {
        var itemclick = function(e) {
            var $info = this.getElementsByClassName("info")[0]

            if($info.style.display) {            
                if ($info.style.display === "none") {
                    $info.style.display = 'block';
                } else {
                    $info.style.display = 'none';
                }
            } else {
                $info.style.display = 'block';
            }
        }

        var items = d.getElementsByClassName('item')

        for (var i = items.length - 1; i >= 0; i--) {
            items[i].addEventListener('click', itemclick, true)
        }
    }

    function ready(callback){
        // in case the document is already rendered
        if (d.readyState!='loading') callback();
        // modern browsers
        else if (d.addEventListener) d.addEventListener('DOMContentLoaded', callback);
        // IE <= 8
        else d.attachEvent('onreadystatechange', function(){
            if (d.readyState=='complete') callback();
        });
    }

    ready(setup_info_toggling);
    
})(document)
