import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name:    { type: String, trim: true, default: '' },
  username:{ type: String, trim: true, unique: true, sparse: true },
  email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:{ type: String, required: true },
  role:    { type: String, enum: ['Admin', 'User'], default: 'User' },
  isActive:{ type: Boolean, default: true },
  mobileAccess: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

export default User;