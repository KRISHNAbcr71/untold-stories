
const mongoose = require('mongoose')

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        trim: true
    },
    productImage: {
        type: [String],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
})

// Shipping Address Snapshot Schema
const shippingAddressSchema = new mongoose.Schema({
    addressType: {
        type: String,
        enum: ['Home', 'Office', 'Other'],
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    altPhone: {
        type: String,
        trim: true
    },
    fullAddress: {
        type: String,
        required: true,
        trim: true
    },
    landmark: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false })

// Main Order Schema
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: {
        type: [orderItemSchema],
        required: true
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingCharge: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['COD'],
        default: 'COD',
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Confirmed'
    }
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
