const Razorpay = require("razorpay");
const crypto = require("crypto");
const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const bookModel = require("../models/itemModel");
const itemModel = require("../models/itemModel");

//configure razorpay
const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRETS
});

const createOrder = async(req, res) => {
    if (req.isAuthenticated()) {
        try {
            const totalAmount = Number(req.body.amount);
            // console.log(totalAmount);
            currentUser = req.user._id;

            const options = {
                amount: totalAmount * 100,
                currency: "INR",
                receipt: ""
            };
            //create order
            const order = await razorpay.orders.create(options);
            console.log("Order created with details: ", order);

            //Check if this is first order for current user
            const checkOrder = await orderModel.findOne({
                _id: currentUser
            }, '_id');

            //if first order then create order model for current user.
            if (!checkOrder) {
                const newOrderModel = new orderModel({
                    _id: currentUser,
                    name: req.user.name
                });
                const createOrderModel = await newOrderModel.save();
                console.log("Order model created with details: ", createOrderModel);
            }

            //store the orders details
            const storeOrder = await orderModel.updateOne({
                _id: currentUser
            }, {
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
        console.log("Login to buy products");
        req.flash("error", "Login to buy products");
        req.flash("oldUrl", "/cart/");
        res.redirect("/user/login");
    }
}

const verifyOrder = async(req, res) => {
    if (req.isAuthenticated()) {
        try {
            const currentUser = req.user._id;
            const {
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature
            } = req.body;
            // console.log(req.body);

            //find the order id to compare with razorpay_order_id
            const order = await orderModel.findOne({
                _id: currentUser
            }, {
                _id: 0,
                orderDetails: {
                    $elemMatch: {
                        orderId: razorpay_order_id
                    }
                }
            });
            const orderId = order.orderDetails[0].orderId;
            //console.log("Current user orderId: ", orderId);

            //verfiy the order details with the help of crypto
            const hmac = crypto.createHmac('sha256', process.env.KEY_SECRETS);
            hmac.update(orderId + "|" + razorpay_payment_id);
            const generatedSignature = hmac.digest('hex');
            if (generatedSignature === razorpay_signature) {

                //find the current user cart items
                const userCart = await cartModel.findOne({
                    _id: currentUser
                }, {
                    _id: 0,
                    name: 0
                });
                // console.log("Current user cart Items: ", userCart.cartItems);

                //update the order status in database and store purchased items
                const storeItems = await orderModel.updateOne({
                    _id: currentUser
                }, {
                    $set: {
                        'orderDetails.$[orderDetail].paymentId': razorpay_payment_id,
                        'orderDetails.$[orderDetail].status': 'paid',
                        'orderDetails.$[orderDetail].products': userCart.cartItems
                    }
                }, {
                    arrayFilters: [{ 'orderDetail.orderId': orderId }]
                });
                console.log("Purchased products stored status: ", storeItems);

                //delete the user cart items
                const delCartItems = await cartModel.updateOne({
                    _id: currentUser
                }, {
                    $set: {
                        cartItems: []
                    }
                });
                console.log("User cart items delete status: ", delCartItems);

                //update the stock quantity of items
                userCart.cartItems.forEach(async(item) => {
                    const updateStock = await itemModel.updateOne({
                        _id: item._id
                    }, {
                        $inc: { stock: -item.quantity }
                    });
                    console.log("Stock update status: ", updateStock);
                });
                res.json('Payment successfull.');
            } else {
                res.json('Payment not valid.');
            }
        } catch (err) {
            console.log(err);
        }
    }

}

module.exports = {
    createOrder,
    verifyOrder
}