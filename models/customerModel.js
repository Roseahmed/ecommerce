const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    contact_no: Number,
    orderDetails: [{
        _id: false,
        orderId: String,
        payment_id: String,
        amount: Number,
        createdAt: Date,
        status: String,
        orderedItems: [{
            _id: false,
            id: String,
            name: String,
            price: String,
            quantity: Number
        }]
    }]
});
module.exports = mongoose.model('customer', customerSchema);