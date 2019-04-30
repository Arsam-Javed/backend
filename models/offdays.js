var mongoose = require('mongoose');
var Schema = mongoose.Schema;
offdaysSchema = new Schema({
    offdays: Array
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('offdays', offdaysSchema);