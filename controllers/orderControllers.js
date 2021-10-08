const Razorpay = require("razorpay");
const crypto = require("crypto");
const hmac = crypto.createHmac('sha256', process.env.KEY_SECRETS);
const customerModel = require("../models/customerModel");
const bookModel = require("../models/bookModel");

//configure razorpay
const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRETS
});

const createOrder = async(req, res) => {
    if (req.isAuthenticated()) {
        try {
            // const { amount, cartItems } = req.body;
            // console.log(amount, cartItems);
            const totalAmount = Number(req.body.amount);
            // console.log(totalAmount);
            const options = {
                amount: totalAmount * 100,
                currency: "INR",
                receipt: ""
            };
            const order = await razorpay.orders.create(options);
            console.log("Order created with details: ", order);
            currentUser = req.user._id;
            const storeOrder = await customerModel.updateOne({ _id: currentUser }, {
                $push: {
                    orderDetails: {
                        orderId: order.id,
                        amount: order.amount,
                        createdAt: new Date(order.created_at * 1000), //convert unix_timestamp to ISO date format.
                        status: order.status
                    }
                }
            });
            console.log("Order details stored in DB: ", storeOrder);
            res.render("checkout", { order: order });

        } catch (err) {
            console.log(err);
        }
    } else {
        console.log("Anonymous user.");
        res.redirect("/users/login");
    }
}

const verifyOrder = async(req, res) => {
    if (req.isAuthenticated()) {
        try {
            console.log("Payment verification data:", req.body);
            // const { paymentId, orderId, signature } = req.body;
            // console.log(paymentId, orderId, signature);
            // const orderId = await customerModel.findOne({
            //     _id: req.user._id,
            //     // 'orderDetials.orderId': req.body.razorpay_order_id
            // }, {
            //     _id: 0,
            //     orderDetails: {
            //         $elemMatch: {
            //             orderId: req.body.razorpay_order_id
            //         }
            //     }
            // });

            const orderId = await customerModel.findOne({
                _id: req.user._id,
                orderDetails: {
                    $elemMatch: {
                        orderId: req.body.razorpay_order_id
                    }
                }
            }, {
                'orderDetails.orderId': req.body.razorpay_order_id
            })
            console.log(orderId);
            // hmac.update(orderId + "|" + req.body.razorpay_payment_id);
            // let generatedSignature = hmac.digest('hex');
            // if (generatedSignature === req.body.razorpay_signature) {
            //     res.send('Payment successfull.');
            // } else {
            //     res.send('Payment not valid.');
            // }
        } catch (err) {
            console.log(err);
        }
    }

}

module.exports = {
    createOrder,
    verifyOrder
}