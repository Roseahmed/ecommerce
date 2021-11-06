const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String },
    password: { type: String },
    email: { type: String },
    contact_no: { type: Number },
    shippingDetails: {
        _id: false,
        buyerName: { type: String },
        contactNo: { type: Number },
        apartment: { type: String },
        email: { type: String },
        city: { type: String },
        pincode: { type: Number },
        state: { type: String }
    }
});
module.exports = mongoose.model("customer", customerSchema);