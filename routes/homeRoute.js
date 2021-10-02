const express = require("express");
const route = express.Router();
const homeContorllers = require("../controllers/homeControllers")

route.get('/', homeContorllers);

module.exports = route;