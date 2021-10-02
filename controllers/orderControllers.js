const Razorpay = require("razorpay");
const crypto = require("crypto");
const hmac = crypto.createHmac('sha256', process.env.KEY_SECRETS);

//configure razorpay
const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRETS
});

const createOrder = (req, res) => {
    console.log(req.body.amount);
    const options = {
        amount: req.body.amount * 100,
        currency: "INR",
        receipt: ""
    };
    // create a order
    razorpay.orders.create(options, (err, order) => {
        if (!err) {
            console.log(order);
            //orderId = order.id;
            res.json(order);
        } else {
            console.log('Something went wrong.');
        }
    });
}

module.exports = {
    createOrder
}