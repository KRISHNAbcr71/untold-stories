const rateLimit = require('express-rate-limit')

// Login: 5 requests per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req,res) =>{
        req.session.message = 'Too many login attempts. Please try again after 15 minutes.';
        return res.redirect('/login')
    }
}) 

// OTP verification: 3 requests per 10 minutes
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            icon: 'error',
            message: 'Too many OTP attempts. Please try again after 10 minutes.'
        });
    }
})

// Forgot password: 3 requests per 15 minutes
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        req.session.message = 'Too many password recovery attempts. Please try again after 15 minutes.';
        return res.redirect('/forgot-password');
    }
})

// Resend otp: 3 requests per 10 minutes
const resendOtpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: 'Too many OTP requests. Please try again after 10 minutes.'
        });
    }
    
})

module.exports = {
    loginLimiter,
    otpLimiter,
    forgotPasswordLimiter,
    resendOtpLimiter
}