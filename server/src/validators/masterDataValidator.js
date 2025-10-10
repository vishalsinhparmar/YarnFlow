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

// Customer validation rules
export const validateCustomer = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('contactPerson')
    .trim()
    .notEmpty()
    .withMessage('Contact person is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Contact person name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('address.pincode')
    .isPostalCode('IN')
    .withMessage('Please provide a valid Indian pincode'),
  

  
  body('creditLimit')
    .optional()
    .isNumeric()
    .withMessage('Credit limit must be a number'),
  
  handleValidationErrors
];

// Supplier validation rules
export const validateSupplier = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('contactPerson')
    .trim()
    .notEmpty()
    .withMessage('Contact person is required'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  
  body('supplierType')
    .isIn(['Cotton Yarn', 'Polyester', 'Blended Yarn', 'Raw Cotton', 'Chemicals', 'Other'])
    .withMessage('Please select a valid supplier type'),
  
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('address.pincode')
    .isPostalCode('IN')
    .withMessage('Please provide a valid Indian pincode'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  handleValidationErrors
];

// Product validation rules
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
  
  body('specifications.yarnCount')
    .trim()
    .notEmpty()
    .withMessage('Yarn count is required'),
  
  body('specifications.material')
    .isIn(['Cotton', 'Polyester', 'Cotton-Polyester', 'Viscose', 'Wool', 'Silk'])
    .withMessage('Please select a valid material'),
  
  body('specifications.packingType')
    .isIn(['Bags', 'Rolls', 'Cones', 'Hanks'])
    .withMessage('Please select a valid packing type'),
  
  body('specifications.standardWeight')
    .isNumeric()
    .withMessage('Standard weight must be a number')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Standard weight must be greater than 0');
      }
      return true;
    }),
  
  body('pricing.basePrice')
    .isNumeric()
    .withMessage('Base price must be a number')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Base price must be greater than 0');
      }
      return true;
    }),
  
  body('pricing.priceUnit')
    .isIn(['Per Kg', 'Per Bag', 'Per Roll', 'Per Piece'])
    .withMessage('Please select a valid price unit'),
  
  body('inventory.reorderLevel')
    .optional()
    .isNumeric()
    .withMessage('Reorder level must be a number'),
  
  handleValidationErrors
];

// Category validation rules
export const validateCategory = [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  
  body('categoryType')
    .isIn(['Cotton Yarn', 'Polyester', 'Blended Yarn', 'Raw Material', 'Finished Goods'])
    .withMessage('Please select a valid category type'),
  
  body('specifications.unit')
    .isIn(['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'])
    .withMessage('Please select a valid unit'),
  
  body('specifications.standardWeight')
    .isNumeric()
    .withMessage('Standard weight must be a number')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Standard weight must be greater than 0');
      }
      return true;
    }),
  
  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid parent category ID'),
  
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
  
  body('supplierType')
    .optional()
    .isIn(['Cotton Yarn', 'Polyester', 'Blended Yarn', 'Raw Cotton', 'Chemicals', 'Other'])
    .withMessage('Please select a valid supplier type'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  handleValidationErrors
];
