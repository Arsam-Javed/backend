module.exports.controller = function (app) {
    var mongoose = require('mongoose');
    const promise = require("bluebird");
    var Regex = require("regex");
    var emailregex = require('regex-email');
    var passport = require("passport");
    var Customer = mongoose.model('users');
    var Admin = mongoose.model('admins');
    var userHelper = require("../helpers/user");

    var path = require('path');
    var multer = require('multer');

    const cors = require('cors');
    var fs = require('fs');

    app.use(cors());

    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/uploads/dp/')
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname)
        }
    })
    var upload = multer({ storage: storage })
    var type = upload.single('file');

    app.post("/admin/login/", function (req, res, next) {
        passport.authenticate('admin', function (err, user, info) {
            // If Passport throws/catches an error
            if (err) {
                res.status(200).json(err);
                return;
            }
            // If a user is found
            if (user) {
                   user.generateJwt(null, function(token){
                            res.status(200);
                            res.json({
                                success: true,
                                token: token
                            });
                        });

            } else {
                // If user is not found
                res.status(200).json(info);
            }
        })(req, res, next);
    });
};
