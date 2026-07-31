import { expect } from 'chai';
import { dashboardInternals } from '../src/controller/dashboardController.js';

describe('Dashboard controller helpers', () => {
  it('fills a six-month stock flow without inventing movement values', () => {
    const rows = dashboardInternals.mergeMonthlyFlow(
      new Date('2026-07-30T00:00:00.000Z'),
      [{ _id: { year: 2026, month: 7 }, weight: 250, quantity: 5 }],
      [{ _id: { year: 2026, month: 7 }, weight: 200, quantity: 4 }]
    );

    expect(rows).to.have.length(6);
    expect(rows.at(-1)).to.include({
      month: 'Jul',
      year: 2026,
      receivedWeight: 250,
      dispatchedWeight: 200,
      receivedQuantity: 5,
      dispatchedQuantity: 4
    });
    expect(rows[0].receivedWeight).to.equal(0);
  });

  it('sorts mixed document activity using persisted timestamps', () => {
    const rows = dashboardInternals.buildRecentActivities({
      purchaseOrders: [{
        _id: 'po-1',
        poNumber: 'PKRK/PO/001',
        status: 'Draft',
        createdAt: new Date('2026-07-28T10:00:00.000Z')
      }],
      grns: [{
        _id: 'grn-1',
        grnNumber: 'PKRK/GRN/001',
        status: 'Complete',
        createdAt: new Date('2026-07-30T10:00:00.000Z')
      }],
      salesOrders: [],
      challans: []
    });

    expect(rows[0].reference).to.equal('PKRK/GRN/001');
    expect(rows[0].status).to.equal('success');
    expect(rows[1].reference).to.equal('PKRK/PO/001');
    expect(rows[1].status).to.equal('warning');
  });
});
