var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var form = require('express-form2'),
    filter = form.filter,
    field = form.field,
    validate = form.validate;
var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var User = require('../models/user');
var Poll = require('../models/poll');

module.exports = function (app, passport) {

    app.get('/', function (req, res) {
        res.render('index');
    });

    app.get('/login', function (req, res) {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    app.post('/login', passport.authenticate('local-login', {
            failureRedirect: '/login',
            successRedirect: '/profile',
            failureFlash: true // Allow flash messages
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            res.redirect('/');
        });

    app.get('/signup', function (req, res) {
        res.render('signup', {
            message: req.flash('signupMessage')
        });
    });

    app.post(
        '/signup',
        // Form filter and validation        
        form(
            field("firstName").trim().required().is(/^[A-z]+$/),
            field("lastName").trim().required().is(/^[A-z]+$/),
            field("password").trim().required().len(8, 72, "Password must be between 8 and 72 characters"),
            field("email").trim().required().isEmail(),
            validate("rpassword").equals("field::password")
        ),

        // Express request-handler now receives filtered and validated data 
        function (req, res) {
            // Additional validations            
            req.body.email = req.body.email.toLowerCase();

            if (!req.form.isValid) {
                // Handle errors 
                //console.log(req.form.errors);
                //TODO: flash messages
                res.redirect('/signup');

            } else {
                passport.authenticate('local-signup', {
                    successRedirect: '/login',
                    failureRedirect: '/signup',
                    failureFlash: true
                })(req, res);
            }
        }
    );

    app.get('/error', function (req, res) {
        res.render('error', {
            message: req.flash('errorMessage')
        });
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile', {
            user: req.user // get the user out of session and pass to template
        });
    });

    app.get('/profile/poll', isLoggedIn, function (req, res) {
        Poll.find({
            owner_id: req.user.id
        }, {
            '_id': 0,            
            owner_id: 0,
            voter_id: 0
        }, {
            sort: {
                '_id': -1
            }
        }, function (err, polls) {
            if (err) throw err;            
            //return res.json(polls);            
            res.render('poll', {
                user: req.user,
                poll: polls
            });
        });
    });

    // Create new poll
    app.post('/profile/poll', isLoggedIn,
        form(
            field("question").trim().required(),
            field("option1").trim().required(),
            field("option2").trim().required()
        ),
        // TODO: dynamic input verification

        function (req, res) {
            //console.log("POST Poll: user id", req.user);

            // TODO: verify options must be unique 
            if (!req.form.isValid) {
                // Handle errors 
                console.log(req.form.errors);
                return res.redirect('/profile/poll');
            }
            //console.log("Req BODY: ", req.body);
            var option1 = req.body.option1;
            var option2 = req.body.option2;
            var pollOptions = {};
            pollOptions[option1] = 0;
            pollOptions[option2] = 0;

            var newPoll = new Poll({
                owner_id: req.user.id,
                question: req.body.question,
                options: pollOptions
            });
            //console.log(newPoll)
            newPoll.save(function (err, poll) {
                console.log("save new poll", poll);
                if (err) throw err;
            });
            res.render('profile', {
                user: req.user
            });
        }
    );

    // Public polls
    app.get('/polls', function (req, res) {
        res.render('polls', {
            user: req.user
        });
    });


    // API routes

    app.get('/api', function (req, res) {
        res.render('api', {
            message: req.flash('message')
        });
    });

    // GET all polls
    app.get('/api/poll', function (req, res) {
        // Find all documents, hide _id, pid, owner_id, voter_id, sort by latest poll
        Poll.find({}, {
            '_id': 0,
            pid: 0,
            owner_id: 0,
            voter_id: 0
        }, {
            sort: {
                '_id': -1
            }
        }, function (err, polls) {
            if (err) throw err;
            //console.log(polls);
            res.json(polls);
        });
    });

    // GET poll by id
    app.get('/api/poll/:id', function (req, res) {
        //console.log(req.params.id, "PID");
        if (req.params.id > 0) {
            // Find poll by id
            Poll.find({
                pid: req.params.id
            }, {
                '_id': 0,
                voter_id: 0
            }, function (err, polls) {
                if (err) throw err;
                if (Object.keys(polls).length > 0) { // poll object is not empty
                    return res.json(polls);
                } else {
                    var response = {
                        'not found': 0
                    };
                    res.json(response);
                }
            });
        } else {
            var response = {
                'not found': 0
            };
            res.json(response);
        }
    });

    // DELETE poll by id
    // Todo check if user is logged
    app.delete('/api/poll/:id', function (req, res) {
        // TODO check if user is owner of the poll
        //console.log(req.user, "USER");
        var testOwnerId = 6;
        if (req.params.id > 0) {
            // Find poll by id
            Poll.find({
                pid: req.params.id
            }, {
                '_id': 0,
                voter_id: 0
            }, function (err, polls) {
                if (err) throw err;
                if (Object.keys(polls).length > 0) { // poll object is not empty
                    //console.log(polls);
                    //console.log(testOwnerId, ' ', polls[0].owner_id);
                    if (polls[0].owner_id === testOwnerId) {
                        //console.log('DELETE Poll');
                        Poll.remove({
                            pid: req.params.id
                        }, function (err) {
                            if (err) return err;
                            var response = {
                                'deleted': 1
                            };
                            return res.json(response);
                        });
                    }

                } else {
                    var response = {
                        'not found': 0
                    };
                    res.json(response);
                }
            });
        } else {
            var response = {
                'not found': 0
            };
            res.json(response);
        }
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // Return 404 on missing pages
    app.get('*', function (req, res) {
        res.status(404).send('Error: 404. Page not found !');
    });

};

// Is authenticated policy
// Make sure the user is logged
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if user is not logged redirect to home page
    res.redirect('/');
}
