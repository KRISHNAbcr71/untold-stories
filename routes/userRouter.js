const express = require('express')
const router = express.Router()
const userController = require('../controllers/user/userController')
const passport = require('../config/passport')
const {loginLimiter, otpLimiter, forgotPasswordLimiter, resendOtpLimiter} = require('../middlewares/rateLimiter')

router.get('/',userController.loadHome)
router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)
router.get('/verify-otp',userController.loadVerifyOtp)
router.post('/verify-otp',otpLimiter,userController.verifyOtp)
router.post('/resend-otp',resendOtpLimiter,userController.resendOtp)
router.get(
    '/auth/google',
    passport.authenticate('google',{
        scope:['profile','email'],
        session:false,
        prompt:'select_account'
    })
)
router.get(
    '/auth/google/callback',
    userController.googleAuthCallback
);

router.get('/login',userController.loadLogin)
router.post('/login',loginLimiter,userController.login)

router.get('/forgot-password',userController.loadForgotPassword)
router.post('/forgot-password',forgotPasswordLimiter,userController.forgotPassword)
router.get('/verify-forgot-password-otp',userController.loadVerifyForgotPasswordOtp)
router.post('/verify-forgot-password-otp',otpLimiter,userController.verifyForgotPasswordOtp)
router.post('/resend-forgot-password-otp',resendOtpLimiter,userController.resendForgotPasswordOtp)
router.get('/reset-password',userController.loadResetPassword)
router.post('/reset-password',userController.resetPassword)
router.post('/logout',userController.logout)

module.exports = router