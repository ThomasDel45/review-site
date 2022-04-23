
function doRequest(method, URL, body) {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest()
        xhr.open(method, URL)
        if(body != null && body != undefined)
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response)
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                })
            }
        }
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            })
        }
        xhr.send(body)
    })
}

const body = document.getElementsByTagName('body')[0]
const content = body.getElementsByClassName('content-block')[0]

async function loadContent(htmlname, jsnames) {

    // Load the HTML
    let html = await doRequest('GET', htmlname)
    content.innerHTML = html

    // Delete all scripts currently declared
    let scripts = document.head.getElementsByTagName('script')
    for(let i = 0; i < scripts.length; ++i)
        document.head.removeChild(scripts[i])

    // Load the scripts
    for(let jsname of jsnames) {
        let script = document.createElement('script')
        script.src=jsname
        document.head.append(script)
    }
}