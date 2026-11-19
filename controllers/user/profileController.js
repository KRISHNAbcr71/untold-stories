const User = require('../../models/User')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const sendVerificationEmail = require('../../utils/sendVerificationEmail')
const processProfileImage = require('../../utils/processProfileImage')

const loadProfile = async(req,res)=>{
    try {
        const user = await User.findById(req.session.user.id)
        if(!user){
            return res.redirect('/login')
        }

        return res.render('profile',{
            user
        })

    } catch (error) {
        console.error('User profile loading error:', error)
        return res.status(500).render('500')
    }
}



const loadEditName = async(req,res)=>{
    try {
        const user = await User.findById(req.session.user.id)
        if(!user){
            return res.redirect('/login')
        }

        return res.render('edit-name',{
            user,
            pageTitle: 'EDIT NAME'
        })

    } catch (error) {
        console.error('Edit name page loading error:', error)
        return res.status(500).render('500')
    }
}



const updateName = async(req,res)=>{
    try {
        const name = req.body.name
        const userId = req.session.user.id

        if(typeof name !== 'string' || !name.trim()){
            return res.status(400).json({
                success:false,
                message:'Name cannot be empty'
            })
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(404).json({
                success:false,
                message:'User not found'
            })
        }

        user.name = name.trim()
        await user.save()

        return res.status(200).json({
            success:true,
            message:'Profile name updated successfully'
        })

    } catch (error) {
        console.error('User name update error:', error)
        return res.status(500).json({
            success:false,
            message: 'Something went wrong. Please try again.'
        })
    }
}



const loadEditEmail = async(req,res)=>{
    try {
        const user = await User.findById(req.session.user.id)

        if(!user){
            return res.redirect('/login')
        }

        return res.render('edit-email',{
            user,
            pageTitle: 'EDIT EMAIL'
        })

    } catch (error) {
        console.error('Edit email page loading error:', error)
        return res.status(500).render('500')
    }
}



const validateNewEmail = async(req,res)=>{
    try {
        const newEmail = req.body.newEmail
        const userId = req.session.user.id

        if(typeof newEmail !== 'string' || !newEmail.trim()){
            return res.status(400).json({
                success:false,
                message:'Email is required'
            })
        }

        const email = newEmail.trim()
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if(!emailPattern.test(email)){
            return res.status(400).json({
                success:false,
                message:'Please enter a valid email address'
            })
        }

        const currentUser = await User.findById(userId)

        if(!currentUser){
            return res.status(404).json({
                success:false,
                message:'User not found'
            })
        }

        if(email.toLowerCase() === currentUser.email.toLowerCase()){
            return res.status(400).json({
                success:false,
                message:'This is already your current email address'
            })
        }

        const existingUser = await User.findOne({
            email,
            _id:{$ne:userId}
        })

        if(existingUser){
            return res.status(409).json({
                success:false,
                message:'This email address is already registered'
            })
        }

        const otp = crypto.randomInt(100000, 1000000).toString()
        const hashedOtp = await bcrypt.hash(otp,10)
        const otpExpiresAt = Date.now() + 60 * 1000
        req.session.pendingEmailChange = {
            userId,
            newEmail:email,
            otp:hashedOtp,
            otpExpiresAt
        }

        const emailSent = await sendVerificationEmail(email,otp)
        if(!emailSent){
            delete req.session.pendingEmailChange

            return res.status(500).json({
                success:false,
                message:'Unable to send verification email. Please try again'
            })
        }

        return res.status(200).json({
            success:true,
            message:'Verification OTP sent successfully'
        })


    } catch (error) {
        console.error('New email validation error:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        })

    }
}



const loadVerifyEmailOtp = (req,res)=>{
    try {
        const pendingEmailChange = req.session.pendingEmailChange

        if(!pendingEmailChange ||
            String(pendingEmailChange.userId) !== String(req.session.user.id)
        ){
            return res.redirect('/profile/editEmail')
        }

        return res.render('verify-editEmail-otp',{
            email: pendingEmailChange.newEmail,
            otpExpiresAt: pendingEmailChange.otpExpiresAt,
            pageTitle: 'VERIFY OTP'
        })

    } catch (error) {
        console.error('Email verification page loading error:', error)
        return res.status(500).render('500')
    }
}



const verifyEmailOtp = async(req,res)=>{
    try {

        const pendingEmailChange = req.session.pendingEmailChange

        if(!pendingEmailChange || 
            String(pendingEmailChange.userId) !== String(req.session.user.id))
            {
                return res.status(400).json({
                    success:false,
                    message:'Email verification session expired. Please try again.'
                })
            }

        const enteredOtp = req.body.otp

        if(typeof enteredOtp !== 'string'
            || !/^\d{6}$/.test(enteredOtp)
        ){
            return res.status(400).json({
                success:false,
                message:'Please enter a valid 6-digit OTP.'
            })
        }

        // Check whether the OTP has expired
        if (Date.now() > pendingEmailChange.otpExpiresAt) {
            delete req.session.pendingEmailChange
            return res.status(400).json({
                success: false,
                message: 'Your OTP has expired. Please request a new one.'
            })
        }

        // Compare entered OTP with the hashed OTP
        const isOtpValid = await bcrypt.compare(enteredOtp, pendingEmailChange.otp)

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect OTP. Please check and try again.'
            })
        }

        // Check whether the new email is already registered
        const existingUser = await User.findOne({
            email: pendingEmailChange.newEmail,
            _id: { $ne: req.session.user.id }
        })

        if (existingUser) {
            delete req.session.pendingEmailChange

            return res.status(409).json({
                success: false,
                message: 'This email address is already registered.'
            })
        }

        // Find the logged-in user
        const user = await User.findById(req.session.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            })
        }

        // Update the email address
        user.email = pendingEmailChange.newEmail

        await user.save()

        // Clear pending email change details
        delete req.session.pendingEmailChange

        return res.status(200).json({
            success: true,
            message: 'Your email address has been updated successfully.'
        })
        
    } catch (error) {
        console.error('Email OTP verification error:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        })
    }
}



const resendEmailOtp = async(req,res)=>{
    try {
        const pendingEmailChange = req.session.pendingEmailChange

        if (!pendingEmailChange ||
            String(pendingEmailChange.userId) !== String(req.session.user.id)){
            return res.status(400).json({
                success: false,
                message: 'Email verification session expired. Please try again.'
            })
        }

        const otp = crypto.randomInt(100000, 1000000).toString()
        const hashedOtp = await bcrypt.hash(otp, 10)
        const otpExpiresAt = Date.now() + 60 * 1000
        const emailSent = await sendVerificationEmail(pendingEmailChange.newEmail,otp)

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Unable to send verification email. Please try again.'
            })
        }

        pendingEmailChange.otp = hashedOtp
        pendingEmailChange.otpExpiresAt = otpExpiresAt

        return res.status(200).json({
            success: true,
            message: 'A new verification OTP has been sent to your email address.',
            otpExpiresAt: otpExpiresAt
        })

    } catch (error) {
        console.error('Resend email OTP error:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        })
    }
}




const loadEditPassword = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id)

        if (!user) {
            return res.redirect('/login')
        }

        res.render('edit-password', {
            user,
            pageTitle: 'EDIT PASSWORD'
        })

    } catch (error) {
        console.error('Error loading edit password page:', error)
        res.redirect('/500')
    }
}



const updatePassword = async(req,res)=>{
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required.'
            })
        }

        const user = await User.findById(req.session.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            })
        }

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: 'Your current password is incorrect.'
            })
        }

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/

        if (!passwordPattern.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'New password does not meet the required criteria.'
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match.'
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully.'
        })

    } catch (error) {
        console.error('Error updating password:', error)
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while updating your password.'
        })
    }
}




const updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please select a profile image.'
            })
        }

        const user = await User.findById(req.session.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            })
        }

        const profileImagePath = await processProfileImage(req.file)

        user.profileImage = profileImagePath

        await user.save()

        return res.status(200).json({
            success: true,
            message: 'Profile image updated successfully.',
            profileImage: profileImagePath
        })

    } catch (error) {
        console.error('Error updating profile image:', error)

        return res.status(500).json({
            success: false,
            message: 'Unable to update profile image. Please try again.'
        })
    }
}




module.exports = {
    loadProfile,
    loadEditName,
    updateName,
    loadEditEmail,
    validateNewEmail,
    loadVerifyEmailOtp,
    verifyEmailOtp,
    resendEmailOtp,
    loadEditPassword,
    updatePassword,
    updateProfileImage
}