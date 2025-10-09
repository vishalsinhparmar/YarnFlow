import mongoose from "mongoose";
import logger from "./src/utils/logger.js";

const dbURI ="mongodb://localhost:27017/"
const connectDB = async () =>{
    try{
       await mongoose.connect(dbURI);
       logger.info('db connected successfulyy')
       console.log("db connectes successfully")
    }catch(err){
      console.log('error happen with db connection',err.message)
    }
};

export default connectDB;