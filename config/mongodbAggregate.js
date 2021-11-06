const cartModel = require("../models/cartModel");

// aggregate function that returns the tomal amount of shopping card items
async function cartAmount(userId) {
    return cartModel.aggregate([
        { $match: { _id: userId } },
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
}
module.exports = cartAmount;