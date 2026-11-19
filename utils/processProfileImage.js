const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const processProfileImage = async (image) => {
    const uploadDirectory = path.join(__dirname, '../public/uploads/profiles')

    if (!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory, { recursive: true })
    }

    const fileName = `${crypto.randomUUID()}.webp`
    const imagePath = path.join(uploadDirectory, fileName)

    await sharp(image.buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(imagePath)

    return `/uploads/profiles/${fileName}`
}

module.exports = processProfileImage
