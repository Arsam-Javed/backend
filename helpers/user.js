var jwt = require('jsonwebtoken');
var mongoose = require("mongoose");
var User = mongoose.model("users");

module.exports = {
    validateToken: function (req, callback) {
        var token = req.headers.token;
        if (typeof token != 'undefined' && '' != token) {
            jwt.verify(token, process.env.JWT_SECRETE, function (err, docode) {
                if (err) {
                    callback(false);
                } else {
                    callback(docode);
                }
            })
        } else {
            callback(false);
        }
    },

    isLogin: function (req, callback) {
        this.validateToken(req, function (user) {
            callback(user);
        });
    },

    isUserEmailExists: function (u_email, callback) {
        var where = {email: u_email};
        var status = 0;
        User.findOne(where, '_id', function (err, user) {
            if (err) {
                return callback(err, null);
            }
            if (user) {
                console.log("User Email Found");
                return callback(null, true);
            } else {
                console.log("User Email Not Found");
                return callback(null, false);
            }
        });
    },

    isUserNameExists: function (u_username, callback) {
        var where = {username: u_username};
        var status = 0;
        User.findOne(where, '_id', function (err, user) {
            if (err) {
                return callback(err, null);
            }
            if (user) {
                console.log("UserName Found");
                return callback(null, true);
            } else {
                console.log("UserName Not Found");
                return callback(null, false);
            }
        });
    }

};