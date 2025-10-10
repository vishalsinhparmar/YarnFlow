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

// Validate Purchase Order creation
export const validatePurchaseOrder = [
  body('supplier')
    .notEmpty()
    .withMessage('Supplier is required')
    .isMongoId()
    .withMessage('Invalid supplier ID'),
    
  body('expectedDeliveryDate')
    .notEmpty()
    .withMessage('Expected delivery date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const deliveryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        throw new Error('Expected delivery date cannot be in the past');
      }
      return true;
    }),
    
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
    
  body('items.*.product')
    .notEmpty()
    .withMessage('Product is required for each item')
    .isMongoId()
    .withMessage('Invalid product ID'),
    
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
    
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
    
  body('items.*.unit')
    .optional()
    .isIn(['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'])
    .withMessage('Invalid unit type'),
    
  body('items.*.deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid delivery date format'),
    
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
    
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be positive'),
    
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority level'),
    
  body('shippingMethod')
    .optional()
    .isIn(['Pickup', 'Courier', 'Transport', 'Own_Vehicle'])
    .withMessage('Invalid shipping method'),
    
  body('paymentTerms')
    .optional()
    .isIn(['Advance', 'Cash_on_Delivery', 'Credit_15', 'Credit_30', 'Credit_45', 'Credit_60'])
    .withMessage('Invalid payment terms'),
    
  body('deliveryAddress.pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
    
  handleValidationErrors
];

// Validate Purchase Order update
export const validatePurchaseOrderUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid purchase order ID'),
    
  body('supplier')
    .optional()
    .isMongoId()
    .withMessage('Invalid supplier ID'),
    
  body('expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
    
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one item is required if items are provided'),
    
  body('items.*.product')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
    
  body('items.*.quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
    
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
    
  body('status')
    .optional()
    .isIn(['Draft', 'Sent', 'Acknowledged', 'Approved', 'Partially_Received', 'Fully_Received', 'Cancelled', 'Closed'])
    .withMessage('Invalid status'),
    
  body('approvalStatus')
    .optional()
    .isIn(['Pending', 'Approved', 'Rejected'])
    .withMessage('Invalid approval status'),
    
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
    
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be positive'),
    
  handleValidationErrors
];

// Validate status update
export const validateStatusUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid purchase order ID'),
    
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Draft', 'Sent', 'Acknowledged', 'Approved', 'Partially_Received', 'Fully_Received', 'Cancelled', 'Closed'])
    .withMessage('Invalid status'),
    
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
    
  handleValidationErrors
];

// Validate goods receipt
export const validateGoodsReceipt = [
  param('id')
    .isMongoId()
    .withMessage('Invalid purchase order ID'),
    
  body('receivedItems')
    .isArray({ min: 1 })
    .withMessage('At least one received item is required'),
    
  body('receivedItems.*.itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID'),
    
  body('receivedItems.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Received quantity must be greater than 0'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
    
  handleValidationErrors
];

// Validate PO approval
export const validateApproval = [
  param('id')
    .isMongoId()
    .withMessage('Invalid purchase order ID'),
    
  body('approvalStatus')
    .notEmpty()
    .withMessage('Approval status is required')
    .isIn(['Approved', 'Rejected'])
    .withMessage('Approval status must be either Approved or Rejected'),
    
  body('approvedBy')
    .notEmpty()
    .withMessage('Approver information is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Approver name must be between 2 and 100 characters'),
    
  body('rejectionReason')
    .if(body('approvalStatus').equals('Rejected'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters'),
    
  handleValidationErrors
];

// Custom validation for business rules
export const validateBusinessRules = (req, res, next) => {
  const { items, expectedDeliveryDate } = req.body;
  
  // Check if all item delivery dates are before or equal to expected delivery date
  if (items && expectedDeliveryDate) {
    const expectedDate = new Date(expectedDeliveryDate);
    
    for (const item of items) {
      if (item.deliveryDate) {
        const itemDeliveryDate = new Date(item.deliveryDate);
        if (itemDeliveryDate > expectedDate) {
          return res.status(400).json({
            success: false,
            message: 'Item delivery date cannot be later than expected delivery date'
          });
        }
      }
    }
  }
  
  next();
};

export default {
  validatePurchaseOrder,
  validatePurchaseOrderUpdate,
  validateStatusUpdate,
  validateGoodsReceipt,
  validateApproval,
  validateBusinessRules
};
