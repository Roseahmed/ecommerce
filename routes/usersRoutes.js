const express = require("express");
const router = express.Router();
const usersControllers = require("../controllers/usersControllers");

router.get("/login", usersControllers.loginGetReq);
router.post("/login", usersControllers.loginPostReq);
router.get("/register", usersControllers.registerGetReq);
router.post("/register", usersControllers.registerPostReq);
router.get("/logout", usersControllers.logout);

module.exports = router;