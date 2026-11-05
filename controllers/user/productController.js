const Product = require('../../models/Product');
const Category = require('../../models/Category')

const loadShop = async(req,res)=>{
    try {
        const search = req.query.search || ''
        const sort = req.query.sort || ''
        const selectedCategory = (req.query.category || '').trim()
        const selectedAuthor = req.query.author || ''
        const selectedPriceRange = req.query.priceRange || ''
        const requestedPage = parseInt(req.query.page) || 1
        const page = Math.max(requestedPage,1)
        const limit = 6
        const skip = (page - 1) * limit
        const searchFilter = {}
        const categoryFilter = {}
        const authorFilter = {}
        const priceFilter = {}

        if(search){
            searchFilter.productName={
                $regex:search,
                $options:'i'
            }
        }

        if(selectedCategory){
            categoryFilter.category = selectedCategory
        }

        if(selectedAuthor){
            authorFilter.author = selectedAuthor
        }

        if(selectedPriceRange === '100-500'){
            priceFilter.price = {
                $gte:100,
                $lte:500
            }
        }else if(selectedPriceRange === '500-1000'){
            priceFilter.price = {
                $gt:500,
                $lte:1000
            }
        }else if(selectedPriceRange === '1000-plus'){
            priceFilter.price = {
                $gt:1000
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

        // for filtering categories
        const categories = await Category.find({
            isListed:true,
            isDeleted:false
        }).sort({createdAt:-1})

        const products = await Product.find({
            isListed:true,
            isDeleted:false,
            category:{$in:categoryIds},
            ...searchFilter,
            ...categoryFilter,
            ...authorFilter,
            ...priceFilter
        })
            .populate('category','name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)

        const totalProducts = await Product.countDocuments({
            isListed:true,
            isDeleted:false,
            category:{$in:categoryIds},
            ...searchFilter,
            ...categoryFilter,
            ...authorFilter,
            ...priceFilter
        })

        const authors = await Product.distinct('author',{
            isListed:true,
            isDeleted:false,
            category:{$in:categoryIds}
        })
        authors.sort()

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
            sort,
            categories,
            authors,
            selectedCategory,
            selectedAuthor,
            selectedPriceRange
        })
        
    } catch (error) {
        console.error('Error loading shop page:', error);
        return res.status(500).render('500');
    }
}

module.exports = {
    loadShop
}