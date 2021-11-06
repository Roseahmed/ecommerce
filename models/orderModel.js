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
        shippingDetails: {
            _id: false,
            buyerName: { type: String },
            contactNo: { type: Number },
            apartment: { type: String },
            email: { type: String },
            city: { type: String },
            pincode: { type: Number },
            state: { type: String }
        },
        products: [{
            _id: { type: String },
            name: { type: String },
            imageURL: { type: String },
            descp: { type: String },
            price: { type: Number },
            type: { type: String },
            quantity: { type: Number },
            totalPrice: { type: Number }
        }],

    }]
});

module.exports = mongoose.model("order", orderSchema);