const User = require('../../models/User')
const Address = require('../../models/Address')
const Cart = require('../../models/Cart')



const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user.id

        const user = await User.findById(userId)

        if (!user) {
            return res.redirect('/login')
        }

        const addresses = await Address.find({
            user: userId
        }).sort({ createdAt: 1 })

        const cart = await Cart.findOne({
            user: userId
        }).populate('items.product')

        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart')
        }

        let selectedAddressId = req.session.selectedCheckoutAddress

        let selectedAddress = addresses.find(address =>
            address._id.toString() === selectedAddressId
        )

        if (!selectedAddress) {
            selectedAddress = addresses.find(address => address.isDefault)
            selectedAddressId = selectedAddress
                ? selectedAddress._id.toString()
                : null
            req.session.selectedCheckoutAddress = selectedAddressId
        }

        return res.render('checkout', {
            user,
            addresses,
            cart,
            selectedAddressId
        })

    } catch (error) {
        console.error('Checkout page loading error:', error)
        return res.status(500).render('500')
    }
}




const selectCheckoutAddress = async (req, res) => {
    try {
        const userId = req.session.user.id
        const addressId = req.params.id

        // Verify that this address belongs to the logged-in user
        const address = await Address.findOne({
            _id: addressId,
            user: userId
        })

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            })
        }

        req.session.selectedCheckoutAddress = address._id.toString()

        return res.status(200).json({
            success: true
        })

    } catch (error) {
        console.error('Checkout address selection error:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        })
    }
}


module.exports = {
    loadCheckout,
    selectCheckoutAddress
}