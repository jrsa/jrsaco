(function(w, d) {

    var xhr, $content, $button;

    function ajaxHandler(e) {
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            $content.innerHTML = xhr.responseText;
        }
    }

    function portfolioButtonHandler(e) {
        $content.innerText = "loading..."

        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = ajaxHandler;
        xhr.open('GET', '/projects/', true);
        xhr.send();
    }

    function init() {
        $content = d.getElementsByClassName('content')[0];
        $button = d.getElementById("portfolio-button");
        $button.addEventListener('click', portfolioButtonHandler, true);
    }

    init();
})(window, document)