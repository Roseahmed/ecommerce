const express = require("express");
const route = express.Router();
const orderControllers = require("../controllers/orderControllers");

route.post('/', orderControllers.createOrder);
route.post('/verify', orderControllers.verifyOrder);

module.exports = route;