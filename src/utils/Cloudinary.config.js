import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (imagePath)=>{
    try {
        if(!imagePath) return null;
        const response = await cloudinary.uploader.upload(imagePath,{
            resource_type : "auto",
            folder : "youtube_backend"
        });
        fs.unlinkSync(imagePath)
        return response
    } catch (error) {
        fs.unlinkSync(imagePath);
        return null;
    }
}

export {uploadImage};