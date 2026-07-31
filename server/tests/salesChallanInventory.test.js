import { expect } from 'chai';
import {
  getChallanIssueTotals,
  getLotAvailableQuantity,
  getLotAvailableWeight,
  getLotUnitWeight,
  getSalesOrderItemDispatchStates
} from '../src/utils/salesChallanInventory.js';
import SalesOrder from '../src/models/SalesOrder.js';

describe('Sales challan inventory calculations', () => {
  it('uses the remaining quantity when calculating plain-product weight', () => {
    const remainingLot = {
      receivedQuantity: 10,
      currentQuantity: 3,
      reservedQuantity: 0,
      totalWeight: 15
    };

    expect(getLotAvailableQuantity(remainingLot)).to.equal(3);
    expect(getLotUnitWeight(remainingLot)).to.equal(5);
    expect(getLotAvailableWeight(remainingLot)).to.equal(15);
  });

  it('calculates issue totals from only the current challan item', () => {
    const currentChallanItem = {
      dispatchQuantity: 3,
      weight: 15,
      subProductWeights: []
    };

    expect(getChallanIssueTotals(currentChallanItem)).to.deep.equal({
      quantity: 3,
      weight: 15
    });
  });

  it('preserves exact sub-product weights for availability and issue totals', () => {
    const lot = {
      currentQuantity: 3,
      reservedQuantity: 1,
      totalWeight: 60,
      subProductWeights: [11.25, 12.5, 13.75]
    };
    const challanItem = {
      dispatchQuantity: 2,
      weight: 999,
      subProductWeights: [11.25, 12.5]
    };

    expect(getLotAvailableWeight(lot)).to.equal(23.75);
    expect(getChallanIssueTotals(challanItem)).to.deep.equal({
      quantity: 2,
      weight: 23.75
    });
  });

  it('keeps manual completion separate for each item in a mixed sales order', () => {
    const completedItemId = '507f1f77bcf86cd799439021';
    const pendingItemId = '507f1f77bcf86cd799439022';
    const dispatchStates = getSalesOrderItemDispatchStates([
      {
        items: [
          {
            salesOrderItem: completedItemId,
            productName: '10 No Punjab',
            dispatchQuantity: 55,
            manuallyCompleted: true,
            unit: 'Bags'
          },
          {
            salesOrderItem: pendingItemId,
            productName: '10 No Multi',
            dispatchQuantity: 20,
            manuallyCompleted: false,
            unit: 'Rolls'
          }
        ]
      }
    ]);

    expect(dispatchStates[completedItemId]).to.include({
      totalDispatched: 55,
      manuallyCompleted: true
    });
    expect(dispatchStates[pendingItemId]).to.include({
      totalDispatched: 20,
      manuallyCompleted: false
    });
  });
});

describe('Sales order manual dispatch completion', () => {
  it('marks the item final without inflating its dispatched quantity', () => {
    const salesOrder = new SalesOrder({
      customer: '507f1f77bcf86cd799439011',
      customerName: 'Test Customer',
      category: '507f1f77bcf86cd799439012',
      createdBy: 'Test',
      status: 'Processing',
      items: [{
        product: '507f1f77bcf86cd799439013',
        productName: '10 No Panipat',
        quantity: 10,
        unit: 'Bags',
        weight: 50
      }]
    });
    const salesOrderItem = salesOrder.items[0]._id;

    salesOrder.updateDispatchStatus([
      {
        items: [{
          salesOrderItem,
          dispatchQuantity: 7,
          weight: 35,
          manuallyCompleted: false
        }]
      },
      {
        items: [{
          salesOrderItem,
          dispatchQuantity: 1,
          weight: 5,
          manuallyCompleted: true
        }]
      }
    ]);

    expect(salesOrder.status).to.equal('Delivered');
    expect(salesOrder.items[0].deliveredQuantity).to.equal(8);
    expect(salesOrder.items[0].manuallyCompleted).to.equal(true);
  });
});
