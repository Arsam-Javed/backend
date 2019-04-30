var mongoose = require('mongoose');
var Schema = mongoose.Schema;
usersSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phone: {
        type: String,
        // unique: true,
        required: true
    },
    password: String,
    originalPassword: String,
    fcm_tokens: { 
        type: Array,
        default: []
    }
},
{ usePushEach: true },
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

usersSchema.methods.setPassword = function (password) {
    this.password = crypto.createHash('sha1').update(password).digest("hex");
};

usersSchema.methods.validPassword = function (password) {
    var hash = crypto.createHash('sha1').update(password).digest("hex");

    console.info(this.password, hash);

    return this.password === hash;
};
usersSchema.methods.generateJwt = function (type, callback) {
    logger.info("Generating Jwt...");
    var randomize = require('randomatic');
    var current_user = this;

    var jwt = require('jsonwebtoken');
    if(type == 'user')
    {
        var token = jwt.sign({
            e: current_user.email,
            u: current_user.username,
            d: current_user._id,
            r: 'user',
            ph: current_user.phone
        }, process.env.JWT_SECRETE);

        callback(token);
    }
    else if(type == 'guest')
    {
        var token = jwt.sign({
            e: current_user.email,
            u: current_user.username,
            d: current_user._id,
            r: 'guest'
        }, process.env.JWT_SECRETE);

        callback(token);
    }

};
module.exports = mongoose.model('users', usersSchema);