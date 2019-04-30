var mongoose = require('mongoose')
    ,Schema = mongoose.Schema,
MessagesSchema = new Schema( {
    msg: String,
    from: String,
    to: String,
    conversationID: String,
    date: {type: Date, default: Date()}
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
}), messages = mongoose.model('messages', MessagesSchema);
module.exports = messages;