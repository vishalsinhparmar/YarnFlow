import { body } from 'express-validator';

export const validateSalesOrder = [
  body('customer')
    .notEmpty()
    .withMessage('Customer is required')
    .isMongoId()
    .withMessage('Invalid customer ID'),

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

  body('items.*.orderedQuantity')
    .isFloat({ min: 0.01 })
    .withMessage('Ordered quantity must be greater than 0'),

  body('items.*.unit')
    .notEmpty()
    .withMessage('Unit is required for each item')
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),

  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('items.*.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),

  body('customerPONumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Customer PO number cannot exceed 50 characters'),

  body('salesPerson')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Sales person name cannot exceed 100 characters'),

  body('paymentTerms')
    .optional()
    .isIn(['Advance', 'COD', 'Net_15', 'Net_30', 'Net_45', 'Net_60'])
    .withMessage('Invalid payment terms'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority level'),

  body('orderType')
    .optional()
    .isIn(['Regular', 'Rush', 'Sample', 'Bulk', 'Export'])
    .withMessage('Invalid order type'),

  body('shippingMethod')
    .optional()
    .isIn(['Standard', 'Express', 'Overnight', 'Pickup'])
    .withMessage('Invalid shipping method'),

  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('shippingCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping charges must be a positive number'),

  body('customerNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Customer notes cannot exceed 1000 characters'),

  body('internalNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Internal notes cannot exceed 1000 characters'),

  body('createdBy')
    .notEmpty()
    .withMessage('Created by is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Created by must be between 1 and 100 characters'),

  // Shipping address validation
  body('shippingAddress.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('shippingAddress.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),

  body('shippingAddress.state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),

  body('shippingAddress.pincode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be exactly 6 characters')
    .isNumeric()
    .withMessage('Pincode must contain only numbers'),

  body('shippingAddress.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters')
];

export const validateSalesOrderUpdate = [
  body('customer')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID'),

  body('expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (value) {
        const deliveryDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deliveryDate < today) {
          throw new Error('Expected delivery date cannot be in the past');
        }
      }
      return true;
    }),

  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one item is required if items are provided'),

  body('items.*.product')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('items.*.orderedQuantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Ordered quantity must be greater than 0'),

  body('items.*.unit')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),

  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('items.*.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),

  body('customerPONumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Customer PO number cannot exceed 50 characters'),

  body('salesPerson')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Sales person name cannot exceed 100 characters'),

  body('paymentTerms')
    .optional()
    .isIn(['Advance', 'COD', 'Net_15', 'Net_30', 'Net_45', 'Net_60'])
    .withMessage('Invalid payment terms'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority level'),

  body('orderType')
    .optional()
    .isIn(['Regular', 'Rush', 'Sample', 'Bulk', 'Export'])
    .withMessage('Invalid order type'),

  body('shippingMethod')
    .optional()
    .isIn(['Standard', 'Express', 'Overnight', 'Pickup'])
    .withMessage('Invalid shipping method'),

  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('shippingCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping charges must be a positive number'),

  body('customerNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Customer notes cannot exceed 1000 characters'),

  body('internalNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Internal notes cannot exceed 1000 characters'),

  body('updatedBy')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Updated by must be between 1 and 100 characters'),

  // Shipping address validation
  body('shippingAddress.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('shippingAddress.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),

  body('shippingAddress.state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),

  body('shippingAddress.pincode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be exactly 6 characters')
    .isNumeric()
    .withMessage('Pincode must contain only numbers'),

  body('shippingAddress.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters')
];

export const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Draft', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'])
    .withMessage('Invalid status value'),

  body('updatedBy')
    .notEmpty()
    .withMessage('Updated by is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Updated by must be between 1 and 100 characters'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

export const validateShipment = [
  body('trackingNumber')
    .notEmpty()
    .withMessage('Tracking number is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tracking number must be between 1 and 100 characters'),

  body('courierCompany')
    .notEmpty()
    .withMessage('Courier company is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Courier company must be between 1 and 100 characters'),

  body('shippedBy')
    .notEmpty()
    .withMessage('Shipped by is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Shipped by must be between 1 and 100 characters'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

export const validateDelivery = [
  body('deliveredBy')
    .notEmpty()
    .withMessage('Delivered by is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Delivered by must be between 1 and 100 characters'),

  body('actualDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid delivery date format'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

export const validateCancellation = [
  body('cancellationReason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Cancellation reason must be between 1 and 500 characters'),

  body('cancelledBy')
    .notEmpty()
    .withMessage('Cancelled by is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Cancelled by must be between 1 and 100 characters'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];
