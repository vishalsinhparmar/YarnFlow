const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const getLotAvailableQuantity = (lot) =>
  Math.max(0, toNumber(lot.currentQuantity) - toNumber(lot.reservedQuantity));

export const getLotUnitWeight = (lot) => {
  // CRITICAL FIX: Use receivedQuantity (original, immutable), NOT currentQuantity (decreasing)
  // Weight per unit must be constant throughout the lot's lifecycle
  // 
  // WRONG: totalWeight / currentQuantity (changes as stock is deducted)
  // RIGHT: totalWeight / receivedQuantity (constant, original quantity)
  //
  // Example: 100 Bags / 5000 KG = 50 KG/bag (always, even after deducting 50 bags)
  
  const receivedQuantity = toNumber(lot.receivedQuantity);
  const totalWeight = toNumber(lot.totalWeight);
  
  // Prevent division by zero
  if (receivedQuantity <= 0) return 0;
  
  return totalWeight / receivedQuantity;
};

export const getLotAvailableWeight = (lot) => {
  const availableQuantity = getLotAvailableQuantity(lot);
  
  // For sub-products: sum the actual individual weights
  if (Array.isArray(lot.subProductWeights) && lot.subProductWeights.length > 0) {
    return lot.subProductWeights
      .slice(0, Math.floor(availableQuantity))
      .reduce((sum, weight) => sum + toNumber(weight), 0);
  }

  // For regular products: use correct weight per unit (now fixed in getLotUnitWeight)
  return availableQuantity * getLotUnitWeight(lot);
};

export const getChallanIssueTotals = (challanItem) => {
  const quantity = toNumber(challanItem.dispatchQuantity);
  
  // SINGLE SOURCE OF TRUTH: Use user-entered weight from challan item
  // NEVER calculate, average, or assume weight based on subProductWeights
  // The user enters the actual weight being dispatched - trust it
  const weight = toNumber(challanItem.weight);
  
  // CRITICAL VALIDATION: Weight must be provided and valid
  if (quantity > 0 && weight <= 0) {
    const error = new Error(
      `Invalid challan item: quantity ${quantity} ${challanItem.unit || 'units'} but weight ${weight} kg. ` +
      `Weight must be > 0 when quantity > 0.`
    );
    error.statusCode = 400;
    throw error;
  }
  
  return { quantity, weight };
};

export const getSalesOrderItemDispatchStates = (challans) => {
  const dispatchStates = {};

  challans.forEach((challan) => {
    (challan.items || []).forEach((item) => {
      const key = item.salesOrderItem.toString();
      if (!dispatchStates[key]) {
        dispatchStates[key] = {
          salesOrderItem: item.salesOrderItem,
          product: item.product,
          productName: item.productName,
          totalDispatched: 0,
          manuallyCompleted: false,
          unit: item.unit
        };
      }

      dispatchStates[key].totalDispatched += toNumber(item.dispatchQuantity);
      dispatchStates[key].manuallyCompleted ||= item.manuallyCompleted === true;
    });
  });

  return dispatchStates;
};
