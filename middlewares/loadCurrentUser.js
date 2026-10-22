const User = require('../models/User')

const loadCurrentUser = async(req,res,next) =>{
    try {
        res.locals.currentUser = null
        if(req.session.user && req.session.user.id){
            res.locals.currentUser = await User.findById(
                req.session.user.id
            ).select('name')
        }
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = loadCurrentUser