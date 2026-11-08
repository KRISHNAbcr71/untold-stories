const mongoose = require('mongoose')
const Cart = require('../../models/Cart')
const Product = require('../../models/Product')
const MAX_CART_QUANTITY = 5;
const MAX_CART_PRODUCTS = 5;

const loadCart = async(req,res)=>{
    try {
        const userId = req.session.user.id

        const cart = await Cart.findOne({user:userId})
            .populate({
                path:'items.product',
                populate:{
                    path:'category',
                    select: 'name isListed isDeleted'
                }
            })

        let subtotal = 0
        let itemCount = 0

        if(cart && cart.items.length>0){
            for(const item of cart.items){
                const product = item.product
                if(!product){
                    continue;
                }
                const category = product.category
                const isAvailable = 
                    product.isListed && 
                    !product.isDeleted &&
                    category &&
                    category.isListed &&
                    !category.isDeleted &&
                    product.quantity>0

                if(!isAvailable){
                    continue
                }

                subtotal += product.price * item.quantity
                itemCount += item.quantity
            }
        }

        return res.render('cart',{
            cart,
            subtotal,
            itemCount
        })


    } catch (error) {
        console.error('Error loading cart:', error);
        return res.status(500).render('500');
    }
}



const addToCart = async (req,res)=>{
    try {
        const productId = req.params.id
        const userId = req.session.user.id

        if(!mongoose.Types.ObjectId.isValid(productId)){
            return res.status(400).json({
                success:false,
                message:'Invalid product'
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

        if(product.quantity<=0){
            return res.status(400).json({
                success:false,
                message:'This product is out of stock'
            })
        }

        let cart = await Cart.findOne({user:userId})
        if(!cart){
            cart = new Cart({
                user:userId,
                items:[]
            })
        }

        const existingItem = cart.items.find(item=>{
            return item.product.toString() === productId
        })

        

        if(existingItem){
            if(existingItem.quantity >= MAX_CART_QUANTITY){
                return res.status(400).json({
                    success:false,
                    message:`You can add a maximum of ${MAX_CART_QUANTITY} copies of this book.`
                })
            }
            if (existingItem.quantity >= product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'You have reached the available stock limit.'
                });
            }
            existingItem.quantity += 1
        }else{
            if(cart.items.length >= MAX_CART_PRODUCTS){
                return res.status(400).json({
                    success:false,
                    message: `You can add a maximum of ${MAX_CART_PRODUCTS} different books to your cart.`
                })
            }


            cart.items.push({
                product:productId,
                quantity:1
            })
        }

        await cart.save()

        return res.status(200).json({
            success:true,
            message:'Product added to cart successfully',
            cartCount:cart.items.length
        })

    } catch (error) {
        console.error('Error adding product to cart:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
}



const removeFromCart = async(req,res)=>{
    try {
        const productId = req.params.id
        const userId = req.session.user.id

        if(!mongoose.Types.ObjectId.isValid(productId)){
            return res.status(400).json({
                success:false,
                message:'Invalid product'
            })
        }

        const result = await Cart.updateOne(
            {
                user:userId
            },
            {
                $pull:{
                    items:{
                        product:productId
                    }
                }
            }
        )

        if(result.modifiedCount === 0){
            return res.status(404).json({
                success:false,
                message:'Product not found in your cart'
            })
        }

        const updatedCart = await Cart.findOne({
            user:userId
        }).populate({
            path:'items.product',
            populate:{
                path:'category',
                select: 'name isListed isDeleted'
            }
        })

        let subtotal = 0
        let itemCount = 0

        if(updatedCart && updatedCart.items.length>0){
            for(const item of updatedCart.items){
                const product = item.product
                if(!product){
                    continue
                }
                const category = product.category
                const isAvailable = 
                product.isListed &&
                !product.isDeleted &&
                category &&
                category.isListed &&
                !category.isDeleted &&
                product.quantity > 0;
                if(!isAvailable){
                    continue
                }
                subtotal += product.price * item.quantity;
                itemCount += item.quantity;
            }
        }

        return res.status(200).json({
            success:true,
            message:'Product removed from your cart successfully',
            subtotal,
            itemCount
        })

    } catch (error) {
        console.error('Error removing product from cart:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
}




const updateCartQuantity = async(req,res)=>{
    try {
        const productId = req.params.id
        const userId = req.session.user.id
        const {quantity} = req.body

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product.'
            });
        }

        if(!Number.isInteger(quantity) || quantity<1){
            return res.status(400).json({
                success:false,
                message:'Invalid quantity'
            })
        }

        // Check the maximum quantity per customer
        if (quantity > MAX_CART_QUANTITY) {
            return res.status(400).json({
                success: false,
                message: `You can add a maximum of ${MAX_CART_QUANTITY} copies of this book.`
            });
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
                message:'This product is currently unavailable'
            })
        }

        if(quantity > product.quantity){
            return res.status(400).json({
                success:false,
                message:'Requested quantity exceeds available stock.'
            })
        }

        const cart = await Cart.findOne({
            user:userId
        })

        if(!cart){
            return res.status(404).json({
                success:false,
                message:'Cart not found'
            })
        }

        const cartItem = cart.items.find(item=>{
            return item.product.toString() === productId
        })

        if(!cartItem){
            return res.status(404).json({
                success:false,
                message:'Product not found in your cart'
            })
        }

        cartItem.quantity = quantity
        await cart.save()

        await cart.populate({
            path:'items.product',
            populate:{
                path:'category',
                select:'name isListed isDeleted'
            }
        })

        let subtotal = 0
        let itemCount = 0

        for(const item of cart.items){
            const product = item.product
            if(!product){
                continue
            }
            const category = product.category
            const isAvailable = 
                product.isListed &&
                !product.isDeleted &&
                category &&
                category.isListed &&
                !category.isDeleted &&
                product.quantity > 0;
            if(!isAvailable){
                continue
            }
            subtotal += product.price * item.quantity;
            itemCount += item.quantity;
        }

        const itemTotal = product.price * quantity

        return res.status(200).json({
            success:true,
            message:'Cart quantity updated successfully',
            quantity,
            itemTotal,
            subtotal,
            itemCount
        })


    } catch (error) {
        console.error('Error updating cart quantity:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
}



module.exports = {
    loadCart,
    addToCart,
    removeFromCart,
    updateCartQuantity
}