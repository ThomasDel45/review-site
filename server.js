
// Express server settings
const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()

app.set('port', 3111)
app.use(express.urlencoded( { extended: true } )) // Allow HTML form POST
app.use(cookieParser()) // Handle cookies 
const sessionDuration = 1.8e+6

function hostFile(path) {
    app.get('/' + path, function(req, res) { res.sendFile(__dirname + '/' + path) })
}

function hostFile(alias, path) {
    app.get('/' + alias, function(req, res) { res.sendFile(__dirname + '/' + path) })
}

function hostFolder(folder) {
    app.use(folder, express.static(__dirname + folder + '/'))
}

// MongoDB settings
const mongo = require('mongodb')
const MongoClient = mongo.MongoClient
const dbURL = 'mongodb://localhost:27017'

// =================== SESSION MANAGEMENT ===================

let userSessions = []

function deleteSession(id) {
    userSessions = userSessions.filter(function(_session) {
        return id != _session._ID
    })
}

function deleteSessionUser(user) {
    userSessions = userSessions.filter(function(_session) {
        return user !== _session.username
    })
}

function findSession(sessionID) {
    
    if (sessionID == undefined || sessionID == null)
        return undefined

    const session = userSessions.find(function(_session) {
        return sessionID == _session._ID
    })

    if(session == undefined)
        return undefined

    return session
}

function makeSessionTimeout(sessionID) {
    return {
        uid: sessionID,
        timeout: setTimeout(() => {
            console.log('ending session %s due to inactivity', this.uid)
            deleteSession(this.uid)
        }, sessionDuration),
        reset: function () {
            clearTimeout(this.timeout)
            this.timeout = setTimeout(() => {
                console.log('ending session %s due to inactivity', this.uid)
                deleteSession(this.uid)
            }, sessionDuration)
        }
    }
}

function touchSession(sessionID) {

    const session = userSessions.find(function(_session) {
        return sessionID == _session._ID
    })

    if(!session)
        return

    session._timeout.reset()

}

// =================== PUBLIC API ===================

app.post('/api/createAccount', function(req, res) {

    console.log('Trying to create account request for user: ' + req.body.username)

    const user = req.body.username
    const pass = req.body.password

    if(!user || !pass || user.length < 1 || pass.length < 1) {
        res.status(400).send('Please specify both a username and password')
        return
    }

    MongoClient.connect(dbURL)
    .then(conn => {
        const db = conn.db('jnf-review')
        const coll = db.collection('accounts')
        coll.findOne({
            username: user
        })
        .then(account => {
            if(account) {
                console.log('\tAccount already exists')
                res.status(400).send('User already exists')
                conn.close()
            } else {
                console.log('\tCreating an account for user')
                coll.insertOne({
                    username: user,
                    password: pass
                })
                .then(record => {
                    console.log('\tAccount successfully created')
                    if(req.query.target)
                        res.redirect(req.query.target)
                    else
                        res.status(200).send('Success')
                })
                .catch(err => {
                    console.log('Failed to insert a record: ' + err)
                    res.status(500).send('Internal server error')
                })
                .finally(() => {
                    conn.close()
                })
            }
        })
        .catch(err => {
            console.log('Failed to search for a record: ' + err)
            res.status(500).send('Internal server error')
        })
    })
    .catch(err => {
        console.log('Couldn\'t connect to server: ' + err)
        res.status(500).send('Internal server error')
    })

})

app.post('/api/login', function(req, res) {

    console.log('login request for user: ' + req.body.username)

    const user = req.body.username
    const pass = req.body.password

    // Log out the user if they are already logged in\
    deleteSessionUser(user)

    MongoClient.connect(dbURL)
    .then(conn => {
        const db = conn.db('jnf-review')
        const coll = db.collection('accounts')
        coll.findOne({
            username: user,
            password: pass
        })
        .then(account => {

            if(account) {

                const uid = parseInt(Math.ceil(Math.random() * Date.now()).toPrecision(16).toString().replace(".", ""))
        
                userSessions.push({
                    username: user,
                    _ID: uid,
                    _timeout: makeSessionTimeout(uid)
                })
            
                console.log('\tLogging in user ' + user + ' as session ' + uid)

                res.cookie('session', uid, { maxAge: sessionDuration })
                touchSession(uid)
                if(req.query.target)
                    res.redirect(req.query.target)
                else
                    res.status(200).send('Success')

            } else
                res.status(400).send('Invalid Credentials')

        })
        .catch(err => {
            console.log('Failed to search for a record: ' + err)
            res.status(500).send('Internal server error')
        })
        .finally(() => {
            conn.close()
        })
    })
    .catch(err => {
        console.log('Couldn\'t connect to server: ' + err)
        res.status(500).send('Internal server error')
    })

})

app.delete('/api/login', function(req, res) {

    console.log('logout request for session: ' + req.cookies.session)

    if (!req.cookies.session || !findSession(req.cookies.session)) {
        res.status(400).send('Invalid session ID provided')
        return
    }

    console.log('\t logging out session ' + req.cookies.session)
    deleteSession(req.cookies.session)

    res.status(200).send('Success')

})

// =================== PUBLIC ASSETS ===================

// Bare minimum of files needed to render the login screen
hostFile('content/login.html')
hostFile('content/login.js')
hostFile('content.js')
hostFile('style/container.css')
hostFile('style/login.css')
hostFile('index-login.js')

// The login screen
app.get('/login', function(req, res) {
    if (req.cookies.session && findSession(req.cookies.session)) {
        res.redirect('/')
    } else {
        res.sendFile(__dirname + '/index-login.html')
    }
})

// =================== AUTHENTICATION PROTECTED ===================
// All URLS beyond this point are protected by authentication

// Middleware to force authentication
app.use(function(req, res, next) {

    // If session is expired, invalid, or missing, direct to login
    if (!req.cookies.session || !findSession(req.cookies.session)) {
        return res.redirect('/login')
    }

    // Refresh the session
    res.cookie('session', req.cookies.session, { maxAge: sessionDuration })
    touchSession(req.cookies.session)

    next()
})

// API Urls
app.get('/api/getReviews', function(req, res) {

    MongoClient.connect(dbURL)
    .then(conn => {
        conn.close()
    })
    .catch(err => {

    })

})

// Front-end URLs
hostFolder('/style')
hostFolder('/content')
hostFile('index.js')
hostFile('', '/index.html')

app.listen(app.get('port'), function() {
    console.log('Express server active on port %d', app.get('port'))
    console.log('Visit http://localhost:%d', app.get('port'))
})