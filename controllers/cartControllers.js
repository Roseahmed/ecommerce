const customerModel = require("../models/customerModel");
const itemModel = require("../models/itemModel");
const cartModel = require("../models/cartModel");

const fetchAll = async(req, res) => {
    try {
        // for authenticated user
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            const userCart = await cartModel.findById(currentUser._id);

            //aggreagate method to find the total cart items amount
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
            console.log("Shopping cart of authenticated user");
            // console.log("Current user cartItems:", userCart);
            // console.log('Total amount: ', totalAmount);
            res.render('cart', { user: currentUser.name, items: userCart, totalAmount: totalAmount });
        } else {
            // for annoymous user
            const shoppingCart = req.session.shoppingCart;
            let total = 0;
            //find the total cart items amount
            if (shoppingCart) {
                shoppingCart.cartItems.forEach((item) => {
                    total = total + (item.price * item.quantity);
                });
            }
            console.log("Anonymous user shopping cart...");
            // console.log("Items in shopping cart: ", shoppingCart);
            // console.log("Total amount of items: ", total);
            res.render('cart', { user: "", items: shoppingCart, totalAmount: [{ total }] });
        }
    } catch (err) {
        console.log(err);
    }
}

const addCartItems = async(req, res) => {
    try {
        const reqItemId = req.params.id;
        const foundItem = await itemModel.findById(reqItemId, '-stock');
        // for authenticated users
        if (req.isAuthenticated()) {

            const currentUser = req.user._id;
            // add requested item to current user cartModel
            const cardUpdate = await cartModel.updateOne({
                _id: currentUser,
                'cartItems._id': {
                    '$ne': foundItem._id
                }
            }, {
                $push: {
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
            // first check if the session data is defined or not if not then create the session data and add the item to session data
            if (typeof sessionData === "undefined") {
                req.session.shoppingCart = { cartItems: [cartItems] };
                console.log("Shopping cart created with details: ", cartItems);
                return res.json({ msg: true });
            }
            // second if session data is defined then check if requested item is already present in current session data 
            for (let i = 0; i < sessionData.cartItems.length; i++) {
                if (sessionData.cartItems[i]._id === reqItemId) {
                    console.log("Items already present in shopping cart");
                    return res.json({ msg: false });
                }
            }
            //add requested item to session data
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
        //check if the requested item quantity in less or equal to the total stock avaiable
        const totalStock = await itemModel.findOne({ _id: reqItemId }, "-_id stock");
        if (reqQuantity > totalStock.stock) {
            console.log("Request quantity is greater than total stock,Available stock = ", totalStock);
            return res.json({
                msg: "Requested quantity is greater than total stock,Available stock = ",
                status: false,
                totalStock: totalStock.stock
            });
        }
        //for authenticated user
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            const update = await cartModel.updateOne({
                _id: currentUser._id,
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