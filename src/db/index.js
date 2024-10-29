import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const ConnectDB = async()=>{
    try {
        const mongoDb = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected Succesfully: ${mongoDb.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection Failed: DB/index.js ", error);
        process.exit(1);
    }
}
export default ConnectDB;