const express = require('express')
const router = express.Router()
const userController = require('../controllers/user/userController')
const passport = require('../config/passport')

router.get('/',userController.loadHome)
router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)
router.get('/verify-otp',userController.loadVerifyOtp)
router.post('/verify-otp',userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp)
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




module.exports = router