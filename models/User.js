const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    email:{type:String, required:true, unique:true, trim:true},
    phone:{type:String, trim:true},
    password:{type:String},
    profileImage:{type:String,default:''},
    googleId:{type:String},
    isBlocked:{type:Boolean, default:false},
    isAdmin:{type:Boolean, default:false}
},{timestamps:true});

module.exports = mongoose.model("User", userSchema);