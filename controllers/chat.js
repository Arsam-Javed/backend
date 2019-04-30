    module.exports.controller = function (server) {
    var mongoose = require('mongoose');
    var async = require('async');
    const promise = require('bluebird');
    var ioredis = require('socket.io-redis');
    var jwt = require('jsonwebtoken');
    var userHelper = require("../helpers/user");
    var promoHelper = require("../helpers/promohelper");
    var Customer = mongoose.model('users');
    var Products = mongoose.model('products');
    var Feedback = mongoose.model('feedbacks');
    var Admin = mongoose.model('admins');
    var Orders = mongoose.model('orders');
    var Riders = mongoose.model('riders');
    var Categories = mongoose.model('categories');
    var socketioJwt = require('socketio-jwt');
    var redis = require('redis'); 
    var fcmHelper = require("../helpers/fcm_helper");
    var socketIO = require('socket.io');
    var Conversation = mongoose.model('conversations');
    var News = mongoose.model('news'); 
    var Message = mongoose.model('messages');

    var options = {
            pingTimeout: 60000,
            pingInterval: 20000,
            transports: ['websocket'],
            allowUpgrades: false
        };

    io = socketIO(server, options);

    ioredis.prefix = 'subbit';
    redisApapter = ioredis({host: process.env.REDIS_HOST, port: process.env.REDIS_PORT});
    io.adapter(redisApapter);

    redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

    var Promise = require("bluebird");
    Promise.promisifyAll(redis.RedisClient.prototype);
    Promise.promisifyAll(redis.Multi.prototype);

    
    var usernames = {};
    var rooms = [];
    var users={};
    var keys={};
    // var subbit_chat = '5a79725a5cb85c2f5fda7602';
    var laundream_chat_id = 'laundream_admin_chat';
    var laundream_chat_name = 'Laundry TEAM';
    var laundry_chat_image = process.env.BASE_URL+'uploads/dp/admin.png';

io.sockets.on('connection', socketioJwt.authorize({
        secret: process.env.JWT_SECRETE,
        timeout: 15000 // 15 seconds to send the authentication message 
    }));
io.sockets.on('connect', function () {
        logger.info('new socket connected');
    });
io.sockets.on('authenticated', (socket) => {
    console.log(socket.decoded_token);
    if(socket.decoded_token.r == 'rider')
    {
        redisClient.hsetAsync('riders', socket.decoded_token.d, socket.id).then(function (socketSet) {
        });
    }
    else if(socket.decoded_token.r == 'admin')
    {
        redisClient.hsetAsync('laundry-admins', socket.decoded_token.c, socket.id).then(function (socketSet) {
            });
    }
    socket.on('sendnotification', function (data) {
        var news = new News();
        news.news = data.message;
        news.save(function(err,saved){
            Customer.find({}, function(err, customers){
                if(err)
                {
                    console.log("Erro");
                    console.log(err);
                    return res.json({
                        success: false,
                        message: err
                    });
                }

                async.forEach(customers, function(user, callback) {
                         return fcmHelper.send_notification_to_client(user._id, 'Laundeam Notification', data.message,'news', laundream_chat_id)
                        .then((done)=>{
                            console.log(done);
                            callback()
                        });
                });
            });
        })
    });

    socket.on('orderplaced', function (data) {
            redisClient.hgetallAsync('laundry-admins').then(function (socketSet) {
                try{
                for (let [key, value] of Object.entries(socketSet)) {
                            console.log(key, value);
                            io.sockets.in(value).emit('orderupdate', JSON.stringify(data));
                        }
                    }
            catch(err){
                console.log(err);
            }
            });
            redisClient.hgetallAsync('riders').then(function (socketSets) {
                try{
                for (let [key, value] of Object.entries(socketSets)) {
                            console.log(key, value);
                            io.sockets.in(value).emit('orderupdate', JSON.stringify(data));
                        }
                    }
            catch(err){
                console.log(err);
            }
            });
    });

    socket.on('sendmessagetoclient', function (data) {
        console.log('send message from admin');
        if(socket.decoded_token.r == 'admin')
        {
            Customer.findOne({_id: data.to}, function(err, user){
                Conversation.findOne({$and:[{ $or: [{from: laundream_chat_id, to: data.to},{to: laundream_chat_id, from: data.to}]}]}, function(err, conversation) {
                    if(conversation)
                    {
                        conversation.lastmessage = data.message;
                        conversation.lastmessagefrom = laundream_chat_id;
                        conversation.save(function(err, conversation){
                            if(err)
                            {
                            }
                            var message = new Message();
                            message.msg = data.message;
                            message.from = laundream_chat_id;
                            message.to = user._id;
                            message.conversationID = conversation._id;
                            message.save(function(err, message){
                            if(err)
                            {
                            }
                            else
                            {   
                                    redisClient.hgetAsync('users', message.to).then(function (socket) {
                                        console.log('done');
                                        io.sockets.in(socket).emit('updatechat', JSON.stringify(message));
                                    });
                                    redisClient.hgetallAsync('laundry-admins').then(function (socketSet) {
                                        try{
                                            for (let [key, value] of Object.entries(socketSet)) {
                                                        console.log(key, value);
                                                        io.sockets.in(value).emit('updatechat', JSON.stringify(message));
                                                        io.sockets.in(value).emit('updateconversation', JSON.stringify(conversation));
                                                    }
                                                }
                                        catch(err){
                                            console.log(err);
                                        }
                                    });
                            }
                        })
                        });
                    }
                })
            }); 
        }
    });

    socket.on('disconnect', function () {
        console.log("disconnected :", socket.decoded_token.d);
        if(socket.decoded_token.r == 'rider')
        {
            redisClient.hdelAsync('riders', socket.decoded_token.d).then(function (deleted) {
            });
        }
        else if(socket.decoded_token.r == 'user')
        {
            redisClient.hdelAsync('users', socket.decoded_token.d).then(function (socketId) {
                socket.leave(socketId);
            });
            
        }
        else if(socket.decoded_token.r == 'admin')
        {
            redisClient.hdelAsync('laundry-admins',socket.decoded_token.c).then(function (socketId) {
            });
        }
    });
});
    
};