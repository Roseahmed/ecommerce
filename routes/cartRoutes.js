const express = require("express");
const router = express.Router();
const cartControllers = require("../controllers/cartControllers");

router.get("/", cartControllers.cartItems);
router.patch("/:id", cartControllers.addCartItems);
router.put("/:id", cartControllers.updateQuantity);
router.delete("/:id", cartControllers.delCartItems);

module.exports = router;