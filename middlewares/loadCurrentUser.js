const User = require('../models/User')
const Cart = require('../models/Cart')

const loadCurrentUser = async(req,res,next) =>{
    try {
        res.locals.currentUser = null
        res.locals.cartCount = 0
        if(req.session.user && req.session.user.id){
            res.locals.currentUser = await User.findById(
                req.session.user.id
            ).select('name')
            const cart = await Cart.findOne({
                user:req.session.user.id
            }).select('items')
            if(cart){
                res.locals.cartCount = cart.items.length
            }
        }
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = loadCurrentUser