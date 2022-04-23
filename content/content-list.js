document.getElementById('btn-return-home').addEventListener('click', function(ev) {
    ev.preventDefault()
    loadContent('content/home.html', ['content/home.js'])
})