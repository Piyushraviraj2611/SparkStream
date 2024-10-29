import multer from "multer";

// For Local Storing file...
const storage = multer.diskStorage({
    destination: function (req, file, cb) { // cb- call back ( ()=>{})
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
}); 

export const upload = multer({ 
    storage: storage
 });