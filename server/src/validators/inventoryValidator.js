import { body, param, query } from 'express-validator';

// ============ INVENTORY VALIDATORS ============

export const inventoryValidators = {
  // Validate inventory lot update
  updateLot: [
    param('id')
      .isMongoId()
      .withMessage('Invalid inventory lot ID'),
    
    body('currentQuantity')
      .optional()
      .isNumeric()
      .withMessage('Current quantity must be a number')
      .isFloat({ min: 0 })
      .withMessage('Current quantity must be non-negative'),
    
    body('reservedQuantity')
      .optional()
      .isNumeric()
      .withMessage('Reserved quantity must be a number')
      .isFloat({ min: 0 })
      .withMessage('Reserved quantity must be non-negative'),
    
    body('unitCost')
      .optional()
      .isNumeric()
      .withMessage('Unit cost must be a number')
      .isFloat({ min: 0 })
      .withMessage('Unit cost must be non-negative'),
    
    body('status')
      .optional()
      .isIn(['Active', 'Reserved', 'Consumed', 'Expired', 'Damaged', 'Returned'])
      .withMessage('Invalid status'),
    
    body('qualityStatus')
      .optional()
      .isIn(['Approved', 'Rejected', 'Under_Review', 'Quarantine'])
      .withMessage('Invalid quality status'),
    
    body('qualityGrade')
      .optional()
      .isIn(['A', 'B', 'C', 'Reject'])
      .withMessage('Invalid quality grade'),
    
    body('warehouse')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Warehouse name must be 1-100 characters'),
    
    body('location.zone')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Zone must be max 50 characters'),
    
    body('location.rack')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Rack must be max 50 characters'),
    
    body('location.shelf')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Shelf must be max 50 characters'),
    
    body('location.bin')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Bin must be max 50 characters'),
    
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiry date format'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be max 1000 characters'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be 1-50 characters')
  ],

  // Validate stock movement
  stockMovement: [
    param('id')
      .isMongoId()
      .withMessage('Invalid inventory lot ID'),
    
    body('type')
      .notEmpty()
      .withMessage('Movement type is required')
      .isIn(['Received', 'Reserved', 'Issued', 'Returned', 'Adjusted', 'Transferred', 'Damaged'])
      .withMessage('Invalid movement type'),
    
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isNumeric()
      .withMessage('Quantity must be a number')
      .isFloat({ min: 0.01 })
      .withMessage('Quantity must be greater than 0'),
    
    body('reference')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Reference must be max 100 characters'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be max 500 characters'),
    
    body('performedBy')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Performed by must be 1-100 characters')
  ],

  // Validate stock transfer
  stockTransfer: [
    body('fromLotId')
      .notEmpty()
      .withMessage('Source lot ID is required')
      .isMongoId()
      .withMessage('Invalid source lot ID'),
    
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isNumeric()
      .withMessage('Quantity must be a number')
      .isFloat({ min: 0.01 })
      .withMessage('Quantity must be greater than 0'),
    
    body('transferType')
      .notEmpty()
      .withMessage('Transfer type is required')
      .isIn(['lot-to-lot', 'location-change'])
      .withMessage('Invalid transfer type'),
    
    body('toLotId')
      .if(body('transferType').equals('lot-to-lot'))
      .notEmpty()
      .withMessage('Destination lot ID is required for lot-to-lot transfer')
      .isMongoId()
      .withMessage('Invalid destination lot ID'),
    
    body('newLocation')
      .if(body('transferType').equals('location-change'))
      .notEmpty()
      .withMessage('New location is required for location change'),
    
    body('newLocation.zone')
      .if(body('transferType').equals('location-change'))
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Zone must be max 50 characters'),
    
    body('newLocation.rack')
      .if(body('transferType').equals('location-change'))
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Rack must be max 50 characters'),
    
    body('newLocation.shelf')
      .if(body('transferType').equals('location-change'))
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Shelf must be max 50 characters'),
    
    body('newLocation.bin')
      .if(body('transferType').equals('location-change'))
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Bin must be max 50 characters'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be max 500 characters'),
    
    body('performedBy')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Performed by must be 1-100 characters')
  ],

  // Validate query parameters for filtering
  filterLots: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['Active', 'Reserved', 'Consumed', 'Expired', 'Damaged', 'Returned'])
      .withMessage('Invalid status filter'),
    
    query('qualityStatus')
      .optional()
      .isIn(['Approved', 'Rejected', 'Under_Review', 'Quarantine'])
      .withMessage('Invalid quality status filter'),
    
    query('product')
      .optional()
      .isMongoId()
      .withMessage('Invalid product ID'),
    
    query('supplier')
      .optional()
      .isMongoId()
      .withMessage('Invalid supplier ID'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'lotNumber', 'productName', 'currentQuantity', 'expiryDate', 'totalCost'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be 1-100 characters')
  ],

  // Validate alert parameters
  alertParams: [
    query('threshold')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Threshold must be a positive integer'),
    
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ]
};

export default inventoryValidators;
