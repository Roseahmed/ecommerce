const customerModel = require("../models/customerModel");
const cartModel = require("../models/cartModel");
const bcrypt = require("bcrypt");
const passport = require("passport");
const { deleteOne, findById, updateOne } = require("../models/customerModel");
const saltRounds = 6;

//register page routes functions
const registerGetReq = (req, res) => {
    res.render("register");
}

const registerPostReq = (req, res) => {
    const { username, useremail, usercontact, userpassword } = req.body;
    //console.log(username, userpassword, useremail);

    //hasing the password for better security
    const hash = bcrypt.hashSync(userpassword, saltRounds);

    const newCustomer = new customerModel({
        name: username,
        contact_no: usercontact,
        password: hash,
        email: useremail
    });
    newCustomer.save()
        .then((result) => {
            console.log("New customer registerd successfully with following details: ");
            console.log(result);
            res.redirect('/user/login');
        })
        .catch((err) => {
            console.log("Singup post method error: ", err);
        })
}

//login page routes functions
const loginGetReq = (req, res) => {
    res.render('login', { alertfailure: req.flash("error") });
}

// mixed method that is redirect and custom callback for passport authenticate function
const loginPostReq = ((req, res) => {

    passport.authenticate("local", {
        failureRedirect: "/user/login",
        failureFlash: true
    })(req, res, async() => {
        //If successfully authenticated this function execute
        try {
            let sessionData = req.session.shoppingCart;
            req.session.shoppingCart = undefined;
            // console.log("Session data: ", sessionData);
            const currentUser = req.user;
            const findUserCart = await cartModel.findById(currentUser._id, "_id");

            //create empty shopping cart if shopping cart is not defined for current user.
            if (!findUserCart) {
                const cart = new cartModel({
                    _id: currentUser._id,
                    name: currentUser.name
                });
                const createCart = await cart.save();
                console.log("Empty shopping cart created for current user: ", createCart);
            }

            //If session data is present then add the session data to current user shoppingCart
            if (sessionData) {
                for (let i = 0; i < sessionData.cartItems.length; i++) {
                    const updateCart = await cartModel.updateOne({
                        _id: currentUser._id
                    }, {
                        $addToSet: { cartItems: sessionData.cartItems[i] }
                    });
                    console.log("Session data updated in current user cart status: ", updateCart);
                }
            }
            let oldUrl = req.flash("oldUrl");
            console.log("OldUrl: ", oldUrl);
            if (oldUrl.length > 0) {
                res.redirect(oldUrl);
                oldUrl = [];
                return;
            }
            res.redirect("/");

        } catch (err) {
            console.log(err);
        }
    });
});

// redirect method of passport authenticate function
// const loginPostReq = (passport.authenticate("local", {
//     successRedirect: "/",
//     failureRedirect: "/user/login",
//     failureFlash: true,
//     successFlash: true
// }));

// custom callback method of passport authenticate function
// const loginPostReq = (req, res, next) => {
//     // console.log("Sessions Data: ", req.session.shoppingCart);
//     const sessionData = req.session.shoppingCart;
//     passport.authenticate("local", (err, user, info) => {
//         if (err) { return next(err) }
//         if (user === false) {
//             req.flash("error", info.message);
//             return res.redirect("/user/login");
//         }
//         req.logIn(user, (error) => {
//             if (error) { return next(error) }
//             console.log('Session Data after login: ', sessionData);
//             return res.redirect("/");
//         });
//     })(req, res, next);
// }

const logout = (req, res) => {
    req.logout();
    res.redirect("/");
}

module.exports = {
    loginGetReq,
    loginPostReq,
    registerGetReq,
    registerPostReq,
    logout
}