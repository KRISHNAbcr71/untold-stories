const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    description:{type:String, required:true, trim:true},
    isListed:{type:Boolean, default:true},
    isDeleted:{type:Boolean, default:false},
    deletedAt:{type:Date, default:null}
},{timestamps:true});

module.exports = mongoose.model('Category',categorySchema);