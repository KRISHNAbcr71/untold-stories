const express = require('express')
const path = require('path')
const connectDB = require('./config/db')
require('dotenv').config()

const app = express()
connectDB()
app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use(express.static(path.join(__dirname,"public")))

app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))

// test route
app.get('/',(req,res)=>{
    res.send("E-commerce project is running")
})


const PORT = process.env.PORT || 7000
app.listen(PORT,()=>{
    console.log(`Server running on port: ${PORT}`)
})


module.exports = app