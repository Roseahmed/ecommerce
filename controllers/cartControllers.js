const customerModel = require("../models/customerModel");
const itemModel = require("../models/itemModel");
const cartModel = require("../models/cartModel");
const cartAmount = require("../config/mongodbAggregate");

const cartItems = async(req, res) => {
    try {
        // for authenticated user
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            console.log("Shopping cart of:", currentUser.name);

            // find current user cart items
            const userCart = await cartModel.findById(currentUser._id);
            // console.log("Items in shopping cart:", userCart);

            // aggregate function to find the total amount of cart items
            let totalAmount = await cartAmount(currentUser._id);
            totalAmount = totalAmount.map((value) => value.total);
            // console.log('Total amount of items: ', totalAmount);

            res.render('cart', {
                user: currentUser.name,
                items: userCart,
                totalAmount: totalAmount
            });
        } else {
            // for annoymous user
            console.log("Shopping cart of anonymous user...");

            const shoppingCart = req.session.shoppingCart;
            // console.log("Items in shopping cart: ", shoppingCart);

            // find the total amount of cart items
            let total = 0;
            if (shoppingCart) {
                shoppingCart.cartItems.forEach((item) => {
                    total = total + (item.price * item.quantity);
                });
            }
            // console.log("Total amount of items: ", total);

            res.render('cart', {
                user: "",
                items: shoppingCart,
                totalAmount: total
            });
        }
    } catch (err) {
        console.log(err);
    }
}

const addCartItems = async(req, res) => {
    try {
        // requested item id
        const reqItemId = req.params.id;

        // find items details of request item
        const foundItem = await itemModel.findById(reqItemId, '-stock');
        // console.log("Requested item: ", foundItem);

        // shopping cart model property
        const cartItems = {
            _id: foundItem._id,
            name: foundItem.name,
            imageURL: foundItem.imageURL,
            descp: foundItem.descp,
            price: foundItem.price,
            type: foundItem.type,
            quantity: 1,
            totalPrice: foundItem.price
        };

        // for authenticated users
        if (req.isAuthenticated()) {
            const currentUser = req.user;

            // save requested item to current user cart items
            const cardUpdate = await cartModel.updateOne({
                _id: currentUser._id,
                'cartItems._id': {
                    '$ne': foundItem._id
                }
            }, {
                $push: {
                    cartItems: cartItems
                }
            });
            console.log("Cart item update status: ", cardUpdate);

            res.json(cardUpdate);

        } else {

            //for anonymous users
            console.log(" Add cart item for anonymous users.....");

            // if session shopping cart is not defined then create and add requested item
            const sessionData = req.session.shoppingCart;
            if (typeof sessionData === "undefined") {
                req.session.shoppingCart = { cartItems: [cartItems] };
                console.log("Shopping cart created with details: ", cartItems);
                return res.json({ msg: true });
            }

            // if session shopping cart is defined and requested item is present in session shopping cart 
            for (let i = 0; i < sessionData.cartItems.length; i++) {
                if (sessionData.cartItems[i]._id === reqItemId) {
                    console.log("Item already present in shopping cart");
                    return res.json({ msg: false });
                }
            }

            // if session shopping cart is defined and requested item in not present in session shopping cart
            req.session.shoppingCart.cartItems.push(cartItems);
            console.log("Item added in shopping cart and details: ", cartItems);

            res.json({ msg: true });
        }
    } catch (err) {
        console.log(err);
        res.json(err);

    }
}

const delCartItems = (req, res) => {
    const reqItemId = req.params.id;

    // for authenticated users
    if (req.isAuthenticated()) {
        const currentUser = req.user;

        // delete the requested item from shopping cart of user
        cartModel.updateOne({
                _id: currentUser._id
            }, {
                $pull: {
                    cartItems: {
                        _id: reqItemId
                    }
                }
            })
            .then((deleteCount) => {
                console.log('Card item delete status:', deleteCount);
                res.json(deleteCount);
            })
            .catch((err) => {
                console.log(err);
                res.json(err);
            });
    } else {
        // for anonymous users

        // delete the requested item from session shopping cart
        const cart = req.session.shoppingCart;
        for (let i = 0; i < cart.cartItems.length; i++) {
            if (cart.cartItems[i]._id === reqItemId) {
                req.session.shoppingCart.cartItems.splice(i, 1);
                console.log("Requested item deleted from session cart");
                return res.json({ msg: true });
            }
        }
    }
}

const updateQuantity = async(req, res) => {
    try {
        const reqItemId = req.params.id;
        const reqQuantity = Number(req.body.quantity);
        // console.log("Requested itemId: ", reqItemId);
        // console.log("Quantity: ", reqQuantity);

        // find the total stock available of requested item
        const itemDetails = await itemModel.findOne({ _id: reqItemId }, "-_id stock price");

        // if the requested item quantity is greater than the total stock avaiable
        if (reqQuantity > itemDetails.stock) {
            console.log("Request quantity is greater than total stock,Available stock = ", itemDetails);
            return res.json({
                msg: "Requested quantity is greater than total stock,Available stock = ",
                status: false,
                totalStock: itemDetails.stock
            });
        }

        //for authenticated user
        if (req.isAuthenticated()) {
            const currentUser = req.user;

            // update the quantity and total price of requested item in user shopping cart
            const update = await cartModel.updateOne({
                _id: currentUser._id,
                "cartItems._id": reqItemId
            }, {
                $set: {
                    'cartItems.$.quantity': reqQuantity,
                    'cartItems.$.totalPrice': itemDetails.price * reqQuantity
                }
            });
            console.log("Quantity update status: ", update);

            if (update.modifiedCount > 0) {
                return res.json({ status: true });
            }
        }

        // for anonymous users
        // update the requested item quantity and total price in session shopping cart
        const cart = req.session.shoppingCart;
        for (let i = 0; i < cart.cartItems.length; i++) {
            if (cart.cartItems[i]._id === reqItemId) {
                req.session.shoppingCart.cartItems[i].quantity = reqQuantity;
                req.session.shoppingCart.cartItems[i].totalPrice = itemDetails.price * reqQuantity;
                console.log("Qty of requested item updated in session cart");
                return res.json({ status: true });
            }
        }

    } catch (err) {
        console.log(err);
        res.json(err);
    }
}

module.exports = {
    cartItems,
    addCartItems,
    updateQuantity,
    delCartItems
}