//npm modules
const express = require('express');
const uuid = require('uuid/v4');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const axios = require('axios');
const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('./models/conference');

// Connexion à mongodb
mongoose.connect('mongodb://localhost:27017/db');

//Stratégie de logging
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    (email, password, done) => {
        //Récupération des comptes situés dans db.json
        axios.get(`http://localhost:5000/users?email=${email}`)
            .then(res => {
                const user = res.data[0]
                if (!user) {
                    return done(null, false, {message: 'Invalid credentials.\n'});
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, {message: 'Invalid credentials.\n'});
                }
                return done(user, true);
            })
            .catch(error => done(error));
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    axios.get(`http://localhost:5000/users/${id}`)
        .then(res => done(null, res.data))
        .catch(error => done(error, false))
});

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// add & configure middleware
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cookieParser());
app.use(session({
    genid: (req) => {
        return uuid()
    },
    store: new FileStore(),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());

//Affichage de la page principale
app.get('/', (req, res) => {
    mongoose.model('Conference').find({}, (err, items) => res.render('index', {conferences: items}));

    // if (req.isAuthenticated()) {
    //     mongoose.model('Conference').find({}, (err, items) => res.render('index', {conferences: items}));
    // } else {
    //     res.redirect('/login')
    // }
})

// affichage d'une conférence
app.get('/conference/:id', (req, res) => {
    mongoose.model('Conference').findById(req.params.id, (err, conference) => {
        if (err)
            return res.send(err);
        res.render('conference', {conference})
    });
});

// Page de connexion
app.get('/login', (req, res) => {
    res.render('login')
})

// Back de connexion
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (info) {
            return res.send(info.message)
        }
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/login');
        }
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/authrequired');
        })
    })(req, res, next);
})

// Renvoie vers le login si pas connecte
app.get('/authrequired', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('/')
    } else {
        res.redirect('login/')
    }
})

// Deconnexion
app.get('/logout', function (req, res) {
    if (req.isAuthenticated()) {
        req.logout();
        res.redirect('/');
    } else {
        res.redirect('/')
    }
});

// Page d'ajout d'un user
app.get('/signup', (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.logout();
        res.render('register');
    } else {
        res.redirect('/');
    }
})

// Back d'ajout d'un user
app.post('/signup', (req, res, next) => {
    // TODO
})

// Lancement du serveur
server = app.listen(3000, () => {
    console.log('Listening on localhost:3000')
})

// Partie chat
const io = require('socket.io')(server)

io.on('connection', (socket) => {
    console.log('New user connected')

    socket.username = 'Anonymous';

    // Si nouveau message
    socket.on('new_message', (data) => {
        socket.emit('new_message', {message: data.message, username: socket.username})
    })

    // Si quelqu'un écrit
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {username: socket.username})
    })
})