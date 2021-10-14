const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    orderDetails: [{
        _id: false,
        orderId: { type: String },
        paymentId: { type: String },
        amount: { type: Number },
        createdAt: { type: Date },
        status: { type: String },
        products: [{
            _id: { type: String },
            name: { type: String },
            imageUrl: { type: String },
            descp: { type: String },
            price: { type: String },
            type: { type: String },
            quantity: { type: Number }
        }]
    }]
});

module.exports = mongoose.model("order", orderSchema);