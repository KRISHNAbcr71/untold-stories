const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')

router.get('/login',adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/dashboard',adminController.loadDashboard)

router.get('/users',customerController.loadCustomers)
router.patch('/users/:id/blockUser',customerController.blockUser) // will do block and unblock user

router.get('/categories',categoryController.loadCategories)
router.post('/categories/addCategory',categoryController.addCategory)

module.exports = router