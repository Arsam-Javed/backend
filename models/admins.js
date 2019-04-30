var mongoose = require('mongoose');
var Schema = mongoose.Schema;
adminsSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    originalPassword: String,
    dp: String,
    role: String
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

adminsSchema.methods.setPassword = function (password) {
    this.password = crypto.createHash('sha1').update(password).digest("hex");
};

adminsSchema.methods.validPassword = function (password) {
    var hash = crypto.createHash('sha1').update(password).digest("hex");

    console.info(this.password, hash);

    return this.password === hash;
};
adminsSchema.methods.generateJwt = function (proxy, callback) {
    logger.info("Generating Jwt...");
    var randomize = require('randomatic');
    var current_user = this;

    var jwt = require('jsonwebtoken');
    var chat_id = current_user._id+'-'+randomize('0', 9);
    if(current_user.role == 'admin')
    {
        var token = jwt.sign({
                        e: current_user.email,
                        d: current_user._id,
                        r: 'admin',
                        p: current_user.dp,
                        c: chat_id
                    }, process.env.JWT_SECRETE);

        callback(token);
    }

};
module.exports = mongoose.model('admins', adminsSchema);