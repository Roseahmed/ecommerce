const Razorpay = require("razorpay");
const crypto = require("crypto");
const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const itemModel = require("../models/itemModel");
const customerModel = require("../models/customerModel");
const cartAmount = require("../config/mongodbAggregate");

//configure razorpay
const razorpay = new Razorpay({
  key_id: process.env.KEY_ID || "keyId",
  key_secret: process.env.KEY_SECRETS || "secretKey",
});

const shippingAddress = async (req, res) => {
  if (req.isAuthenticated()) {
    const currentUser = req.user;

    customerModel
      .findOne(
        {
          _id: currentUser._id,
        },
        "-_id name email contact_no"
      )
      .then((result) => {
        // console.log(result);
        res.render("shippingAddress", { details: result });
      })
      .catch((err) => {
        console.log(err);
      });
    return;
  }

  req.flash("error", "Login to Buy Products");
  req.flash("oldUrl", "/cart");
  res.redirect("/user/login");
};

const postShippingAddress = async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const currentUser = req.user;

      // console.log("Shipping Details: ", req.body);
      const shippingDetails = {
        buyerName: req.body.name,
        contactNo: req.body.mobileNo,
        apartment: req.body.address,
        email: req.body.email,
        city: req.body.city,
        pincode: req.body.pincode,
        state: req.body.state,
      };

      // save the shipping address
      const saveAddress = await customerModel.updateOne(
        {
          _id: currentUser._id,
        },
        {
          shippingDetails: shippingDetails,
        }
      );
      console.log("Customer shipping address saved: ", saveAddress);

      // find user shipping details
      const cusDetails = await customerModel.findOne(
        {
          _id: currentUser._id,
        },
        "-_id shippingDetails"
      );
      // console.log("Customer shipping details: ", cusDetails);

      // find user cart items
      const cartItems = await cartModel.findOne(
        {
          _id: currentUser._id,
        },
        "-_id -name"
      );

      // aggregate function to find the total cart items amount
      let totalAmount = await cartAmount(currentUser._id);
      totalAmount = totalAmount.map((value) => value.total);
      // console.log("Total Amount: ", totalAmount);

      res.render("placeOrder", {
        details: cusDetails,
        items: cartItems,
        totalAmount: totalAmount,
      });
    } catch (err) {
      console.log(err);
    }
    return;
  }
  res.send("Unauthorised access denied.");
};

const createOrder = async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      currentUser = req.user;

      // aggregate function to find the total cart items amount
      let totalAmount = await cartAmount(currentUser._id);
      totalAmount = totalAmount.map((value) => value.total);
      // console.log(totalAmount);

      // create razorpay order
      const options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "",
      };
      const order = await razorpay.orders.create(options);
      console.log("Order created with details: ", order);

      // check if this is first order for user
      const checkOrder = await orderModel.findOne(
        {
          _id: currentUser,
        },
        "_id"
      );

      // if first order then create order model for user
      if (!checkOrder) {
        const newOrderModel = new orderModel({
          _id: currentUser,
          name: req.user.name,
        });
        const createOrderModel = await newOrderModel.save();
        console.log("Order model created with details: ", createOrderModel);
      }

      // store the order details
      const storeOrder = await orderModel.updateOne(
        {
          _id: currentUser,
        },
        {
          $push: {
            orderDetails: {
              orderId: order.id,
              amount: order.amount,
              createdAt: new Date(order.created_at * 1000), //convert unix_timestamp to ISO date format.
              status: order.status,
            },
          },
        }
      );
      console.log("Order details stored in DB: ", storeOrder);

      // customer details
      const details = await customerModel.findOne(
        {
          _id: currentUser._id,
        },
        "-_id name email contact_no"
      );

      res.json({ order, details });
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log("Login to buy products");
    req.flash("error", "Login to buy products");
    req.flash("oldUrl", "/cart/");
    res.redirect("/user/login");
  }
};

const verifyOrder = async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const currentUser = req.user;

      // this data is send by razorpay for payment verification
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;
      // console.log(req.body);

      // find the order id to compare with razorpayOrderId
      const order = await orderModel.findOne(
        {
          _id: currentUser._id,
        },
        {
          _id: 0,
          orderDetails: {
            $elemMatch: {
              orderId: razorpay_order_id,
            },
          },
        }
      );
      const orderId = order.orderDetails[0].orderId;
      // console.log("Current orderId: ", orderId);

      // verfiy the order details with the help of crypto
      const hmac = crypto.createHmac("sha256", process.env.KEY_SECRETS);
      hmac.update(orderId + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature === razorpay_signature) {
        // find the shipping address
        const shippingAddress = await customerModel.findOne(
          {
            _id: currentUser._id,
          },
          "-_id shippingDetails"
        );
        // console.log("Current user shipping address: ", shippingAddress);

        //find the shopping cart items
        const userCart = await cartModel.findOne(
          {
            _id: currentUser._id,
          },
          "-_id -name"
        );
        // console.log("Current user cart Items: ", userCart.cartItems);

        // store the purchased item and shipping address and update the order status
        const storeItems = await orderModel.updateOne(
          {
            _id: currentUser._id,
          },
          {
            $set: {
              "orderDetails.$[orderDetail].shippingDetails":
                shippingAddress.shippingDetails,
              "orderDetails.$[orderDetail].paymentId": razorpay_payment_id,
              "orderDetails.$[orderDetail].status": "paid",
              "orderDetails.$[orderDetail].products": userCart.cartItems,
            },
          },
          {
            arrayFilters: [{ "orderDetail.orderId": orderId }],
          }
        );
        console.log("Order verified and store details status: ", storeItems);

        // delete the user cart items
        const delCartItems = await cartModel.updateOne(
          {
            _id: currentUser._id,
          },
          {
            $set: {
              cartItems: [],
            },
          }
        );
        console.log("Shopping cart items delete status: ", delCartItems);

        // update the stock quantity of items
        userCart.cartItems.forEach(async (item) => {
          const updateStock = await itemModel.updateOne(
            {
              _id: item._id,
            },
            {
              $inc: { stock: -item.quantity },
            }
          );
          console.log("Purchased items stock update status: ", updateStock);
        });
        res.json("Payment successfull.");
      } else {
        res.json("Payment not valid.");
      }
    } catch (err) {
      console.log(err);
    }
  }
};

module.exports = {
  createOrder,
  verifyOrder,
  shippingAddress,
  postShippingAddress,
};
