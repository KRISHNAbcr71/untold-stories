const transporter = require('../config/email')

const sendVerificationEmail = async(email,otp,purpose='signup') =>{
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: purpose === 'signup'
                ? 'The Untold Stories - Email Verification'
                : 'The Untold Stories - Password Reset OTP',
            text: purpose === 'signup'
                ? `Your OTP is ${otp}. It expires in 60 seconds.`
                : `Your password reset OTP is ${otp}. It expires in 60 seconds.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; background: #f8f4e9; border-radius: 12px; text-align: center;">
                    <h3 style="color: #333;">
                        ${purpose === 'signup' ? 'Email Verification: ' : 'Password Reset: '}
                    </h3>
                    <p>
                        ${purpose === 'signup'
                            ? "Use the following code to verify your email address - "
                            : 'Use the following code to reset your password - '
                        }
                    
                    </p>
                    <h1 style="color: #b83d28; letter-spacing: 8px;">${otp}</h1>
                    <p>This code expires in 60 seconds.</p>
                    <p style="color: #777; font-size: 13px;">If you didn't request this code, you can ignore this email.</p>
                </div>
            `
        })

        return true
        
    } catch (error) {
        console.error('Error sending verification email',error)
        return false
    }
}

module.exports = sendVerificationEmail