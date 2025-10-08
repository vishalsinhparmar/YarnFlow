import mongoose from "mongoose";

const dbURI ="mongodb://localhost:27017/"
const connectDB = async () =>{
    try{
       await mongoose.connect(dbURI);
       console.log("db connectes successfully")
    }catch(err){
      console.log('error happen with db connection',err.message)
    }
};

export default connectDB;