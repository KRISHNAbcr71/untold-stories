const Product = require('../../models/Product') 
const Category = require('../../models/Category')
const mongoose = require('mongoose')
const processProductImages = require('../../utils/processProductImages')


const loadProducts = async(req,res)=>{
    try {
        const search = req.query.search || ''
        const currentPage = parseInt(req.query.page) || 1
        const limit = 3
        const skip = (currentPage - 1)*limit
        const query = {
            isDeleted:false
        }

        if (search.trim()) {
            query.$or = [
                {
                    productName: {
                        $regex: search.trim(),
                        $options: 'i'
                    }
                },
                {
                    author: {
                        $regex: search.trim(),
                        $options: 'i'
                    }
                }
            ];
        }

        const totalProducts = await Product.countDocuments(query)
        const totalPages = Math.ceil(totalProducts/limit)
        const products = await Product.find(query)
            .populate('category', 'name')
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit)

        const productCount = await Product.countDocuments({isDeleted:false})
        const listedProducts = await Product.countDocuments({
            isDeleted:false,
            isListed:true
        })
        const unlistedProducts = await Product.countDocuments({
            isDeleted:false,
            isListed:false
        })

        const categories = await Category.find({
            isDeleted:false,
            isListed:true
        }).sort({name:1})

        res.render('products',{
            products,
            search,
            currentPage,
            totalProducts,
            totalPages,
            productCount,
            listedProducts,
            unlistedProducts,
            categories
        })

    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).render('500')
    }
}



const addProduct = async(req,res)=>{
    try {
        const {productName,author,description,category,price,quantity} = req.body
        const errors = {}

        const existingProduct = await Product.findOne({
            productName:{
                $regex:`^${productName.trim()}$`,
                $options:'i'
            },
            author:{
                $regex:`^${author.trim()}$`,
                $options:'i'
            },
            category:category,
            isDeleted:false
        })

        if(existingProduct){
            errors.productName = 'This product already exists in this category'
        }

        if (!productName || productName.trim().length < 2 || productName.trim().length > 100) {
            errors.productName = 'Product name must be between 2 and 100 characters.';
        } else if (/\d/.test(productName)) {
            errors.productName = 'Product name cannot contain numbers.';
        }

        if (!author || author.trim().length < 2 || author.trim().length > 50) {
            errors.author = 'Author name must be between 2 and 50 characters.'
        } else if (!/^[A-Za-z ]+$/.test(author.trim())) {
            errors.author = 'Author name can contain only letters and spaces.'
        }

        if (!description || description.trim().length < 10 || description.trim().length > 300) {
            errors.description = 'Description must be between 10 and 300 characters.'
        } else if (/\d/.test(description)) {
            errors.description = 'Description cannot contain numbers.'
        }

        if (!category) {
            errors.category = 'Please select a category.'
        }else if(!mongoose.Types.ObjectId.isValid(category)){
            errors.category = 'Invalid category selected.'
        }else{
            const existingCategory = await Category.findOne({
                _id:category,
                isDeleted:false,
                isListed:true
            }) 
            if(!existingCategory){
                errors.category = 'Selected category is unavailable'
            }
        }

        if (price === undefined || price === '' || Number(price) <= 0 || !Number.isFinite(Number(price))) {
            errors.price = 'Price must be greater than zero.'
        }

        if (quantity === undefined || quantity === '' || !Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
            errors.quantity = 'Quantity must be a non-negative integer.'
        }

        const productImages = req.files
        if (!productImages || productImages.length < 3) {
            errors.productImages = 'Please upload at least 3 product images.'
        } else if (productImages.length > 10) {
            errors.productImages = 'You can upload a maximum of 10 images.'
        }

        if(Object.keys(errors).length>0){
            return res.status(400).json({
                success:false,
                errors
            })
        }

        const productImagePaths  = await processProductImages(req.files)

        const newProduct = new Product({
            productName:productName.trim(),
            author:author.trim(),
            description:description.trim(),
            category:category,
            price:Number(price),
            quantity:Number(quantity),
            productImage:productImagePaths
        })

        await newProduct.save()

        return res.status(201).json({
            success:true,
            message:'Product added successfully'
        })

    } catch (error) {
        console.error('Error adding product:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
}

module.exports = {
    loadProducts,
    addProduct
}