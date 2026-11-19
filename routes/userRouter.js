const express = require('express')
const router = express.Router()
const userController = require('../controllers/user/userController')
const productController = require('../controllers/user/productController')
const cartController = require('../controllers/user/cartController')
const wishlistController = require('../controllers/user/wishlistController')
const profileController = require('../controllers/user/profileController')
const passport = require('../config/passport')
const {loginLimiter, otpLimiter, forgotPasswordLimiter, resendOtpLimiter} = require('../middlewares/rateLimiter')
const {isAuthenticated} = require('../middlewares/auth')
const upload = require('../middlewares/multer')

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

router.get('/shop',productController.loadShop)
router.get('/product/:id',productController.loadProductDetails)

router.get('/cart',isAuthenticated,cartController.loadCart)
router.post('/cart/add/:id',isAuthenticated,cartController.addToCart)
router.delete('/cart/remove/:id',isAuthenticated,cartController.removeFromCart)
router.patch('/cart/update/:id',isAuthenticated,cartController.updateCartQuantity)

router.get('/wishlist',isAuthenticated,wishlistController.loadWishlist)
router.post('/wishlist/add/:id',isAuthenticated,wishlistController.addToWishlist)
router.delete('/wishlist/remove/:id',isAuthenticated,wishlistController.removeFromWishlist)

router.get('/profile',isAuthenticated,profileController.loadProfile)
router.get('/profile/editName',isAuthenticated,profileController.loadEditName)
router.patch('/profile/editName',isAuthenticated,profileController.updateName)
router.get('/profile/editEmail',isAuthenticated,profileController.loadEditEmail)
router.patch('/profile/validateEmail',isAuthenticated,profileController.validateNewEmail)
router.get('/profile/verifyEmailOtp',isAuthenticated,profileController.loadVerifyEmailOtp)
router.post('/profile/verifyEmailOtp',isAuthenticated,profileController.verifyEmailOtp)
router.post('/profile/resendEmailOtp',isAuthenticated,profileController.resendEmailOtp)
router.get('/profile/editPassword',isAuthenticated,profileController.loadEditPassword)
router.patch('/profile/editPassword',isAuthenticated,profileController.updatePassword)
router.patch('/profile/editImage',isAuthenticated,upload.single('profileImage'),profileController.updateProfileImage)

module.exports = router