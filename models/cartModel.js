const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    cartItems: [{
        _id: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String },
        imageURL: { type: String },
        descp: { type: String },
        price: { type: Number },
        type: { type: String },
        quantity: { type: Number },
        totalPrice: { type: Number }
    }]
});

module.exports = mongoose.model("cart", cartSchema);