const Category = require('../../models/Category')
const mongoose = require('mongoose')

const loadCategories = async (req,res)=>{
    try {
        const categories = await Category.find({isDeleted:false}).sort({createdAt: -1})

        res.render('categories',{
            categories
        })
    } catch (error) {
        console.error('Error loading categories:', error);
        res.status(500).send('Internal Server Error');
    }
}


const addCategory = async(req,res)=>{
    try {
        const {name,description} = req.body
        
        if(
            typeof name !== 'string' ||
            typeof description !== 'string' ||
            !name.trim() ||
            !description.trim()
        ){
            return res.status(400).json({
                success:false,
                message:'Category name and description are required.'
            })
        }

        const categoryName = name.trim()
        const categoryDescription = description.trim()

        if(categoryName.length<2 || categoryName.length>50){
            return res.status(400).json({
                success:false,
                message:'Category name must be between 2 and 50 characters.'
            })
        }

        if(categoryDescription.length<10 || categoryDescription.length>300){
            return res.status(400).json({
                success:false,
                message:'Description must be between 10 and 300 characters.'
            })
        }

        const textPattern = /^[a-zA-Z ]+$/;
        if(!textPattern.test(categoryName)){
            return res.status(400).json({
                success:false,
                message:'Category name can contain only letters and spaces.'
            })
        }
        if(!textPattern.test(categoryDescription)){
            return res.status(400).json({
                success:false,
                message:'Description can contain only letters and spaces.'
            })
        }



        const existingCategory = await Category.findOne({
            name:{$regex: `^${categoryName}$`, $options:'i'},
            isDeleted:false
        })
        if(existingCategory){
            return res.status(409).json({
                success:false,
                message:'This category already exists.'
            })
        }

        const category = new Category({
            name: categoryName,
            description: categoryDescription
        })
        await category.save()

        return res.status(201).json({
            success:true,
            message:'Category added successfully.'
        })

    } catch (error) {
        console.error('Error adding category:', error);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
}



const updateCategory = async(req,res)=>{
    try {
        const {id} = req.params
        const {name,description} = req.body

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success:false,
                message:'Invalid category ID.'
            })
        }

        if(typeof name !== 'string' || typeof description !== 'string'){
            return res.status(400).json({
                success:false,
                message:'Category name and description are required.'
            })
        }

        const categoryName = name.trim()
        const categoryDescription = description.trim()

        if(!categoryName || !categoryDescription){
            return res.status(400).json({
                success:false,
                message:'Category name and description are required.'
            })
        }

        if(categoryName.length<2 || categoryName.length>50){
            return res.status(400).json({
                success:false,
                message:'Category name must be between 2 and 50 characters.'
            })
        }

        if(categoryDescription.length<10 || categoryDescription.length>500){
            return res.status(400).json({
                success:false,
                message:'Description must be between 10 and 300 characters.'
            })
        }

        const textPattern = /^[a-zA-Z ]+$/;
        if(!textPattern.test(categoryName)){
            return res.status(400).json({
                success:false,
                message:'Category name can contain only letters and spaces.'
            })
        }

        if(!textPattern.test(categoryDescription)){
            return res.status(400).json({
                success:false,
                message:'Description can contain only letters and spaces.'
            })
        }

        // duplicate name check
        const existingCategory = await Category.findOne({
            name:{
                $regex:`^${categoryName}$`,
                $options:'i'
            },
            isDeleted:false,
            _id:{$ne:id}
        })
        if(existingCategory){
            return res.status(409).json({
                success:false,
                message:'This category already exists.'
            })
        }

        // category existence check
        const category = await Category.findOne({
            _id:id,
            isDeleted:false
        })
        if(!category){
            return res.status(400).json({
                success:false,
                message:'Category not found'
            })
        }

        category.name = categoryName
        category.description = categoryDescription

        await category.save()

        return res.status(200).json({
            success:true,
            message:'Category updated successfully'
        })
        
    } catch (error) {
        console.error('Error updating category:', error);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
}



const updateCategoryListingStatus = async (req,res)=>{
    try {
        const {id} = req.params
        const {isListed} = req.body

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success:false,
                message:'Invalid category ID.'
            })
        }

        if(typeof isListed !== 'boolean'){
            return res.status(400).json({
                success:false,
                message:'Listing status must be true or false.'
            })
        }

        const category = await Category.findOne({
            _id:id,
            isDeleted:false
        })
        if(!category){
            return res.status(400).json({
                success:false,
                message:'Category not found'
            })
        }

        category.isListed = isListed
        await category.save()

        return res.status(200).json({
            success:true,
            message:isListed ? 'Category listed successfully' : 'Category unlisted successfully'
        })

    } catch (error) {
        console.error('Error updating category listing status: ',error)
        return res.status(500).json({
            success:false,
            message:'Something went wrong. Please try again.'
        })
    }
}


module.exports = {
    loadCategories,
    addCategory,
    updateCategory,
    updateCategoryListingStatus
}