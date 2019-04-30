var mongoose = require('mongoose');
var Schema = mongoose.Schema;
disputesSchema = new Schema({
	dispute_issue: String,
    dispute_reason: String,
    ticket_no: String,
    action_taken: String,
    resolved: Number,
    order_id: Schema.ObjectId
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('disputes', disputesSchema);