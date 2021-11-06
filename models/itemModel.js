const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    name: { type: String },
    imageURL: { type: String },
    descp: { type: String },
    price: { type: Number },
    type: { type: String },
    stock: { type: Number }
}); //, { collection: 'items' }); //collection property is used to find the existing collection

module.exports = mongoose.model("item", itemSchema);