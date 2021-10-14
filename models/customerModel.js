const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String },
    password: { type: String },
    email: { type: String },
    contact_no: { type: Number },
    address: [{
        _id: false,
        city: { type: String },
        state: { type: String },
        pincode: { type: Number }
    }]
});
module.exports = mongoose.model("customer", customerSchema);