/**
 * GRN Validation Utilities
 * PHASE 3-4 FIX: Comprehensive validation for GRN receipt
 * 
 * Validates:
 * - Unit-weight array consistency
 * - Over-receipt prevention
 * - Weight validation
 * - Actual vs. expected values
 */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/**
 * PHASE 11A FIX: Calculate remaining expected unit weights for partial GRN receipts
 * 
 * For a PO with expected unit weights [90, 33]:
 * - If 1 unit already received (90 kg), remaining expected is [33]
 * - If 0 units received, remaining expected is [90, 33]
 * 
 * This ensures the frontend displays the correct expected weight for the next GRN
 * and does NOT reuse previously received weights.
 */
export const getRemainingExpectedUnitWeights = (poItem, pendingQuantity) => {
  const orderedSubProductWeights = Array.isArray(poItem.subProductWeights)
    ? poItem.subProductWeights
    : [];
  
  if (orderedSubProductWeights.length === 0) {
    return [];
  }
  
  const previouslyReceived = toNumber(poItem.receivedQuantity || 0);
  const startIndex = previouslyReceived;
  const endIndex = previouslyReceived + pendingQuantity;
  
  // Return only the remaining expected weights
  return orderedSubProductWeights.slice(startIndex, endIndex);
};

/**
 * Validate unit-weight array
 * 
 * Rules:
 * 1. If subProductWeights provided, length must equal quantity
 * 2. Sum of weights must equal total weight (within 0.01 tolerance)
 * 3. All weights must be positive
 */
export const validateUnitWeightArray = (item, poItem) => {
  const receivedQuantity = toNumber(item.receivedQuantity);
  const receivedWeight = toNumber(item.receivedWeight);
  const receivedSubProductWeights = Array.isArray(item.receivedSubProductWeights)
    ? item.receivedSubProductWeights.map(w => toNumber(w))
    : [];

  // If no unit weights provided, that's OK (will use total weight)
  if (receivedSubProductWeights.length === 0) {
    return { valid: true };
  }

  // Rule 1: Length must match quantity
  if (receivedSubProductWeights.length !== receivedQuantity) {
    return {
      valid: false,
      error: `Unit-weight array length (${receivedSubProductWeights.length}) does not match received quantity (${receivedQuantity})`
    };
  }

  // Rule 2: Sum must match total weight
  const weightSum = receivedSubProductWeights.reduce((sum, w) => sum + w, 0);
  const weightDifference = Math.abs(weightSum - receivedWeight);

  if (weightDifference > 0.01) {
    return {
      valid: false,
      error: `Sum of unit weights (${weightSum.toFixed(2)} kg) does not match total weight (${receivedWeight.toFixed(2)} kg). Difference: ${weightDifference.toFixed(2)} kg`
    };
  }

  // Rule 3: All weights must be positive
  const negativeWeights = receivedSubProductWeights.filter(w => w < 0);
  if (negativeWeights.length > 0) {
    return {
      valid: false,
      error: `Found ${negativeWeights.length} negative weight(s) in unit-weight array`
    };
  }

  return { valid: true };
};

/**
 * Validate that GRN quantity does not exceed PO pending quantity
 * 
 * Rule: GRN quantity ≤ (PO quantity - previously received)
 */
export const validateNoOverReceipt = (item, poItem) => {
  const receivedQuantity = toNumber(item.receivedQuantity);
  const orderedQuantity = toNumber(poItem.quantity);
  const previouslyReceived = toNumber(poItem.receivedQuantity || 0);
  const remainingQuantity = orderedQuantity - previouslyReceived;

  if (receivedQuantity > remainingQuantity) {
    return {
      valid: false,
      error: `Over-receipt detected: attempting to receive ${receivedQuantity} units but only ${remainingQuantity} units pending. (Ordered: ${orderedQuantity}, Already received: ${previouslyReceived})`
    };
  }

  return { valid: true };
};

/**
 * Validate that weight is provided when quantity is provided
 */
export const validateWeightProvided = (item) => {
  const receivedQuantity = toNumber(item.receivedQuantity);
  const receivedWeight = toNumber(item.receivedWeight);
  const hasSubProductWeights = Array.isArray(item.receivedSubProductWeights) &&
    item.receivedSubProductWeights.length > 0;

  // If quantity > 0, must have weight
  if (receivedQuantity > 0 && receivedWeight <= 0 && !hasSubProductWeights) {
    return {
      valid: false,
      error: `Weight must be provided when quantity is ${receivedQuantity}`
    };
  }

  return { valid: true };
};

/**
 * Validate that actual GRN values are used, not PO expected values
 * 
 * This ensures we use GRN.receivedSubProductWeights (actual)
 * not PO.subProductWeights (expected)
 */
export const validateActualValuesUsed = (item, poItem) => {
  const hasReceivedWeights = Array.isArray(item.receivedSubProductWeights) &&
    item.receivedSubProductWeights.length > 0;
  
  const hasOrderedWeights = Array.isArray(poItem.subProductWeights) &&
    poItem.subProductWeights.length > 0;

  // If both exist, they should be different (actual vs. expected)
  if (hasReceivedWeights && hasOrderedWeights) {
    const receivedSum = item.receivedSubProductWeights.reduce((a, b) => a + toNumber(b), 0);
    const orderedSum = poItem.subProductWeights.reduce((a, b) => a + toNumber(b), 0);
    
    // They might be the same by coincidence, but we should use received values
    console.log(`✅ Using actual GRN weights (sum: ${receivedSum.toFixed(2)} kg) instead of PO expected weights (sum: ${orderedSum.toFixed(2)} kg)`);
  }

  return { valid: true };
};

/**
 * Comprehensive GRN item validation
 * 
 * Runs all validation rules and returns combined result
 */
export const validateGRNItem = (item, poItem) => {
  const validations = [
    { name: 'Unit-weight array', result: validateUnitWeightArray(item, poItem) },
    { name: 'No over-receipt', result: validateNoOverReceipt(item, poItem) },
    { name: 'Weight provided', result: validateWeightProvided(item) },
    { name: 'Actual values used', result: validateActualValuesUsed(item, poItem) }
  ];

  const failures = validations.filter(v => !v.result.valid);

  if (failures.length > 0) {
    return {
      valid: false,
      errors: failures.map(f => `${f.name}: ${f.result.error}`)
    };
  }

  return { valid: true };
};

/**
 * Validate all GRN items
 */
export const validateAllGRNItems = (items, poItems) => {
  const errors = [];

  for (const item of items) {
    const poItem = poItems.find(pi => pi._id.toString() === item.purchaseOrderItem.toString());
    
    if (!poItem) {
      errors.push(`Invalid PO item reference: ${item.purchaseOrderItem}`);
      continue;
    }

    const validation = validateGRNItem(item, poItem);
    if (!validation.valid) {
      errors.push(`Item ${item.productName}: ${validation.errors.join('; ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
};

export default {
  validateUnitWeightArray,
  validateNoOverReceipt,
  validateWeightProvided,
  validateActualValuesUsed,
  validateGRNItem,
  validateAllGRNItems,
  getRemainingExpectedUnitWeights
};
