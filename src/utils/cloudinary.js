// Take file from user through multer(middleWare) and 
//store locally then store on cloudinary through multer.

import { v2 as cloudinary } from "cloudinary"
import { response } from "express";
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uplodeOnCloudinary = async (filePathLink) => {
    try {
        if (!filePathLink) return null;
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(filePathLink, {
            resource_type: 'auto'
        })

        //file is uploaded...
        console.log("file is uploaded on cloudinary: ", response.url);
        fs.unlinkSync(filePathLink);
        return response;

    } catch (error) {

        fs.unlinkSync(filePathLink); // remove the locally saved temp file as the upload operation get failed.
        return null;
    }

}

export { uplodeOnCloudinary }
