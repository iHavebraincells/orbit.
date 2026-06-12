document.addEventListener("DOMContentLoaded", function() {
    if(window.location.protocol === 'http:'){
        if (window.location.host === 'localhost'){
    
        }
        else if (window.location.host === '127.0.0.1'){
    
        }
        else{
            document.getElementById('uv-address').disabled = true;
            document.getElementById('uv-address').placeholder = 'please turn on HTTPS to use this site!';
        }
    }
});
