const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')


passport.use(
    new GoogleStrategy(
        {
            clientID:process.env.GOOGLE_CLIENT_ID,
            clientSecret:process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:process.env.GOOGLE_CALLBACK_URL,
        },
        async(accessToken,refreshToken,profile,done)=>{
            try {
                const email = profile.emails?.[0]?.value
                const emailVerified = profile._json?.email_verified

                if(!email || emailVerified !== true){
                    return done(null,false,{
                        message:'Google email could not verified'
                    })
                }

                let user = await User.findOne({email})

                if(user && user.isBlocked){
                    return done(null,false,{
                        message:'Your account has been blocked'
                    })
                }

                if(!user){
                    user = await User.create({
                        name: profile.displayName,
                        email,
                        googleId:profile.id
                    })
                }else if(!user.googleId){
                    user.googleId = profile.id
                    await user.save()
                }else if(user.googleId !== profile.id){
                    return done(null,false,{
                        message:'This email is linked to another google account'
                    })
                }

                return done(null,user)

            } catch (error) {
                return done(error,null)
            }
        }
    )
)



module.exports = passport