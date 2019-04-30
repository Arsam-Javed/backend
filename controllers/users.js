module.exports.controller = function (app) {
    var mongoose = require('mongoose');
    const promise = require("bluebird");
    var Regex = require("regex");
    // var emailregex = new Regex(/(a|b)*abb/);
    var emailregex = require('regex-email');
    // var mongoose = Promise.promisifyAll(require("mongoose"))
    var passport = require("passport");
    var Customer = mongoose.model('users');
    var userHelper = require("../helpers/user");

    var path = require('path');
    var multer = require('multer');

    var Categories = mongoose.model('categories');
    var Products = mongoose.model('products');
    var ForgetPassword = mongoose.model('forgetpasswords');
    var randomize = require('randomatic');
    var Cryptr = require('cryptr'),
        cryptr = new Cryptr(process.env.ENCRYPTOR_SECRET);
    var async = require('async');
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

    app.post("/user/checkemailandpassword/", function (req, res) {
        var email = req.body.email.toLowerCase();
        var username = req.body.username.toLowerCase();
        return Customer.findOne({email: email})
        .then((customer)=>{
            if(customer){
                return promise.reject('Email Already Registered');
            }
            return Customer.findOne({username: username})
        })
        .then((customer)=>{
          if(customer){
              return promise.reject('Username already picked');
          }
          else
          {
              res.status(200);
                return res.json({
                    success: true,
                    message: "All is fine"
                });
          }
        })
        .catch((err) => {
            return res.json({
                success: false,
                message: err
            });
        });
    });
    app.get("/user/resetpassword/", function (req, res) {
        var token = req.query.token;
        var logo = process.env.BASE_URL + 'uploads/logo.png';
        var post = process.env.BASE_URL+'user/resetpassword/';
        res.set('Content-Type', 'text/html');
        res.render("resetpassword.ejs", {token: token, post: post, logo: logo}); 
    });
    app.post("/user/guestlogin/", function (req, res, next) {
      console.log(req.body);
        var username = req.body.username;
        var password = req.body.password;
         return Customer.findOne({username: username.toLowerCase()})
            .then((customer)=>{
                if(customer.validPassword(password))
                { 
                    return customer.generateJwt('guest', function(token){
                        res.status(200);
                        return res.json({
                            success: true,
                            token: token
                        });
                    });
                }
            })
            .catch((err) => {
                console.log("Erro");
                console.log(err);
                return res.json({
                    success: false,
                    message: err
                });
            });
    });
    app.get("/user/getalldata/", function (req, res) {
        var data = [];
        return Categories.find({active: 1},{}, { sort: { 'created_at' : 1 }})
        .then((categories)=>{
          return Products.find({active: 1},{}, { sort: { 'created_at' : 1 }})
          .then((products)=>{
            return {categories: categories, products: products};
          })
        })
        .then((all)=>{
            .then((done)=>{
                res.json({
                    success: true,
                    data: all      
                });
            })
        })
       .catch((err)=>{
          res.json({
            success: false,
            message: err
          })
       })
    });
};
