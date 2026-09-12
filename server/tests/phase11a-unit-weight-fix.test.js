/**
 * PHASE 11A: Unit Weight Data Fix - Regression Tests
 * 
 * Tests for the fix where previously received unit weights were incorrectly
 * being reused as remaining expected weights in partial GRN receipts.
 * 
 * Example:
 * PO ordered weights: [90, 33]
 * Previous GRN received: 1 bag (90 kg)
 * Next GRN should show remaining expected: [33] NOT [90]
 */

import { expect } from 'chai';
import { getRemainingExpectedUnitWeights } from '../src/utils/grnValidation.js';

describe('PHASE 11A: Unit Weight Data Fix', () => {
  
  describe('getRemainingExpectedUnitWeights', () => {
    
    it('should return remaining expected weights when partial receipt exists', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 1,
        subProductWeights: [90, 33]
      };
      
      const pendingQuantity = 1;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([33]);
      expect(result).to.not.deep.equal([90]);
    });
    
    it('should return all expected weights when no receipt exists', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 0,
        subProductWeights: [90, 33]
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([90, 33]);
    });
    
    it('should return empty array when all units received', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 2,
        subProductWeights: [90, 33]
      };
      
      const pendingQuantity = 0;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([]);
    });
    
    it('should handle multiple partial receipts correctly', () => {
      const poItem = {
        quantity: 4,
        receivedQuantity: 2,
        subProductWeights: [50, 60, 70, 80]
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([70, 80]);
      expect(result).to.not.include(50);
      expect(result).to.not.include(60);
    });
    
    it('should return empty array when no subProductWeights defined', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 0,
        subProductWeights: []
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([]);
    });
    
    it('should handle undefined subProductWeights', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 0
        // subProductWeights is undefined
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([]);
    });
    
    it('should handle partial pending quantity correctly', () => {
      const poItem = {
        quantity: 5,
        receivedQuantity: 2,
        subProductWeights: [10, 20, 30, 40, 50]
      };
      
      // Only requesting 2 more units out of 3 pending
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([30, 40]);
      expect(result.length).to.equal(2);
    });
    
    it('should never return previously received weights', () => {
      const poItem = {
        quantity: 3,
        receivedQuantity: 1,
        subProductWeights: [100, 200, 300]
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      // Should NOT include the first weight (100) which was already received
      expect(result).to.not.include(100);
      expect(result).to.deep.equal([200, 300]);
    });
    
    it('should handle numeric string weights', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 1,
        subProductWeights: ['90', '33']
      };
      
      const pendingQuantity = 1;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal(['33']);
    });
    
    it('should handle mixed numeric and string weights', () => {
      const poItem = {
        quantity: 3,
        receivedQuantity: 1,
        subProductWeights: [50, '60', 70]
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal(['60', 70]);
    });
  });
  
  describe('Regression: Previously received weights should not appear in remaining', () => {
    
    it('GAZE 999 × 8 scenario: 90kg already received, 33kg remaining', () => {
      // Real-world scenario from the bug report
      const poItem = {
        quantity: 2,
        receivedQuantity: 1,
        subProductWeights: [90, 33]
      };
      
      const pendingQuantity = 1;
      const remaining = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      // The bug was that it returned [90] instead of [33]
      expect(remaining).to.deep.equal([33]);
      expect(remaining[0]).to.equal(33);
      expect(remaining[0]).to.not.equal(90);
    });
    
    it('should not reuse first weight in multi-unit scenario', () => {
      const poItem = {
        quantity: 4,
        receivedQuantity: 1,
        subProductWeights: [100, 100, 100, 100]
      };
      
      const pendingQuantity = 3;
      const remaining = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      // Should get the last 3 weights, not the first 3
      expect(remaining.length).to.equal(3);
      expect(remaining).to.deep.equal([100, 100, 100]);
    });
    
    it('should correctly handle varying weights in sequence', () => {
      const poItem = {
        quantity: 5,
        receivedQuantity: 2,
        subProductWeights: [10, 20, 30, 40, 50]
      };
      
      const pendingQuantity = 3;
      const remaining = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      // Should get weights at indices 2, 3, 4 (not 0, 1, 2)
      expect(remaining).to.deep.equal([30, 40, 50]);
      expect(remaining).to.not.include(10);
      expect(remaining).to.not.include(20);
    });
  });
  
  describe('Edge cases', () => {
    
    it('should handle zero receivedQuantity', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 0,
        subProductWeights: [90, 33]
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([90, 33]);
    });
    
    it('should handle null receivedQuantity', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: null,
        subProductWeights: [90, 33]
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([90, 33]);
    });
    
    it('should handle undefined receivedQuantity', () => {
      const poItem = {
        quantity: 2,
        // receivedQuantity is undefined
        subProductWeights: [90, 33]
      };
      
      const pendingQuantity = 2;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([90, 33]);
    });
    
    it('should handle very large weight values', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 1,
        subProductWeights: [1000000, 2000000]
      };
      
      const pendingQuantity = 1;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([2000000]);
    });
    
    it('should handle very small weight values', () => {
      const poItem = {
        quantity: 2,
        receivedQuantity: 1,
        subProductWeights: [0.001, 0.002]
      };
      
      const pendingQuantity = 1;
      const result = getRemainingExpectedUnitWeights(poItem, pendingQuantity);
      
      expect(result).to.deep.equal([0.002]);
    });
  });
});
