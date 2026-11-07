const User = require('../models/User')

const isAuthenticated = (req,res,next)=>{
    if(req.session.user){
        return next()
    }
    return res.redirect('/login')
}


const isAdmin = async(req,res,next)=>{
    try {
        if(!req.session.admin){
            return res.redirect('/admin/login')
        }

        const admin = await User.findById(req.session.admin.id)

        if(!admin || !admin.isAdmin || admin.isBlocked){
            return res.redirect('/admin/login')
        }

        return next()

    } catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(500).render('500');
    }
}

module.exports = {
    isAuthenticated,
    isAdmin
}