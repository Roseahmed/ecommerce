const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    name: String,
    imageUrl: String,
    descp: String,
    price: Number,
    stock: Number
}, { collection: 'books' }); //collection property is used to find the existing collection

module.exports = mongoose.model("book", bookSchema);