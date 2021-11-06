const express = require("express");
const route = express.Router();
const orderControllers = require("../controllers/checkoutControllers");

route.post("/place-order", orderControllers.createOrder);
route.get("/shipping-address", orderControllers.shippingAddress);
route.post("/shipping-address", orderControllers.postShippingAddress);
route.post("/verify-signature", orderControllers.verifyOrder);

module.exports = route;