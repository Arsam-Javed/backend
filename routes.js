module.exports.controller = function (app) {
    var jwt = require('jsonwebtoken');

    app.get("/", function (req, res, next) {
        var post = {
            title: "Laundry Api is Up "
        };
        res.send(post);
        next();
    });

    app.use("/user", function (req, res, next) {
        console.log("In user");
        route = require('./controllers/users');
        route.controller(app);
        next();
    });
    app.use("/admin", function (req, res, next) {
        console.log("In admin");
        route = require('./controllers/admin');
        route.controller(app);
        console.log("ok till here");
        next();
    });
    app.use("/rider", function (req, res, next) {
        console.log("In admin");
        route = require('./controllers/riders');
        route.controller(app);
        next();
    });
    app.use("/useractions", function (req, res, next) {
        console.log("In useractions");
        var token = req.headers['token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRETE, function(err, token_decoded) {
                if (err) {
                    return res.json({ success: false, message: 'Failed to authenticate token.' });
                } else {
                req.token_decoded = token_decoded;
                route = require('./controllers/useractions');
                route.controller(app);
                next();
        }
            });
        } else {
            // if there is no token, return an error
            console.log("Token not found. Falling for 403 error...");
            return res.status(403).send({ 
                success: false, 
                message: 'No token provided.' 
            });
        }
  });  
};