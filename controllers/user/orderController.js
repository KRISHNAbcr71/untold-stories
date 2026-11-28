const mongoose = require('mongoose')

const Order = require('../../models/Order')
const Cart = require('../../models/Cart')
const Address = require('../../models/Address')
const Product = require('../../models/Product')
const Category = require('../../models/Category')

const placeOrder = async (req, res) => {
    let session
    let createdOrderId

    try {
        session = await mongoose.startSession()
        
        await session.withTransaction(async ()=>{
            const userId = req.session.user.id
            const cart = await Cart.findOne({
                user:userId
            })
                .populate('items.product')
                .session(session)

            if (!cart || cart.items.length === 0) {
                const error = new Error('Your cart is empty')
                error.statusCode = 400
                throw error
            }

            const addressId = req.session.selectedCheckoutAddress

            const address = await Address.findOne({
                _id: addressId,
                user: userId
            }).session(session)

            if (!address) {
                const error = new Error('Please select a valid delivery address')
                error.statusCode = 400
                throw error
            }

            for (const item of cart.items) {
                const product = item.product

                if (!product || !product.isListed || product.isDeleted) {
                    const error = new Error('One or more products are no longer available')
                    error.statusCode = 400
                    throw error
                }

                if (product.quantity < item.quantity) {
                    const error = new Error(`Insufficient stock for ${product.productName}`)
                    error.statusCode = 400
                    throw error
                }

                const category = await Category.findById(product.category).session(session)

                if (!category || !category.isListed || category.isDeleted) {
                    const error = new Error(`${product.productName} is no longer available`)
                    error.statusCode = 400
                    throw error
                }
            }

            const orderItems = []
            let subtotal = 0

            for (const item of cart.items) {
                const product = item.product
                const totalPrice = product.price * item.quantity

                orderItems.push({
                    product: product._id,
                    productName: product.productName,
                    author: product.author,
                    productImage: product.productImage,
                    quantity: item.quantity,
                    price: product.price,
                    totalPrice
                })
                subtotal += totalPrice
            }

            for (const item of cart.items) {
                const stockUpdate = await Product.updateOne(
                    {
                        _id: item.product._id,
                        isListed: true,
                        isDeleted: false,
                        quantity: { $gte: item.quantity }
                    },
                    {
                        $inc: {
                            quantity: -item.quantity
                        }
                    },
                    { session }
                )

                if (stockUpdate.matchedCount === 0) {
                    const error = new Error(
                        `${item.product.productName} is no longer available or has insufficient stock`
                    )
                    error.statusCode = 400
                    throw error
                }
            }

            const shippingAddress = {
                addressType: address.addressType,
                name: address.name,
                phone: address.phone,
                altPhone: address.altPhone,
                fullAddress: address.fullAddress,
                landmark: address.landmark,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            }

            const discount = 0
            const finalAmount = subtotal - discount

            const [order] = await Order.create(
                [{
                    user: userId,
                    orderItems,
                    shippingAddress,
                    subtotal,
                    discount,
                    finalAmount,
                    paymentMethod: 'COD',
                    paymentStatus: 'Pending',
                    orderStatus: 'Confirmed'
                }],{ session }
            )

            cart.items = []
            await cart.save({ session })
            createdOrderId = order._id
        })

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderId: createdOrderId
        })

    
    } catch (error) {
        console.error('Order placement error:', error)
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Something went wrong while placing your order'
        })

    } finally {
        if (session) {
            await session.endSession()
        }
    }
}



const loadOrderSuccess = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id
        })

        if (!order) {
            return res.status(404).render('404')
        }

        res.render('order-success', { order })

    } catch (error) {
        console.error('Order success page error:', error)
        res.status(500).render('500')
    }
}


module.exports = {
    placeOrder,
    loadOrderSuccess
}

