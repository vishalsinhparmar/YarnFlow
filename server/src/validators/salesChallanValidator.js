import { body, validationResult } from 'express-validator';

// Validation for creating sales challan
export const validateSalesChallan = [
  body('salesOrderId')
    .notEmpty()
    .withMessage('Sales Order ID is required')
    .isMongoId()
    .withMessage('Invalid Sales Order ID format'),
  
  body('deliveryAddress.street')
    .notEmpty()
    .withMessage('Delivery street address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('deliveryAddress.city')
    .notEmpty()
    .withMessage('Delivery city is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('deliveryAddress.state')
    .notEmpty()
    .withMessage('Delivery state is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('deliveryAddress.pincode')
    .notEmpty()
    .withMessage('Delivery pincode is required')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Invalid pincode format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.salesOrderItemId')
    .notEmpty()
    .withMessage('Sales order item ID is required')
    .isMongoId()
    .withMessage('Invalid sales order item ID format'),
  
  body('items.*.dispatchQuantity')
    .isFloat({ min: 0.01 })
    .withMessage('Dispatch quantity must be greater than 0'),
  
  body('transportDetails.vehicleType')
    .optional()
    .isIn(['Truck', 'Tempo', 'Van', 'Car', 'Bike', 'Other'])
    .withMessage('Invalid vehicle type'),
  
  body('expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expected delivery date format'),
  
  body('createdBy')
    .notEmpty()
    .withMessage('Created by is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Created by must be between 2 and 50 characters'),
  
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation for updating sales challan
export const validateChallanUpdate = [
  body('deliveryAddress.street')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('deliveryAddress.city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('deliveryAddress.state')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('deliveryAddress.pincode')
    .optional()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Invalid pincode format'),
  
  body('transportDetails.vehicleNumber')
    .optional()
    .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage('Invalid vehicle number format'),
  
  body('transportDetails.driverPhone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid driver phone number'),
  
  body('transportDetails.vehicleType')
    .optional()
    .isIn(['Truck', 'Tempo', 'Van', 'Car', 'Bike', 'Other'])
    .withMessage('Invalid vehicle type'),
  
  body('deliveryDetails.expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expected delivery date format'),
  
  body('updatedBy')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Updated by must be between 2 and 50 characters'),
  
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation for status update
export const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Prepared', 'Packed', 'Dispatched', 'In_Transit', 'Out_for_Delivery', 'Delivered', 'Returned', 'Cancelled'])
    .withMessage('Invalid status value'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('updatedBy')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Updated by must be between 2 and 50 characters'),
  
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation for delivery confirmation
export const validateDeliveryConfirmation = [
  body('receivedBy')
    .notEmpty()
    .withMessage('Received by is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Received by must be between 2 and 100 characters'),
  
  body('receivedByDesignation')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Designation cannot exceed 50 characters'),
  
  body('receivedByPhone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number'),
  
  body('deliveryNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Delivery notes cannot exceed 500 characters'),
  
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation for transport details update
export const validateTransportUpdate = [
  body('vehicleNumber')
    .optional()
    .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage('Invalid vehicle number format'),
  
  body('driverName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Driver name must be between 2 and 100 characters'),
  
  body('driverPhone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid driver phone number'),
  
  body('transporterName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Transporter name must be between 2 and 100 characters'),
  
  body('freightCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Freight charges must be a positive number'),
  
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];
