// Passport.js Authentication

var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (_id, done) {
        User.findById(_id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {
            // If the user trying to login already exists
            User.findOne({
                'email': email
            }, function (err, user) {
                // If there are any errors, return the error            
                if (err) {
                    return done(err);
                }
                // Already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    // No user with that email create new user 
                    newUser = new User();
                    newUser.firstName = req.body.firstName;
                    newUser.lastName = req.body.lastName;
                    newUser.email = email;
                    newUser.password = bcrypt.hashSync(password, null, null);                    
                    newUser.save(function (err) {
                        if (err) {
                             throw err;
                        }                           
                        return done(null, newUser);
                    });
                }
            });
        }));

    passport.use('local-login', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {
            User.findOne({
                'email': email
            }, function (err, user) {
                // If there are any errors, return the error
                if (err) {
                    return done(err);
                }
                // User not found
                if (!user) {
                     return done(null, false, req.flash('loginMessage', 'User not found !'));
                }                   
                // User is found but the password is wrong
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, req.flash('loginMessage', 'Wrong password !'));
                }
                // Return successful user
                return done(null, user);
            });
        }));
};
