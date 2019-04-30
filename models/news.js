var mongoose = require('mongoose');
var Schema = mongoose.Schema;
newsSchema = new Schema({
    news: String
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('news', newsSchema);