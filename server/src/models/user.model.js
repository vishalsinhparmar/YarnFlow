import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email:{
    type:String,
    required:true,
    unique:true
  },
   password:{
    type:String,
    required:true
  },
  role:{
    type:String,
    enum:["Admin","User"],
    default:"Admin"
  }
},{timestamps:true});

const  User = mongoose.model("User",UserSchema);

export default User;