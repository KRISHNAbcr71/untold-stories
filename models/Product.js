const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName:{type:String, required:true, trim:true},
    author:{type:String, required:true, trim:true},
    description:{type:String, required:true, trim:true},
    category:{type:mongoose.Schema.Types.ObjectId, ref:'Category', required:true},
    price:{type:Number, required:true, min:0},
    quantity:{type:Number, required:true, min:0, default:0},
    productImage:{
        type:[{type:String, required:true}],
        validate:{
            validator:function (images){
                return images.length>=3;
            },
            message:'At least 3 product images are required'
        }
    },
    isListed:{type:Boolean, default:true},
    isDeleted:{type:Boolean, default:false},
    deletedAt:{type:Date, default:null}
},{timestamps:true});

module.exports = mongoose.model("Product", productSchema);