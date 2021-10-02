const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    contact_no: Number,
    OrderDetails: [{
        order_id: String,
        payment_id: String,
        status: Boolean,
        amount: Number,
        orderedItems: [{
            _id: String,
            name: String,
            price: String,
            quantity: Number
        }]
    }]
});
module.exports = mongoose.model('customer', customerSchema);