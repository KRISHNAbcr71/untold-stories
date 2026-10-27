const User = require('../../models/User')
const bcrypt = require('bcrypt')

const loadLogin = (req,res)=>{
    res.render('admin-login',(error,html)=>{
        if(error){
            console.error('[Home page load error]: ',error)
            return res.status(500).render('500')
        }
        res.send(html)
    })
}


const login = async (req,res)=>{
    try {
        const {email,password} = req.body
        if(!email || !password){
            return res.status(400).render('admin-login',{
                message:'Email and Password are required'
            })
        }

        const admin = await User.findOne({email:email.trim()})

        if(!admin || !admin.password){
            return res.status(400).render('admin-login',{
                message:'Invalid email or password'
            })
        }

        const passwordMatch = await bcrypt.compare(password, admin.password)
        if(!passwordMatch){
            return res.status(401).render('admin-login',{
                message:'Invalid email or password'
            })
        }

        if(!admin.isAdmin){
            return res.status(403).render('admin-login',{
                message:'You are not authorized to access the admin panel'
            })
        }

        if(admin.isBlocked){
            return res.status(403).render('admin-login',{
                message:'Your account has been blocked'
            })
        }

        req.session.admin = {
            id: admin._id.toString()
        }

        return res.redirect('/admin/dashboard')

    } catch (error) {
        console.error('Admin login error: ',error)
        return res.status(500).render('500')
    }
}


const loadDashboard = (req,res)=>{
    res.render('dashboard')
}

module.exports = {
    loadLogin,
    login,
    loadDashboard
}