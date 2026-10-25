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

            // return res.redirect(
            //     `/login?error=${encodeURIComponent(message)}`
            // );
            req.session.message = message
            return res.redirect('/login')
        }

        req.session.user = {
            id: user._id
        };

        res.redirect('/');
    })(req, res, next);
};

// LOGIN

const loadLogin = (req,res)=>{
    const message = req.session.message
    delete req.session.message
    return res.render('login',{
        message: message
    })
}


const login = async (req,res)=>{
    try {
        const {email,password} = req.body
        if(!email || !password){
            req.session.message = 'Email and password are required.';
            return res.redirect('/login');
        }

        const user = await User.findOne({email:email.trim()})
        if(!user){
            req.session.message = 'Invalid email or password.';
            return res.redirect('/login');
        }
        if(!user.password){
            req.session.message = 'Invalid email or password.';
            return res.redirect('/login');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(!isPasswordValid){
            req.session.message = 'Invalid email or password.';
            return res.redirect('/login');
        }

        if(user.isBlocked){
            req.session.message = 'Your account has been blocked'
            return res.redirect('/login')
        }

        req.session.user = {
            id: user._id
        }

        return res.redirect('/')
        
    } catch (error) {
        console.error('Login error: ',error)
        return res.status(500).render('500')
    }
}


const loadForgotPassword = (req,res) => {
    const message = req.session.message
    const successMessage = req.session.successMessage

    delete req.session.message
    delete req.session.successMessage

    return res.render('forgotPassword',{
        message: message,
        successMessage: successMessage
    })
}

const forgotPassword = async (req,res) => {
    try {
        const {email} = req.body
        if(!email || !email.trim()){
            return res.status(400).render('forgotPassword',{
                message: 'Please enter your email address'
            })
        }

        const user = await User.findOne({email:email.trim()})
        if(!user){
            req.session.message = 'No account found with this email address.'
            return res.redirect('/verify-forgot-password-otp')
        }


        const otp = crypto.randomInt(100000,1000000).toString()
        const hashedOtp = await bcrypt.hash(otp,10)
        const otpExpiresAt = Date.now() + 60 * 1000

        req.session.resetPasswordOtp = {
            otp: hashedOtp,
            email: email.trim(),
            expiresAt: otpExpiresAt
        }

        const emailSent = await sendVerificationEmail(email.trim(),otp,'password-reset')
        if(!emailSent){
            delete req.session.resetPasswordOtp
            req.session.message = 'Unable to send OTP. Please try again'
            return res.redirect('/forgot-password')
        }


        req.session.successMessage = 'OTP sent successfully to your email'
        return res.redirect('/forgot-password?otpSent=true')

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).render('forgotPassword', {
            message: 'Something went wrong. Please try again.'
        });
    }
}


const loadVerifyForgotPasswordOtp = (req,res)=>{
    const resetPasswordOtp = req.session.resetPasswordOtp
    if(!resetPasswordOtp){
        return res.redirect('/forgot-password')
    }

    const successMessage = req.session.successMessage
    delete req.session.successMessage

    return res.render('verifyForgotPasswordOtp',{
        email: resetPasswordOtp.email,
        otpExpiresAt: resetPasswordOtp.expiresAt,
        successMessage: successMessage
    })
}



const verifyForgotPasswordOtp = async(req,res) =>{
    try {
       const resetPasswordOtp = req.session.resetPasswordOtp
       if(!resetPasswordOtp){
        return res.status(400).json({
            icon: 'error',
            message: 'Your password reset session has expired. Please try again.'
        })
       } 

       if(Date.now() > resetPasswordOtp.expiresAt){
        delete req.session.resetPasswordOtp
        return res.status(400).json({
            icon: 'errror',
            message: 'Your OTP has expired. Please request a new one.'
        })
       }

       const {otp1,otp2,otp3,otp4,otp5,otp6} = req.body
       const enteredOtp = otp1+otp2+otp3+otp4+otp5+otp6
       const isOtpValid = await bcrypt.compare(enteredOtp, resetPasswordOtp.otp)
       if(!isOtpValid){
        return res.status(400).json({
            icon: 'error',
            message: 'Invalid OTP. Please try again'
        })
       }

       req.session.resetPasswordOtp.verified = true

       return res.json({
        icon: 'success',
        message: 'OTP verified successfully.',
        redirectToPasswordReset: true
       })


    } catch (error) {
        console.error('Forgot password OTP verification error:', error);

        return res.status(500).json({
            icon: 'error',
            message: 'Something went wrong. Please try again.'
        });
    }
}


const resendForgotPasswordOtp = async(req,res) =>{
    try {
        const resetPasswordOtp = req.session.resetPasswordOtp
        if(!resetPasswordOtp){
            return res.status(400).json({
                icon:'error',
                message:'Your password reset session has expired. Please try again.'
            })
        }

        const otp = crypto.randomInt(100000,1000000).toString()
        const hashedOtp = await bcrypt.hash(otp,10)
        const otpExpiresAt = Date.now() + 60 * 1000

        req.session.resetPasswordOtp = {
            otp: hashedOtp,
            email: resetPasswordOtp.email,
            expiresAt: otpExpiresAt
        }

        const emailSent = await sendVerificationEmail(resetPasswordOtp.email, otp, 'reset-password')

        if(!emailSent){
            delete req.session.resetPasswordOtp
            return res.status(500).json({
                icon:'error',
                message:'Unable to send the OTP. Please try again.'
            })
        }

        return res.json({
            icon:'success',
            message:'A new OTP has been sent to your email.',
            otpExpiresAt:otpExpiresAt
        })


    } catch (error) {
        console.error('Resend forgot password OTP error:', error);

        return res.status(500).json({
            icon: 'error',
            message: 'Something went wrong. Please try again.'
        });

    }
}


const loadResetPassword = (req,res) =>{
    try {
        const resetPasswordOtp = req.session.resetPasswordOtp
        if(!resetPasswordOtp || !resetPasswordOtp.verified){
            return res.redirect('/forgot-password')
        }

        return res.render('resetPassword')


    } catch (error) {
        console.error('Load reset password page error:', error);

        return res.status(500).render('500');
    }

}


const resetPassword = async (req,res) =>{
    try {
        const resetPasswordOtp = req.session.resetPasswordOtp
        if(!resetPasswordOtp || !resetPasswordOtp.verified){
            return res.status(400).redirect('/forgot-password')
        }

        const {newPassword,confirmPassword} = req.body
        if(!newPassword && !confirmPassword){
            return res.status(400).render('resetPassword',{
                message: 'Please fill in both password fields'
            })
        }

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/
        if(!passwordPattern.test(newPassword)){
            return res.status(400).render('resetPassword',{
                message: 'Use at least 8 characters with uppercase, lowercase, a number and a special character. Spaces are not allowed'
            })
        }

        if(newPassword !== confirmPassword){
            return res.status(400).render('resetPassword',{
                message: 'Passwords do not match'
            })
        }

        const user = await User.findOne({email:resetPasswordOtp.email})
        if(!user){
            delete req.session.resetPasswordOtp
            return res.redirect('/forgot-password')
        }

        const hashedPassword = await bcrypt.hash(newPassword,10)
        user.password = hashedPassword
        await user.save()

        delete req.session.resetPasswordOtp

        return res.json({
            icon:'success',
            message:'Your password has been reset successfully!',
            redirectUrl: '/login'
        })


    } catch (error) {
        console.error('Reset password error:', error);

        return res.status(500).render('500');
    }
}


module.exports = {
    loadHome,
    loadSignup,
    signup,
    loadVerifyOtp,
    verifyOtp,
    resendOtp,
    googleAuthCallback,
    loadLogin,
    login,
    loadForgotPassword,
    forgotPassword,
    loadVerifyForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resendForgotPasswordOtp,
    loadResetPassword,
    resetPassword
}