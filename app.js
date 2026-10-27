const express = require('express')
const path = require('path')
const session = require('express-session')
const connectDB = require('./config/db')
require('dotenv').config()
const loadCurrentUser = require('./middlewares/loadCurrentUser')
const passport = require('./config/passport')
const nocache = require('nocache')
const userRoutes = require('./routes/userRoutes')


const app = express()
connectDB()
app.use(express.urlencoded({extended:true}))
app.use(express.json())


app.use(express.static(path.join(__dirname,"public")))
app.set('view engine','ejs')
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])


app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge: 1000 * 60 * 60,
        httpOnly:true,
        secure:false,
        sameSite:'lax'
    }
}))

app.use(nocache())

app.use(passport.initialize())
app.use(loadCurrentUser)
app.use('/',userRoutes)


app.use((req,res)=>{
    res.status(404).render('404')
})

app.use((error,req,res,next)=>{
    console.error('[Server error]: ',error )
    res.status(500).render('500')
})


const PORT = process.env.PORT || 7000
app.listen(PORT,()=>{
    console.log(`Server running on port: ${PORT}`)
})


module.exports = app