import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is not set');
}
const SECRET = JWT_SECRET || 'yarnflow_dev_secret_change_in_production';

const serviceUnavailable = (res) => res.status(503).json({
  success: false,
  code: 'SERVICE_UNAVAILABLE',
  message: 'YarnFlow is temporarily unavailable. Please try again in a few minutes.',
  retryable: true,
});

const internalError = (res) => res.status(500).json({
  success: false,
  code: 'INTERNAL_ERROR',
  message: 'We could not complete your request. Please try again later.',
  retryable: true,
});

export const register = async (req, res) => {
  try {
    const { password, role } = req.body || {};
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters.',
      });
    }

    let existing;
    try {
      existing = await User.findOne({ email });
    } catch (error) {
      logger.error('Registration database lookup failed:', error);
      return serviceUnavailable(res);
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account with this email address already exists.',
      });
    }

    const hash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await User.create({ email, password: hash, role: role || undefined });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email address already exists.',
        });
      }

      if (error?.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Please check the account details and try again.',
        });
      }

      logger.error('Registration database write failed:', error);
      return serviceUnavailable(res);
    }

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      data: { id: user._id, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    logger.error('Unexpected registration failure:', err);
    return internalError(res);
  }
};

export const login = async (req, res) => {
  try {
    const { password } = req.body || {};
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      });
    }

    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbErr) {
      logger.error('Login database lookup failed:', dbErr);
      return serviceUnavailable(res);
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password you entered is incorrect.',
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password you entered is incorrect.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DISABLED',
        message: 'This account is disabled. Contact your system administrator.',
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      data: { id: user._id, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    logger.error('Unexpected login failure:', err);
    return internalError(res);
  }
};

export const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    logger.error('Token verification failed:', err);
    return internalError(res);
  }
};
