const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const processProductImages = async(images)=>{
    const uploadDirectory = path.join(__dirname,'../public/uploads/products')
    if(!fs.existsSync(uploadDirectory)){
        fs.mkdirSync(uploadDirectory,{recursive:true})
    }
    const productImagePaths = []
    for(const image of images){
        const fileName = `${crypto.randomUUID()}.webp`
        const imagePath = path.join(uploadDirectory,fileName)
        await sharp(image.buffer)
            .resize(800,1067,{fit:'cover'})
            .webp({quality:80})
            .toFile(imagePath)
        productImagePaths.push(`/uploads/products/${fileName}`)
    }
    return productImagePaths
}

module.exports = processProductImages