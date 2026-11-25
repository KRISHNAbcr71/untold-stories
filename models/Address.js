const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('Address', addressSchema)