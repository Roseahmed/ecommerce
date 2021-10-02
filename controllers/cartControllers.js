const customerModel = require("../models/customerModel");
const bookModel = require("../models/bookModel");
const cartModel = require("../models/cartModel");

const fetchAll = async(req, res) => {
    try {
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            console.log(currentUser.id);
            const userCart = await cartModel.findById(currentUser.id);

            //aggreagate method to find the totalCart amount
            const totalAmount = await cartModel.aggregate([
                { $match: { _id: currentUser.id } },
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
            console.log("Current user cartItems:", userCart);
            console.log('Total amount: ', totalAmount);
            res.render('cart', { user: currentUser.name, items: userCart, totalAmount: totalAmount });
        } else {
            const sessionShoppingCart = req.session.shoppingCart;
            console.log("Items in current session: ", sessionShoppingCart);
            res.render('cart', { user: "", items: sessionShoppingCart, totalAmount: [{}] });
        }
    } catch (err) {
        console.log(err);
    }
}

const addCartItems = async(req, res) => {
    const bookId = req.params.id;
    try {
        const book = await bookModel.findById(bookId, "_id name descp price");
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            const cardUpdate = await cartModel.updateOne({ _id: currentUser._id }, {
                $addToSet: { cartItems: book }
            });
            console.log("Card updated status: ", cardUpdate);
            res.json(cardUpdate);

        } else {

            //for anonymous users
            console.log("For anonymous users.....");
            const sessionData = req.session.shoppingCart;
            //shopping cart property
            const cartItems = {
                _id: book._id,
                name: book.name,
                imageUrl: book.imageUrl,
                descp: book.descp,
                price: book.price,
                quantity: 1,
            };
            // first check if the session data is defined or not if not then create the session data
            if (typeof sessionData === "undefined") {
                req.session.shoppingCart = { cartItems: [cartItems] };
                console.log("Shopping cart created with details: ", cartItems);
                return res.json({ msg: true });
            }
            // second if session data is defined then check if requested items is already defined in current session data 
            for (let i = 0; i < sessionData.cartItems.length; i++) {
                if (sessionData.cartItems[i]._id === bookId) {
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
    const bookId = req.params.id;
    if (req.isAuthenticated()) {
        const currentUser = req.session.passport.user;
        cartModel.updateOne({ _id: currentUser }, { $pull: { cartItems: { _id: bookId } } })
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
            if (cart.cartItems[i]._id === bookId) {
                req.session.shoppingCart.cartItems.splice(i, 1);
                return res.json({ msg: true });
            }
        }
    }
}

const updateQuantity = (req, res) => {
    const bookId = req.params.id;
    console.log("update quantity bookId: ", bookId);
}

module.exports = {
    fetchAll,
    addCartItems,
    updateQuantity,
    delCartItems
}