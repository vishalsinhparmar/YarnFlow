import { body, param, validationResult } from 'express-validator';

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
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

// Validate GRN creation
export const validateGRN = [
  body('purchaseOrder')
    .notEmpty()
    .withMessage('Purchase Order is required')
    .isMongoId()
    .withMessage('Invalid Purchase Order ID'),
    
  body('receiptDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid receipt date format'),
    
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
    
  body('items.*.purchaseOrderItem')
    .notEmpty()
    .withMessage('Purchase Order item reference is required')
    .isMongoId()
    .withMessage('Invalid Purchase Order item ID'),
    
  body('items.*.receivedQuantity')
    .isFloat({ min: 0.01 })
    .withMessage('Received quantity must be greater than 0'),
    
  body('items.*.acceptedQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accepted quantity must be a positive number'),
    
  body('items.*.rejectedQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rejected quantity must be a positive number'),
    
  body('items.*.qualityStatus')
    .optional()
    .isIn(['Pending', 'Approved', 'Rejected', 'Partial'])
    .withMessage('Invalid quality status'),
    
  handleValidationErrors
];

// Validate GRN update
export const validateGRNUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid GRN ID'),
    
  body('receiptDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid receipt date format'),
    
  body('items.*.receivedQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Received quantity must be a positive number'),
    
  body('items.*.acceptedQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accepted quantity must be a positive number'),
    
  body('items.*.rejectedQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rejected quantity must be a positive number'),
    
  body('status')
    .optional()
    .isIn(['Draft', 'Received', 'Under_Review', 'Approved', 'Rejected', 'Completed'])
    .withMessage('Invalid status'),
    
  body('qualityCheckStatus')
    .optional()
    .isIn(['Pending', 'In_Progress', 'Completed', 'Failed'])
    .withMessage('Invalid quality check status'),
    
  handleValidationErrors
];

// Validate status update
export const validateStatusUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid GRN ID'),
    
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Draft', 'Received', 'Under_Review', 'Approved', 'Rejected', 'Completed'])
    .withMessage('Invalid status'),
    
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
    
  handleValidationErrors
];

// Validate GRN approval
export const validateApproval = [
  param('id')
    .isMongoId()
    .withMessage('Invalid GRN ID'),
    
  body('approvedBy')
    .notEmpty()
    .withMessage('Approver information is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Approver name must be between 2 and 100 characters'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
    
  handleValidationErrors
];

// Validate quality check update
export const validateQualityCheck = [
  param('id')
    .isMongoId()
    .withMessage('Invalid GRN ID'),
    
  body('qualityCheckStatus')
    .notEmpty()
    .withMessage('Quality check status is required')
    .isIn(['Pending', 'In_Progress', 'Completed', 'Failed'])
    .withMessage('Invalid quality check status'),
    
  body('qualityCheckBy')
    .notEmpty()
    .withMessage('Quality checker information is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Quality checker name must be between 2 and 100 characters'),
    
  body('qualityRemarks')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Quality remarks cannot exceed 1000 characters'),
    
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
    
  body('items.*.qualityStatus')
    .optional()
    .isIn(['Pending', 'Approved', 'Rejected', 'Partial'])
    .withMessage('Invalid item quality status'),
    
  body('items.*.acceptedQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accepted quantity must be a positive number'),
    
  body('items.*.rejectedQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rejected quantity must be a positive number'),
    
  handleValidationErrors
];

// Custom validation for business rules
export const validateBusinessRules = (req, res, next) => {
  const { items } = req.body;
  
  if (items) {
    for (const item of items) {
      // Check if accepted + rejected <= received
      const accepted = item.acceptedQuantity || 0;
      const rejected = item.rejectedQuantity || 0;
      const received = item.receivedQuantity || 0;
      
      if (accepted + rejected > received) {
        return res.status(400).json({
          success: false,
          message: 'Accepted + Rejected quantity cannot exceed received quantity'
        });
      }
      
      // Check if damage quantity is reasonable
      const damage = item.damageQuantity || 0;
      if (damage > received) {
        return res.status(400).json({
          success: false,
          message: 'Damage quantity cannot exceed received quantity'
        });
      }
    }
  }
  
  next();
};

export default {
  validateGRN,
  validateGRNUpdate,
  validateStatusUpdate,
  validateApproval,
  validateQualityCheck,
  validateBusinessRules
};
