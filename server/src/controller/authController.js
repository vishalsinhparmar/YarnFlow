 import bcrypt from 'bcryptjs';
 import jwt from 'jsonwebtoken';
 import User from '../models/user.model.js';
 
 const JWT_SECRET = process.env.JWT_SECRET || 'yarnflow_dev_secret';
 
 export const register = async (req, res) => {
   try {
     const { email, password, role } = req.body;
 
     if (!email || !password) {
       return res.status(400).json({ success: false, message: 'email and password are required' });
     }
 
     const existing = await User.findOne({ email });
     if (existing) {
       return res.status(409).json({ success: false, message: 'email already registered' });
     }
 
     const hash = await bcrypt.hash(password, 10);
     const user = await User.create({ email, password: hash, role: role || undefined });
 
     const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
 
     return res.status(201).json({
       success: true,
       data: { id: user._id, email: user.email, role: user.role },
       token
     });
   } catch (err) {
     return res.status(500).json({ success: false, message: 'registration failed', error: err.message });
   }
 };
 
 export const login = async (req, res) => {
   try {
     const { email, password } = req.body;
 
     if (!email || !password) {
       return res.status(400).json({ success: false, message: 'email and password are required' });
     }
 
     const user = await User.findOne({ email });
     if (!user) {
       return res.status(401).json({ success: false, message: 'invalid credentials' });
     }
 
     const ok = await bcrypt.compare(password, user.password);
     if (!ok) {
       return res.status(401).json({ success: false, message: 'invalid credentials' });
     }
 
     const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
 
     return res.json({
       success: true,
       data: { id: user._id, email: user.email, role: user.role },
       token
     });
   } catch (err) {
     return res.status(500).json({ success: false, message: 'login failed', error: err.message });
   }
 };
