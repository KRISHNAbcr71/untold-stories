const User = require('../../models/User')
const Address = require('../../models/Address')

const loadAddress = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id)

        if (!user) {
            return res.redirect('/login')
        }

        const addresses = await Address.find({
            user: user._id
        }).sort({ createdAt: 1 })

        return res.render('address', {
            user,
            addresses
        })

    } catch (error) {
        console.error('Address page loading error:', error)
        return res.status(500).render('500')
    }
}



const loadAddAddress = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id)

        if (!user) {
            return res.redirect('/login')
        }

        return res.render('add-address', {
            user
        })

    } catch (error) {
        console.error('Add address page loading error:', error)
        return res.status(500).render('500')
    }
}





const saveAddress = async (req, res) => {
    try {
        const userId = req.session.user.id

        const {
            addressType,
            name,
            phone,
            altPhone,
            fullAddress,
            landmark,
            city,
            state,
            pincode
        } = req.body

        const errors = {}

        const trimmedName = name?.trim() || ''
        const trimmedPhone = phone?.trim() || ''
        const trimmedAltPhone = altPhone?.trim() || ''
        const trimmedFullAddress = fullAddress?.trim() || ''
        const trimmedLandmark = landmark?.trim() || ''
        const trimmedCity = city?.trim() || ''
        const trimmedState = state?.trim() || ''
        const trimmedPincode = pincode?.trim() || ''

        if (!['Home', 'Office', 'Other'].includes(addressType)) {
            errors.addressType = 'Please select a valid address type.'
        }

        if (trimmedName.length < 2 || trimmedName.length > 50) {
            errors.name = 'Name must be between 2 and 50 characters.'
        } else if (!/^[A-Za-z ]+$/.test(trimmedName)) {
            errors.name = 'Name can contain only letters and spaces.'
        }

        if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
            errors.phone = 'Please enter a valid 10-digit mobile number.'
        }

        if (trimmedAltPhone) {
            if (!/^[6-9]\d{9}$/.test(trimmedAltPhone)) {
                errors.altPhone = 'Please enter a valid 10-digit alternate mobile number.'
            } else if (trimmedAltPhone === trimmedPhone) {
                errors.altPhone = 'Alternate phone must be different from primary phone.'
            }
        }

        if (trimmedFullAddress.length < 5 || trimmedFullAddress.length > 200) {
            errors.fullAddress = 'Address must be between 5 and 200 characters.'
        }

        if (trimmedLandmark.length > 100) {
            errors.landmark = 'Landmark cannot exceed 100 characters.'
        }

        if (trimmedCity.length < 2 || trimmedCity.length > 50) {
            errors.city = 'City must be between 2 and 50 characters.'
        } else if (!/^[A-Za-z ]+$/.test(trimmedCity)) {
            errors.city = 'City can contain only letters and spaces.'
        }

        if (trimmedState.length < 2 || trimmedState.length > 50) {
            errors.state = 'State must be between 2 and 50 characters.'
        } else if (!/^[A-Za-z ]+$/.test(trimmedState)) {
            errors.state = 'State can contain only letters and spaces.'
        }

        if (!/^\d{6}$/.test(trimmedPincode)) {
            errors.pincode = 'Pincode must be exactly 6 digits.'
        }


        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                errors
            })
        }

        const addressCount = await Address.countDocuments({
            user: userId
        })

        const newAddress = new Address({
            user: userId,
            addressType,
            name: trimmedName,
            phone: trimmedPhone,
            altPhone: trimmedAltPhone,
            fullAddress: trimmedFullAddress,
            landmark: trimmedLandmark,
            city: trimmedCity,
            state: trimmedState,
            pincode: trimmedPincode,
            isDefault: addressCount === 0
        })

        await newAddress.save()

        return res.status(201).json({
            success: true,
            message: 'Address added successfully'
        })

    } catch (error) {
        console.error('Address saving error:', error)
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while saving the address.'
        })
    }
}



const selectAddress = async (req, res) => {
    try {
        const userId = req.session.user.id
        const addressId = req.params.id

        const address = await Address.findOne({
            _id: addressId,
            user: userId
        })

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found.'
            })
        }

        await Address.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        )

        await Address.updateOne(
            { _id: addressId, user: userId },
            { $set: { isDefault: true } }
        )

        return res.status(200).json({
            success: true
        })

    } catch (error) {
        console.error('Address selection error:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong while selecting the address.'
        })
    }
}



const loadEditAddress = async (req, res) => {
    try {
        const userId = req.session.user.id
        const addressId = req.params.id

        const user = await User.findById(userId)

        const address = await Address.findOne({
            _id: addressId,
            user: userId
        })

        if (!address) {
            return res.redirect('/address')
        }

        return res.render('edit-address', {
            user,
            address
        })

    } catch (error) {
        console.error('Loading edit address error:', error)
        return res.status(500).send('Something went wrong while loading the address.')
    }
}




const editAddress = async (req, res) => {
    try {
        const userId = req.session.user.id
        const addressId = req.params.id

        const address = await Address.findOne({
            _id: addressId,
            user: userId
        })

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found.'
            })
        }

        const {
            addressType,
            name,
            phone,
            altPhone,
            fullAddress,
            landmark,
            city,
            state,
            pincode
        } = req.body

        const errors = {}

        const trimmedName = name?.trim() || ''
        const trimmedPhone = phone?.trim() || ''
        const trimmedAltPhone = altPhone?.trim() || ''
        const trimmedFullAddress = fullAddress?.trim() || ''
        const trimmedLandmark = landmark?.trim() || ''
        const trimmedCity = city?.trim() || ''
        const trimmedState = state?.trim() || ''
        const trimmedPincode = pincode?.trim() || ''

        if (!['Home', 'Office', 'Other'].includes(addressType)) {
            errors.addressType = 'Please select a valid address type.'
        }

        if (trimmedName.length < 2 || trimmedName.length > 50) {
            errors.name = 'Name must be between 2 and 50 characters.'
        } else if (!/^[A-Za-z ]+$/.test(trimmedName)) {
            errors.name = 'Name can contain only letters and spaces.'
        }

        if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
            errors.phone = 'Please enter a valid 10-digit mobile number.'
        }

        if (trimmedAltPhone) {
            if (!/^[6-9]\d{9}$/.test(trimmedAltPhone)) {
                errors.altPhone = 'Please enter a valid 10-digit alternate mobile number.'
            } else if (trimmedAltPhone === trimmedPhone) {
                errors.altPhone = 'Alternate phone must be different from primary phone.'
            }
        }

        if (trimmedFullAddress.length < 5 || trimmedFullAddress.length > 200) {
            errors.fullAddress = 'Address must be between 5 and 200 characters.'
        }

        if (trimmedLandmark.length > 100) {
            errors.landmark = 'Landmark cannot exceed 100 characters.'
        }

        if (trimmedCity.length < 2 || trimmedCity.length > 50) {
            errors.city = 'City must be between 2 and 50 characters.'
        } else if (!/^[A-Za-z ]+$/.test(trimmedCity)) {
            errors.city = 'City can contain only letters and spaces.'
        }

        if (trimmedState.length < 2 || trimmedState.length > 50) {
            errors.state = 'State must be between 2 and 50 characters.'
        } else if (!/^[A-Za-z ]+$/.test(trimmedState)) {
            errors.state = 'State can contain only letters and spaces.'
        }

        if (!/^\d{6}$/.test(trimmedPincode)) {
            errors.pincode = 'Pincode must be exactly 6 digits.'
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                errors
            })
        }

        address.addressType = addressType
        address.name = trimmedName
        address.phone = trimmedPhone
        address.altPhone = trimmedAltPhone
        address.fullAddress = trimmedFullAddress
        address.landmark = trimmedLandmark
        address.city = trimmedCity
        address.state = trimmedState
        address.pincode = trimmedPincode

        await address.save()

        return res.status(200).json({
            success: true,
            message: 'Address updated successfully.'
        })

    } catch (error) {
        console.error('Address editing error:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong while updating the address.'
        })
    }
}



const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user.id
        const addressId = req.params.id

        const address = await Address.findOne({
            _id: addressId,
            user: userId
        })

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found.'
            })
        }

        const wasDefault = address.isDefault

        await Address.deleteOne({
            _id: addressId,
            user: userId
        })

        if (wasDefault) {
            const oldestAddress = await Address.findOne({
                user: userId
            }).sort({ createdAt: 1 })

            if (oldestAddress) {
                oldestAddress.isDefault = true
                await oldestAddress.save()
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Address deleted successfully.'
        })

    } catch (error) {
        console.error('Address deletion error:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong while deleting the address.'
        })
    }
}

module.exports = {
    loadAddress,
    loadAddAddress,
    saveAddress,
    selectAddress,
    loadEditAddress,
    editAddress,
    deleteAddress
}