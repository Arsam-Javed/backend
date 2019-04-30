var mongoose = require('mongoose');
var Schema = mongoose.Schema;
locationsSchema = new Schema({
	location: Schema.Types.Mixed,
    customer_id: Schema.Types.ObjectId
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('locations', locationsSchema);