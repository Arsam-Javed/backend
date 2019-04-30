var mongoose = require('mongoose');
var Schema = mongoose.Schema;
promosSchema = new Schema({
    start_date: Date,
    end_date: Date,
    discount: Number,
    promo_code: {type: String, unique: true, required: true},
    limited: Number,
    num_users: Number,
    valid: Number,
    used_times: Number
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('promos', promosSchema);