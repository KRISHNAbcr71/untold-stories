const User = require('../../models/User')
const mongoose = require('mongoose')

const loadCustomers = async (req,res)=>{
    try {
        const search = req.query.search?.trim() || ''
        let page = parseInt(req.query.page,10) || 1
        const status = req.query.status || 'all'

        const limit = 5

        const query = {}

        if(status === 'active'){
            query.isBlocked = false
        } else if(status === 'blocked'){
            query.isBlocked = true
        }


        if(search){
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
            query.$or = [
                {name: {$regex: escapedSearch, $options:'i'}},
                {email: {$regex: escapedSearch, $options:'i'}}
            ]
        }

        const totalCustomers = await User.countDocuments()
        const totalUsers = await User.countDocuments(query)
        const activeAccounts = await User.countDocuments({isBlocked:false})
        const totalPages = Math.ceil(totalUsers / limit)
        page = totalPages === 0 ? 1 : Math.min(page,totalPages)

        const users = await User.find(query)
            .sort({createdAt: -1})
            .skip((page-1)*limit)
            .limit(limit)

        res.render('users',{
            users,
            search,
            page,
            limit,
            totalCustomers,
            totalUsers,
            totalPages,
            activeAccounts,
            status
        })
        
    } catch (error) {
        console.error('Error loading customers:', error.stack || error);
        res.status(500).render('500');
    }
}


const blockUser = async(req,res) =>{
    try {
        const userId = req.params.id
        if(!mongoose.Types.ObjectId.isValid(userId)){
            return res.status(400).json({
                success: false,
                message: 'Invalid User ID'
            })
        }

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        user.isBlocked = !user.isBlocked
        await user.save()

        return res.status(200).json({
            success: true,
            message: user.isBlocked
                ? 'User blocked successfully.'
                : 'User unblocked successfully.',
            isBlocked: user.isBlocked
        })

    } catch (error) {
        console.error('Error changing customer status:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to update customer status.'
        });
    }
}



module.exports = {
    loadCustomers,
    blockUser
}