import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, username, email, password, role, mobileAccess } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }
    const existing = await User.findOne({ $or: [{ email }, ...(username ? [{ username }] : [])] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'email or username already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hash, role: role || 'User', mobileAccess: mobileAccess || false });
    const { password: _, ...safe } = user.toObject();
    return res.status(201).json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, password, role, isActive, mobileAccess } = req.body;

    const updateFields = { name, username, email, role, isActive, mobileAccess };
    Object.keys(updateFields).forEach(k => updateFields[k] === undefined && delete updateFields[k]);

    if (password && password.trim()) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    if (email || username) {
      const conflict = await User.findOne({
        _id: { $ne: id },
        $or: [
          ...(email    ? [{ email }]    : []),
          ...(username ? [{ username }] : [])
        ]
      });
      if (conflict) return res.status(409).json({ success: false, message: 'email or username already used by another user' });
    }

    const user = await User.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hash }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
