const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    _id: String,
    name: String,
    cartItems: [{
        _id: String,
        name: String,
        imageUrl: String,
        descp: String,
        price: Number,
        quantity: { type: Number, default: 1 }
    }]
});

module.exports = mongoose.model("cart", cartSchema);