module.exports.controller = function (app) {
    var mongoose = require('mongoose');
    var passport = require("passport");
    const promise = require('bluebird');
    // var Venders = mongoose.model('venders');
    var userHelper = require("../helpers/user");
    var promoHelper = require("../helpers/promohelper");
    var Customer = mongoose.model('users');
    var Products = mongoose.model('products');
    var Feedback = mongoose.model('feedbacks');
    var Admin = mongoose.model('admins');
    var fs = require('fs');

    var Conversation = mongoose.model('conversations');
    var Message = mongoose.model('messages');

    app.use(cors());
    var laundream_chat_id = 'laundream_admin_chat';
    var laundream_chat_name = 'Laundry TEAM';
    var laundry_chat_image = process.env.BASE_URL+'uploads/dp/admin.png';
    var storeproductimages = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images/')
        },
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
              if (err) return cb(err)

              cb(null, raw.toString('hex') + path.extname(file.originalname))
            })        }
    })
    var uploadproductimages = multer({ storage: storeproductimages })
    var type = uploadproductimages.single('file');

    var storeicons = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/icons/')
        },
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
              if (err) return cb(err)

              cb(null, raw.toString('hex') + path.extname(file.originalname))
            })
        }
    })
    var uploadstoreicons = multer({ storage: storeicons })
    var type = uploadstoreicons.single('file');

    app.post("/adminactions/getrevenuestats/", function (req, res) {
      var end = new Date();
      var start = new Date(end.getFullYear(), end.getMonth(), 1);
      var data = {};
        return Orders.find({ $and: [{telenor_payment :{$ne: false}},{delivered_time : {$gt : start}}, {delivered_time : {$lt : end}}, {status: 'Delivered'}] },{}, { sort: { 'created_at' : -1 }})
        .then((orders)=>{
          data.orders_this_month = orders.length;
          var total = 0;
          for(var i=0;orders[i];i++)
          {
              total += orders[i].revenue*1;
          }
          data.total_this_month = total;
          var start = new Date(end.getTime() - (7 * 24 * 60 * 60 * 1000));
            return Orders.find({ $and: [{telenor_payment :{$ne: false}},{delivered_time : {$gt : start}}, {delivered_time : {$lt : end}}, {status: 'Delivered'}] },{}, { sort: { 'created_at' : -1 }})
            .then((orders)=>{
              data.orders_this_week = orders.length;
              var total = 0;
              for(var i=0;orders[i];i++)
              {
                  total += orders[i].revenue*1;
              }
              data.total_this_week = total;
              var start = new Date(end.getTime() - (1 * 24 * 60 * 60 * 1000));
                return Orders.find({ $and: [{telenor_payment :{$ne: false}},{delivered_time : {$gt : start}}, {delivered_time : {$lt : end}}, {status: 'Delivered'}] },{}, { sort: { 'created_at' : -1 }})
                .then((orders)=>{
                    data.orders_today = orders.length;
                    var total = 0;
                    for(var i=0;orders[i];i++)
                    {
                        total += orders[i].revenue*1;
                    }
                    data.total_today = total;
                    console.log(data);
                    return res.json({
                        success: true,
                        stats: data
                    });
                })
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
    app.post("/adminactions/getordersforfinance/", function (req, res) {
        return Orders.find({ $and: [{telenor_payment :{$ne: false}},{delivered_time : {$gt : req.body.start}}, {delivered_time : {$lt : req.body.end}}, {status: 'Delivered'}] },{}, { sort: { 'created_at' : -1 }})
        .then((orders)=>{
          console.log(orders);
              res.json({
                success: true,
                orders: orders
              });
       })
       .catch((err)=>{
          console.log(err);
          res.json({
            success: false,
            message: err
          })
       })
    });
    app.post("/adminactions/offdays/", function (req, res) {     
        return OffDays.findOne({})
        .then((offdays)=>{
          if(offdays)
          {
            offdays.offdays = req.body.offdays;
            return offdays.save()
          }
          else
          {
            var offdays = new OffDays();
            offdays.offdays = req.body.offdays;
            return offdays.save()
          }
        })
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
    app.get('/adminactions/getconversations/', function (req, res) {
        console.log(type);
        var adminRoles = ["_s_a", "_s_m"]
        if(adminRoles.indexOf(req.token_decoded.r) > -1)
        {
            Conversation.find({$and: [ {$or: [
            { 'from' : laundream_chat_id },
            { 'to': laundream_chat_id }
              ]}]}).sort('-updated_at').exec( function (err, conversations) {
                console.log(conversations);
                    res.json({
                        success: true,
                        conversations: conversations
                    });
            });
        }
    });
    app.get('/adminactions/getmessages/', function (req, res) {
        var conversationId = req.query.conid;
        console.log(conversationId);
        return Conversation.findOne({_id: conversationId})
        .then((conversation)=>{
            Message.find({conversationID:conversationId}, function (err, messages) {
                console.log(messages);
                    res.json({
                        success: true,
                        messages: messages,
                        conversation: conversation
                    });
            });
        })
    });
    app.post("/adminactions/resolveorderbycontinue/", function (req, res) {     
      var sol = req.body.sol;
         return Disputes.findOne({_id: req.body.dispute_id, resolved: 0})
        .then((dispute)=>{
          return Orders.findOne({_id: dispute.order_id})
          .then((order)=>{
              order.status = 'Pending Pickup';
              return order.save()
              .then((ordersaved)=>{
                dispute.resolved = 1;
                dispute.action_taken = req.body.resolution;
                return dispute.save()
                  .then((disputeupdated)=>{
                      res.json({
                        success: true,
                        message: 'Successfully resolved'
                      })
                  })
              })
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
    app.get("/adminactions/getdispute/", function (req, res) {     
         return Disputes.findOne({_id: req.query.did})
        .then((dispute)=>{
          res.json({
            success: true,
            dispute: dispute
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
    app.get("/adminactions/getdisputes/", function (req, res) {     
         return Disputes.find({resolved: { $ne : 1}})
        .then((disputes)=>{
          res.json({
            success: true,
            disputes: disputes
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
    app.get("/adminactions/getnotifications/", function (req, res) {     
         return Notifications.find({seen: 0})
        .then((notifications)=>{
          res.json({
            success: true,
            notifications: notifications
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
    app.get("/adminactions/deactivatecategory/", function (req, res) {
        return Categories.findOne({_id: req.query.cid})
        .then((category)=>{
          category.active = 0;
          return category.save()
          .then((categoryinactive)=>{
              res.json({
                success: true,
                message: 'Successfully updated',
                category: categoryinactive
              });
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
    app.get("/adminactions/activatecategory/", function (req, res) {
        return Categories.findOne({_id: req.query.cid})
        .then((category)=>{
          category.active = 1;
          return category.save()
          .then((categoryactive)=>{
              res.json({
                success: true,
                message: 'Successfully updated',
                category: categoryactive
              });
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
};