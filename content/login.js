let isLogin = true
let action = "/api/login"
const switchBtn = document.getElementById('btn-switch')
const submitBtn = document.getElementById('submit')
const title = document.getElementById('title')
const username = document.getElementById('username')
const password = document.getElementById('password')
const errorReason = document.getElementById('error-reason')

switchBtn.addEventListener('click', function(ev) {
    
    if(isLogin) {
        // Change to create account form
        title.textContent = 'Create Account'
        action = "/api/createAccount"
        switchBtn.value = "Return to Login"
        errorReason.innerText = ''
        isLogin = false
    } else {
        // Change to login form
        title.textContent = 'Login'
        action = "/api/login"
        switchBtn.value = "Create an Account"
        errorReason.innerText = ''
        isLogin = true
    }

})

submitBtn.addEventListener('click', function(ev) {
    ev.preventDefault()
    doRequest('POST', action, 'username='+username.value+'&password='+password.value)
    .then(function(response) {
        if(isLogin) {
            window.location.replace('/')
        } else {
            window.location.replace('/login')
        }
    })
    .catch(function(err) {
        if(isLogin) {
            if(err.status == 400)
                errorReason.innerText = "Invalid Credentials"
            else
                errorReason.innerText = "Internal error: Try again."
        } else {
            if(err.status == 400)
                errorReason.innerText = "Username is taken"
            else
                errorReason.innerText = "Internal error: Try again."
        }
    })
})