const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const upload = require('../middlewares/multer')
const productUploadError = require('../middlewares/productUploadError')

router.get('/login',adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/dashboard',adminController.loadDashboard)

router.get('/users',customerController.loadCustomers)
router.patch('/users/:id/blockUser',customerController.blockUser) // will do block and unblock user

router.get('/categories',categoryController.loadCategories)
router.post('/categories/addCategory',categoryController.addCategory)
router.patch('/categories/:id',categoryController.updateCategory)
router.patch('/categories/:id/listing-status',categoryController.updateCategoryListingStatus) // will do list and unlist categories
router.patch('/categories/:id/delete',categoryController.deleteCategory)

router.get('/products',productController.loadProducts)
router.post(
    '/addProduct',
    upload.array('productImages',10),
    productUploadError,
    productController.addProduct
)
router.patch(
    '/products/:id',
    upload.array('productImages',10),
    productUploadError,
    productController.updateProduct
)

module.exports = router