const bookModel = require("../models/bookModel");
const customerModel = require("../models/customerModel");
const passport = require("passport");

const fetchAll = (req, res) => {
    bookModel.find()
        .then((result) => {
            if (req.isAuthenticated()) {
                return res.render("index", { items: result, user: req.user.name });
            }
            res.render("index", { items: result, user: "" });
        })
        .catch((err) => {
            console.log(err);
        });

    // try {
    //     const book = await bookModel.find();
    //     if (req.isAuthenticated()) {
    //         console.log("Current user data: ", req.user.name)
    //         res.render("index", { items: book, user: req.user.name });
    //         return;
    //     }
    //     res.render("index", { items: book, user: "" });

    // } catch (err) {
    //     console.log(err);
    // }
}

module.exports = fetchAll;