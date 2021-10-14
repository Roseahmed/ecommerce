const customerModel = require("../models/customerModel");
const itemModel = require("../models/itemModel");
const cartModel = require("../models/cartModel");

const fetchAll = async(req, res) => {
    try {
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            // console.log(currentUser.id);
            const userCart = await cartModel.findById(currentUser._id);

            //aggreagate method to find the totalCart amount
            const totalAmount = await cartModel.aggregate([
                { $match: { _id: currentUser._id } },
                {
                    $project: {
                        _id: "$tempId",
                        total: {
                            $sum: {
                                $map: {
                                    input: '$cartItems',
                                    as: 'cart',
                                    in: {
                                        $multiply: ['$$cart.price', '$$cart.quantity']
                                    }
                                }
                            }
                        }
                    }
                }
            ]);
            // console.log("Current user cartItems:", userCart);
            console.log('Total amount: ', totalAmount);
            res.render('cart', { user: currentUser.name, items: userCart, totalAmount: totalAmount });
        } else {
            const sessionShoppingCart = req.session.shoppingCart;
            // console.log("Items in current session: ", sessionShoppingCart);
            res.render('cart', { user: "", items: sessionShoppingCart, totalAmount: [{}] });
        }
    } catch (err) {
        console.log(err);
    }
}

const addCartItems = async(req, res) => {
    try {
        const reqItemId = req.params.id;
        const foundItem = await itemModel.findById(reqItemId, '_id name descp price type ');
        // console.log("foundItem);
        if (req.isAuthenticated()) {

            const currentUser = req.user._id;
            // add the cart items with requested item
            const cardUpdate = await cartModel.updateOne({
                _id: currentUser
            }, {
                $addToSet: {
                    cartItems: foundItem
                }
            });
            console.log("Card updated status: ", cardUpdate);
            res.json(cardUpdate);

        } else {

            //for anonymous users
            console.log("For anonymous users.....");
            const sessionData = req.session.shoppingCart;
            //shopping cart property
            const cartItems = {
                _id: foundItem._id,
                name: foundItem.name,
                imageUrl: foundItem.imageUrl,
                descp: foundItem.descp,
                price: foundItem.price,
                type: foundItem.type,
                quantity: 1
            };
            // first check if the session data is defined or not if not then create the session data
            if (typeof sessionData === "undefined") {
                req.session.shoppingCart = { cartItems: [cartItems] };
                console.log("Shopping cart created with details: ", cartItems);
                return res.json({ msg: true });
            }
            // second if session data is defined then check if requested items is already defined in current session data 
            for (let i = 0; i < sessionData.cartItems.length; i++) {
                if (sessionData.cartItems[i]._id === reqItemId) {
                    console.log("Items already present in shopping cart");
                    return res.json({ msg: false });
                }
            }
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
    if (req.isAuthenticated()) {
        const currentUser = req.user._id;
        cartModel.updateOne({ _id: currentUser }, { $pull: { cartItems: { _id: reqItemId } } })
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
    const reqItemId = req.params.id;
    const reqQuantity = Number(req.body.quantity);
    // console.log("Requested itemId: ", reqItemId);
    // console.log("Quantity: ", reqQuantity);
    try {
        //check the total stock avaiable
        const totalStock = await itemModel.findOne({ _id: reqItemId }, "-_id stock");
        if (reqQuantity > totalStock.stock) {
            console.log("Request quantity unavaiable");
            return res.json({
                msg: "Requested quantity unavailable!!!",
                status: false,
                totalStock: totalStock.stock
            });
        }
        if (req.isAuthenticated()) {
            const currentUser = req.user._id;
            const update = await cartModel.updateOne({
                _id: currentUser,
                "cartItems._id": reqItemId
            }, {
                $set: { 'cartItems.$.quantity': reqQuantity }
            });
            console.log("Quantity update status: ", update);
            if (update.modifiedCount > 0) {
                return res.json({ status: true });
            }
        }

        //for anonymous users
        const cart = req.session.shoppingCart;
        for (let i = 0; i < cart.cartItems.length; i++) {
            if (cart.cartItems[i]._id === reqItemId) {
                req.session.shoppingCart.cartItems[i].quantity = reqQuantity;
                console.log("Quantity of requested item updated in session cart");
                return res.json({ status: true });
            }
        }

    } catch (err) {
        console.log(err);
        res.json(err);
    }
}

module.exports = {
    fetchAll,
    addCartItems,
    updateQuantity,
    delCartItems
}