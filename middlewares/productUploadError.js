const multer = require('multer')

const productUploadError = (error,req,res,next)=>{
    if(error instanceof multer.MulterError){
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
    if(error.message === 'Only JPG, PNG and WebP images are allowed.'){
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
    next(error)
}
module.exports = productUploadError