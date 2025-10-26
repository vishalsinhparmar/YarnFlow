import { body, validationResult } from 'express-validator';

// Validation middleware to handle errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Customer validation rules - Simplified for new form
export const validateCustomer = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('gstNumber')
    .optional()
    .trim()
    .isLength({ min: 15, max: 15 })
    .withMessage('GST number must be exactly 15 characters')
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number format'),
  
  body('panNumber')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('PAN number must be exactly 10 characters')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Please provide a valid PAN number format'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Supplier validation rules - Simplified for new form
export const validateSupplier = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('gstNumber')
    .optional()
    .trim()
    .custom((value) => {
      if (value && value.length > 0) {
        if (value.length !== 15) {
          throw new Error('GST number must be exactly 15 characters');
        }
        // More flexible GST format validation for production
        if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(value)) {
          throw new Error('GST number format is invalid');
        }
      }
      return true;
    }),
  
  body('panNumber')
    .optional()
    .trim()
    .custom((value) => {
      if (value && value.length > 0) {
        if (value.length !== 10) {
          throw new Error('PAN number must be exactly 10 characters');
        }
        // Flexible PAN format validation for production
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
          throw new Error('PAN number format is invalid');
        }
      }
      return true;
    }),
  
  body('city')
    .optional()
    .trim()
    .custom((value) => {
      if (value && value.length > 0 && (value.length < 2 || value.length > 50)) {
        throw new Error('City must be between 2 and 50 characters');
      }
      return true;
    }),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Product validation rules - Simplified for new form
export const validateProduct = [
  body('productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('category')
    .isMongoId()
    .withMessage('Please provide a valid category ID'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Category validation rules - Simplified for new form
export const validateCategory = [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Update validation rules (make fields optional)
export const validateCustomerUpdate = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  
  body('gstNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number'),
  
  handleValidationErrors
];

export const validateSupplierUpdate = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  
  // supplierType removed
  // rating removed
  
  handleValidationErrors
];
