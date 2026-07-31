const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const getLotAvailableQuantity = (lot) =>
  Math.max(0, toNumber(lot.currentQuantity) - toNumber(lot.reservedQuantity));

export const getLotUnitWeight = (lot) => {
  const currentQuantity = toNumber(lot.currentQuantity);
  return currentQuantity > 0 ? toNumber(lot.totalWeight) / currentQuantity : 0;
};

export const getLotAvailableWeight = (lot) => {
  const availableQuantity = getLotAvailableQuantity(lot);
  if (Array.isArray(lot.subProductWeights) && lot.subProductWeights.length > 0) {
    return lot.subProductWeights
      .slice(0, Math.floor(availableQuantity))
      .reduce((sum, weight) => sum + toNumber(weight), 0);
  }

  return availableQuantity * getLotUnitWeight(lot);
};

export const getChallanIssueTotals = (challanItem) => ({
  quantity: toNumber(challanItem.dispatchQuantity),
  weight:
    Array.isArray(challanItem.subProductWeights) && challanItem.subProductWeights.length > 0
      ? challanItem.subProductWeights.reduce((sum, weight) => sum + toNumber(weight), 0)
      : toNumber(challanItem.weight)
});

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
