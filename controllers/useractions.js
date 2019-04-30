module.exports.controller = function (app) {
    var mongoose = require('mongoose');
    var passport = require("passport");
    const promise = require('bluebird');
    var Customer = mongoose.model('users');
    var Admin = mongoose.model('admins');
    var Categories = mongoose.model('categories');
    var Feedback = mongoose.model('feedbacks');
    var userHelper = require("../helpers/user");
    var Products = mongoose.model('products');
    var Conversation = mongoose.model('conversations');
    var Message = mongoose.model('messages');
    var Orders = mongoose.model('orders');
    var Location = mongoose.model('locations');
    var SpecialPickupPercentages = mongoose.model('specialpickuppercentages');
    var News = mongoose.model('news');
    var stripe = require('stripe')('sk_test_pmQC1e5HFj5dXJwCzxn0qc4T');
    var path = require('path');
    var multer = require('multer');
    var randomize = require('randomatic');
    var fcmHelper = require("../helpers/fcm_helper");
    var promoHelper = require("../helpers/promohelper");
    const cors = require('cors');
    var fs = require('fs');
    var async = require('async');
    var OffDays = mongoose.model('offdays');

    var request = require("request");
    var parser = require('xml2json');

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

    var laundream_chat_id = 'laundream_admin_chat';
    var laundream_chat_name = 'Laundry TEAM';
    var laundry_chat_image = process.env.BASE_URL+'uploads/dp/admin.png';

    app.get("/useractions/test/", function (req, res) {     
         res.json({
                success: true,
                message: req.token_decoded.d
            })
    })
    app.get("/useractions/getspecialpickuppercentage/", function (req, res) {     
        return SpecialPickupPercentages.findOne({})
        .then((spp)=>{
            res.json({
                success: true,
                percentage: spp.percentage
            })
        })
        .catch((err)=>{
          res.json({
                success: false,
                message: 'Something wrong'
              });
        })
    });
    app.get("/useractions/offdays/", function (req, res) {     
        return OffDays.findOne({})
        .then((offdays)=>{
            res.json({
                success: true,
                offdays: offdays
            })
        })
        .catch((err)=>{
          res.json({
                success: false,
                message: 'Something wrong'
              });
        })
    });
    app.get("/useractions/getnews/", function (req, res) {     
        return News.find({},{}, { sort: { 'created_at' : -1 }})
        .then((news)=>{
           res.json({
                success: true,
                news: news
            }) 
        })   
        .catch((err)=>{
            console.log(err);
            res.json({
                success: false,
                message: err
            })
         })      
    })
    app.post("/useractions/storefcm/", function (req, res) {     
         fcmHelper.store_fcm_token(req, null)
         .then((done)=>{
            console.log(done);
            res.json({
                success: true,
                message: 'Successfully Added'
             })
         })
         .catch((err)=>{
            console.log(err);
            res.json({
                success: false,
                message: err
            })
         })
    });
    app.post("/useractions/changepassword/", function (req, res) {
        var current_password = req.body.current_password;
        var new_password = req.body.new_password;
        if(current_password.trim() != "" && new_password.trim() != "")
        {
          return Customer.findOne({_id: req.token_decoded.d})
          .then((customer)=>{
            if(customer)
            {
              if(customer.validPassword(current_password))
              {
                customer.setPassword(new_password);
                customer.originalPassword = new_password;
                return customer.save()
              }
              else
              {
                return promise.reject("Current password is not correct");
              }
            }
            else{
              return promise.reject("User doesn't exist");
            }
         })
        .then((customer)=>{
            res.json({
              success: true,
              message: "Successfully Updated"      
            });
        })
        .catch((err)=>{
            res.json({
              success: false,
              message: err
            })
        })
      }
      else
      {
        res.json({
            success: false,
            message: "Empty Password"
        })
      }
    });
    app.post("/useractions/easypaypayment/", function (req, res) {
      let body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dto="http://dto.transaction.partner.pg.systems.com/" xmlns:dto1="http://dto.common.pg.systems.com/">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <dto:initiateTransactionRequestType>
                       <dto1:username>` + process.env.EASYPAY_USERNAME + `</dto1:username>
                       <dto1:password>` + process.env.EASYPAY_PASSWORD + `</dto1:password>
                       <orderId>` + req.body.orderId + `</orderId>
                       <storeId>` + process.env.EASYPAY_STORE_ID + `</storeId>
                       <transactionAmount>` + req.body.amount + `</transactionAmount>
                       <transactionType>MA</transactionType>
                       <msisdn></msisdn>
                       <mobileAccountNo>` + req.body.mobileNumber + `</mobileAccountNo>
                       <emailAddress>?</emailAddress>
                    </dto:initiateTransactionRequestType>
                 </soapenv:Body>
              </soapenv:Envelope>`;
      var options = { 
        rejectUnauthorized: false,
        method: 'POST',
        url: 'https://easypaystg.easypaisa.com.pk:443/easypay-service/PartnerBusinessService',
        headers: 
        { 
         'content-type': 'text/xml' 
        },
        body: body 
      };

    request(options, (error, response, body) => {
      if (error) 
      {
        console.log("Error in requesting");
        console.log(error);
      }
      else
      { 
        var jsonString = parser.toJson(body);
        var jsonResponse = JSON.parse(jsonString);
        if(jsonResponse['soapenv:Envelope']['soapenv:Body']['ns3:initiateTransactionResponseType']['ns2:responseCode'] == '0001')
        {
          return res.json({
            success: false
          })
        }
        else if(jsonResponse['soapenv:Envelope']['soapenv:Body']['ns3:initiateTransactionResponseType']['ns2:responseCode'] == '0000')
        {
          var toUpdate = {
            telenor_transaction_id: jsonResponse['soapenv:Envelope']['soapenv:Body']['ns3:initiateTransactionResponseType']['transactionId'],
            telenor_payment: true,
            telenor_payment_received: req.body.amount
          }
          return Orders.findOneAndUpdate({ordernumber: req.body.orderId}, toUpdate, {new: true})
          .then((order)=>{
              return res.json({
                success: true,
                message: "Successfully made the order",
                order: order
              })
          })
          .catch((err)=>{
            console.log(err);
            res.json({
              success: false,
              message: err
            })
         })
        }
      }
    });

    
    });
    app.get('/useractions/logout/', function (req, res) {
      console.log("loggin out");
        fcmHelper.delete_fcm_token(req)
         .then((done)=>{
            console.log(done);
            res.json({
                success: true,
                message: 'Successfully Deleted'
             })
         })
         .catch((err)=>{
            console.log(err);
            res.json({
                success: false,
                message: err
            })
         })
    });
    app.get('/useractions/getmessages/', function (req, res) {
        return Conversation.findOne({ $or: [{from: req.token_decoded.d , to: laundream_chat_id},{from: laundream_chat_id , to: req.token_decoded.d}]})
        .then((conversation)=>{
          if(conversation)
          {
            Message.find({conversationID:conversation._id}, function (err, messages) {
                res.json({
                    success: true,
                    messages: messages,
                    conversation: conversation
                });
            });
          }
        })
    });
};