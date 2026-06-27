import mongoose from "mongoose";
import { MONGODB_URI } from "../configs/index.js";

export const connectDB = async() => {
    try{
        await mongoose.connect(MONGODB_URI);
        console.log("Connect to MongoDB");
    } catch(e){
        console.error("MongoDB error: ",e);
        process.exit(1);
    }
}