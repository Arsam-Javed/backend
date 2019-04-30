var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('users');
var Admin = mongoose.model('admins');
var Rider = mongoose.model('riders');

passport.use('user',new LocalStrategy( {
    usernameField: 'username',
    passwordField: 'password'
  },
    function (username, password, done) {
        User.findOne({username: username.toLowerCase()}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    success: false,
                    errorMsg: 'Invalid Username or Password'
                });
            }
            if (!user.validPassword(password)) {
                return done(null, false, {
                    success: false,
                    errorMsg: 'Invalid Username or Password'
                });
            }
            return done(null, user);
        });
    }
));

passport.use('admin',new LocalStrategy( {
    usernameField: 'email',
    passwordField: 'password'
  },
    function (username, password, done) {
        Admin.findOne({email: username.toLowerCase()}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    success: false,
                    errorMsg: 'Invalid Username or Password'
                });
            }
            if (!user.validPassword(password)) {
                return done(null, false, {
                    success: false,
                    errorMsg: 'Invalid Username or Password'
                });
            }
            return done(null, user);
        });
    }
));

passport.use('rider',new LocalStrategy( {
    usernameField: 'username',
    passwordField: 'password'
  },
    function (username, password, done) {
        Rider.findOne({username: username.toLowerCase()}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    success: false,
                    errorMsg: 'Invalid Username or Password'
                });
            }
            if (!user.validPassword(password)) {
                return done(null, false, {
                    success: false,
                    errorMsg: 'Invalid Username or Password'
                });
            }
            return done(null, user);
        });
    }
));