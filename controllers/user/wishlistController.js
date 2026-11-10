const mongoose = require('mongoose')
const Wishlist = require('../../models/Wishlist')
const Product = require('../../models/Product')
const Cart = require('../../models/Cart')


const addToWishlist = async(req,res)=>{
    try {
        const productId = req.params.id 
        const userId = req.session.user.id
        if(!mongoose.Types.ObjectId.isValid(productId)){
            return res.status(400).json({
                success:false,
                message:'Invalid Product ID'
            })
        }

        const product = await Product.findOne({
            _id:productId,
            isListed:true,
            isDeleted:false
        }).populate({
            path:'category',
            match:{
                isListed:true,
                isDeleted:false
            }
        })

        if(!product || !product.category){
            return res.status(404).json({
                success:false,
                message:'This product is unavailable'
            })
        }

        const cart = await Cart.findOne({
            user:userId
        })

        if(cart){
            const alreadyInCart = cart.items.some(item=>{
                return item.product.toString() === productId
            })

            if(alreadyInCart){
                return res.status(400).json({
                    success:false,
                    message:'This book is already in your cart. You cannot add it to your wishlist.'
                })
            }
        }

        let wishlist = await Wishlist.findOne({
            user:userId
        })

        if(!wishlist){
            wishlist = new Wishlist({
                user:userId,
                products:[]
            })
        }

        const alreadyExists = wishlist.products.some(item=>{
            return item.toString() === productId
        })

        if(alreadyExists){
            return res.status(400).json({
                success:false,
                message:'This product already exists in your wishlist'
            })
        }

        if(wishlist.products.length >=5){
            return res.status(400).json({
                success:false,
                message:'Your wishlist is full. You can add a maximum of 5 books.'
            })
        }

        wishlist.products.push(productId)

        await wishlist.save()

        return res.status(200).json({
            success:true,
            message:'Book added to your wishlist successfully'
        })

    } catch (error) {
        console.error('Error adding product to wishlist:', error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        })
    }
}



const loadWishlist = async(req,res)=>{
    try {
        const userId = req.session.user.id

        const wishlist = await Wishlist.findOne({
            user:userId
        }).populate({
            path:'products',
            populate:{
                path:'category',
                select:'name isListed isDeleted'
            }
        })

        const products = wishlist
            ? wishlist.products.filter(product=>{
                return product &&
                    product.isListed &&
                    !product.isDeleted &&
                    product.category &&
                    product.category.isListed &&
                    !product.category.isDeleted
            }) : []

            return res.render('wishlist',{
                products
            })

    } catch (error) {
        console.error('Error loading wishlist:', error)
        return res.status(500).render('500')
    }
}



const removeFromWishlist = async(req,res)=>{
    try {
        const productId = req.params.id
        const userId = req.session.user.id

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product'
            })
        }

        const wishlist = await Wishlist.findOne({
            user:userId
        })

        if(!wishlist){
            return res.status(404).json({
                success:false,
                message:'Wishlist not found'
            })
        }

        const productExists = wishlist.products.some(item=>{
            return item.toString() === productId
        })

        if(!productExists){
            return res.status(404).json({
                success:false,
                message:'Book not found in your wishlist'
            })
        }

        wishlist.products.pull(productId)
        await wishlist.save()

        return res.status(200).json({
            success:true,
            message:'Book removed from your wishlist successfully',
            wishlistCount:wishlist.products.length
        })

    } catch (error) {
        console.error('Error removing product from wishlist:', error)
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        })
    }
}



module.exports = {
    addToWishlist,
    loadWishlist,
    removeFromWishlist
}