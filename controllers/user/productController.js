const Product = require('../../models/Product');
const Category = require('../../models/Category')

const loadShop = async(req,res)=>{
    try {
        const search = req.query.search || ''
        const sort = req.query.sort || ''
        const requestedPage = parseInt(req.query.page) || 1
        const page = Math.max(requestedPage,1)
        const limit = 6
        const skip = (page - 1) * limit
        const searchFilter = {}

        if(search){
            searchFilter.productName={
                $regex:search,
                $options:'i'
            }
        }

        let sortOptions = {createdAt:-1}
        if(sort === 'price-low'){
            sortOptions = {price:1}
        }else if(sort === 'price-high'){
            sortOptions = {price:-1}
        }else if(sort === 'name-asc'){
            sortOptions = {productName:1}
        }else if(sort === 'name-desc'){
            sortOptions = {productName:-1}
        }

        const categoryIds = await Category.find({
            isListed:true,
            isDeleted:false
        }).distinct('_id')

        const products = await Product.find({
            isListed:true,
            isDeleted:false,
            category:{$in:categoryIds},
            ...searchFilter
        })
            .populate('category','name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)

        const totalProducts = await Product.countDocuments({
            isListed:true,
            isDeleted:false,
            category:{$in:categoryIds},
            ...searchFilter
        })

        const totalPages = Math.ceil(totalProducts/limit)
        if(totalPages>0 && page>totalPages){
            return res.redirect(`/shop?page=${totalPages}`)
        }

        return res.render('shop',{
            products,
            currentPage:page,
            totalPages,
            totalProducts,
            search,
            sort
        })
        
    } catch (error) {
        console.error('Error loading shop page:', error);
        return res.status(500).render('500');
    }
}

module.exports = {
    loadShop
}