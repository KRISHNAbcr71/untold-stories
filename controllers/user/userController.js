const User = require('../../models/User')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const sendVerificationEmail = require('../../utils/sendVerificationEmail')
const passport = require('../../config/passport');

const loadHome = (req,res) =>{
    res.render('home',(error,html)=>{
        if(error){
            console.error('[Home page load error]: ',error)
            return res.status(500).render('500')
        }
        res.send(html)
    })
}


const loadSignup = (req,res) =>{
    try {
        res.render('signup',{
            message: req.query.error || ''
        })
    } catch (error) {
        console.error('[Signup page load error]: ',error)
        res.status(500).send('An unexpected error occurred. Please try again later.')
    }
}


const signup = async (req,res) => {
    try {
        const {name,email,phone,password,confirmPassword} = req.body
        const errors = {}

        if(!name || name.trim() === ''){
            errors.name = 'Full name is required'
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if(!email || email.trim() === ''){
            errors.email = 'Email is required'
        }else if(!emailPattern.test(email.trim())){
            errors.email = 'Please enter a valid email address'
        }

        if(!phone || phone.trim() === ''){
            errors.phone = 'Phone number is required'
        }else if(phone.length !== 10 || isNaN(phone)){
            errors.phone = 'Enter a valid 10-digit mobile number'
        }

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/
        if(!password){
            errors.password = 'Password is required'
        }else if(!passwordPattern.test(password)){
            errors.password = 'Passwords does not match the required conditions'
        }

        if(!confirmPassword){
            errors.confirmPassword = 'Please confirm your password'
        }else if(confirmPassword !== password){
            errors.confirmPassword = 'Passwords do not match'
        }

        if(Object.keys(errors).length > 0){
            return res.status(400).json({errors})
        }

        const existingUser = await User.findOne({
            email: email.trim()
        })

        if(existingUser){
            return res.status(409).render('signup',{
                message: 'This email is already registered. Please use another email',
                name: name,
                phone: phone
            })
        }

        const otp = crypto.randomInt(100000,1000000).toString()
        const hashedOtp = await bcrypt.hash(otp,10)
        const hashedPassword = await bcrypt.hash(password,10)
        const otpExpiresAt = Date.now() + 60 *1000;

        req.session.pendingSignup = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: hashedPassword,
            otp: hashedOtp,
            otpExpiresAt: otpExpiresAt
        }

        const emailSent = await sendVerificationEmail(email.trim(),otp)

        if(!emailSent){
            delete req.session.pendingSignup
            return res.status(500).json({
                message:'Unable to send verification email. Please try again'
            })
        }

        return res.redirect('/verify-otp')


    } catch (error) {
        console.error('Signup error: ',error)
        res.status(500).send('Internal server error')
    }
}


const loadVerifyOtp = (req,res) =>{
    try {
        const pendingSignup = req.session.pendingSignup

        if(!pendingSignup){
            return res.redirect('/signup')
        }

        if(Date.now() >= pendingSignup.otpExpiresAt){
            return res.redirect('/signup')
        }

        res.render('verifyOtp',{
            email: pendingSignup.email,
            otpExpiresAt: pendingSignup.otpExpiresAt
        })

    } catch (error) {
        console.error('Error loading OTP page:', error);
        res.status(500).send('Internal Server Error');
    }
}


const verifyOtp = async (req,res) =>{
    try {
        const pendingSignup = req.session.pendingSignup
        if(!pendingSignup){
            return res.status(400).json({
                success: false,
                message: 'Your signup session has expired. Please sign up again to continue',
                icon: 'error',
                redirectToSignup: true
            })
        }

        if(Date.now() > pendingSignup.otpExpiresAt){
            delete req.session.pendingSignup
            return res.status(400).json({
                success: false,
                message: 'Your OTP has expired. Please sign up again.',
                icon: 'error',
                redirectToSignup: true
            })
        }

        const enterOtp = req.body.otp1+req.body.otp2+req.body.otp3+req.body.otp4+req.body.otp5+req.body.otp6

        if(!/^\d{6}$/.test(enterOtp)){
            return res.status(400).json({
                success: false,
                message: 'Please enter the six-digit OTP.',
                icon: 'error'
            })
        }

        const isOtpValid = await bcrypt.compare(
            enterOtp,
            pendingSignup.otp
        )

        if(!isOtpValid){
            return res.status(400).json({
                success: false,
                message:'Incorrect OTP. Please try again',
                icon: 'error'
            })
        }

        const existingUser = await User.findOne({
            email:pendingSignup.email
        })
        if(existingUser){
            delete req.session.pendingSignup
            return res.status(409).send('This email is already registered. Please sign in')
        }

        const newUser = new User({
            name: pendingSignup.name,
            email: pendingSignup.email,
            phone: pendingSignup.phone,
            password: pendingSignup.password
        })
        await newUser.save()

        req.session.user = {
            id: newUser._id
        }

        delete req.session.pendingSignup

        return res.status(200).json({
            success: true,
            message: 'Welcome to The Untold Stories!',
            icon: 'success',
            redirectToHome: true
        })

    } catch (error) {
        console.error('OTP form verification error: ',error)
        res.status(500).json({
            success: flase,
            message: 'Something went wrong. Please try again.',
            icon: 'error'
        })
    }
}



const resendOtp = async (req,res) =>{
    try {
        const pendingSignup = req.session.pendingSignup
        if(!pendingSignup){
            return res.status(400).json({
                success: false,
                message: 'Your signup session has expired. Please sign up again.',
                icon: 'error',
                redirectToSignup: true
            })
        }

        const otp = crypto.randomInt(100000,1000000).toString()
        const hashedOtp = await bcrypt.hash(otp,10)
        pendingSignup.otp = hashedOtp
        pendingSignup.otpExpiresAt = Date.now() + 60 * 1000

        await sendVerificationEmail(pendingSignup.email,otp)

        return res.json({
            success: true,
            message: 'A new OTP has been sent to your email.',
            icon: 'success',
            otpExpiresAt: pendingSignup.otpExpiresAt
        })

    } catch (error) {
        console.error('Resend OTP error: ',error)
        return res.status(500).json({
            success: false,
            message: 'Unable to resend OTP. Please try again.',
            icon: 'error'
        })
    }
}



const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', {
        session: false
    }, (error, user, info) => {
        if (error) {
            return next(error);
        }

        if (!user) {
            const message = info?.message ||
                'Google sign-in failed. Please try again.';

            return res.redirect(
                `/signup?error=${encodeURIComponent(message)}`
            );
        }

        req.session.user = {
            id: user._id
        };

        res.redirect('/');
    })(req, res, next);
};


module.exports = {
    loadHome,
    loadSignup,
    signup,
    loadVerifyOtp,
    verifyOtp,
    resendOtp,
    googleAuthCallback
}