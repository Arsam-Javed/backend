var mongoose = require('mongoose');
var passport = require("passport");
const promise = require('bluebird');
var async = require('async');
var Customer = mongoose.model('users');

var stripe = require('stripe')('sk_test_pmQC1e5HFj5dXJwCzxn0qc4T');
var path = require('path');
var multer = require('multer');


var FCM = require('fcm-node');
var serverKey = process.env.SERVER_FCM_KEY;
var fcm = new FCM(serverKey);


const cors = require('cors');

module.exports = {
    delete_fcm_token: function (req) {
        var where = {_id: req.token_decoded.d};
        return Customer.findOne(where)
        .then((customer)=>{
            if(customer.fcm_tokens)
            {
                customer.fcm_tokens = [];
            }
            return customer.save()
        })
        .catch((err)=>{
            return err;
        })
    },
    store_fcm_token: function (req) {
        var where = {_id: req.token_decoded.d};
        return Customer.findOne(where)
        .then((customer)=>{
            if(customer.fcm_tokens)
            {
                customer.fcm_tokens = [{token: req.body.token, devicetype: req.body.devicetype}];
            }
            return customer.save()
        })
        .catch((err)=>{
            return err;
        })
    },
    send_notification_to_client: function (customer_id,title,messagetosend, type, from) {
        console.log("sending notification");
        var tokens = [];
        var where = {_id: customer_id};
        return Customer.findOne(where)
        .then((customer)=>{
            if(customer.fcm_tokens)
            {
                tokens = customer.fcm_tokens;
                customer.fcm_tokens.forEach(tokenObj => {
                     if (!tokenObj.token) {
                        return;
                      }
                      var payload = {};

                      var androidData = {
                        title: title,
                        body: messagetosend
                      };

                      var iosData = {
                      };
                    if(tokenObj.devicetype == 'android')
                    {
                        var message = {
                            to: tokenObj.token,
                            
                            notification: {
                                title: title,
                                body: messagetosend,
                                sound: "default",
                                icon: 'icon',
                                click_action: "FCM_PLUGIN_ACTIVITY"
                            },
                            
                            data: {
                                type_of_notification: type,
                                notification_from: from,
                                notification_title: title,
                                notification_body: messagetosend
                            }
                        };
                    }
                    else if(customer.fcm_tokens[i].devicetype == 'ios'){
                        var message = {
                            to: tokenObj.token,
                            
                            notification: {
                                title: title,
                                body: messagetosend,
                                sound: "default",
                                click_action: "FCM_PLUGIN_ACTIVITY"
                            },
                            
                            data: {
                                type_of_notification: type,
                                notification_from: from,
                                notification_title: title,
                                notification_body: messagetosend
                            }
                        };
                    }
                    fcm.send(message, function(err, response){
                        if (err) {
                            console.log(err);
                            try{
                                err = JSON.parse(err);
                                if(err.failure == 1)
                                {
                                    if(JSON.stringify(tokens).indexOf(JSON.stringify(tokenObj)) > - 1)
                                    {
                                        customer.fcm_tokens = tokens = tokens.filter(function(el) {
                                            return el.token !== tokenObj.token;
                                        });
                                        customer.save(function(err,save){
                                            promise.reject("Something went wrong!! ", err)
                                        })

                                    }
                                }
                            }
                            catch(error)
                            {
                                console.log(error);
                            }
                        } else {
                            console.log("Successfully sent with response: ", response);
                            promise.resolve('Sent');
                        }
                    });
                });
            }        })
        .then((done)=>{
        })
        .catch((err)=>{
            return err;
        })
    }
};