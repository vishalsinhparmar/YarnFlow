/**
 * PHASE 11A: Fallback Test
 * 
 * Tests that the frontend fallback calculation works correctly
 * when the backend doesn't provide remainingExpectedUnitWeights
 * (for POs created before Phase 11A fix)
 */

import { expect } from 'chai';

describe('PHASE 11A: Frontend Fallback Calculation', () => {
  
  /**
   * Simulate the frontend fallback logic
   */
  const calculateRemainingWeightsFallback = (orderedSubProductWeights, receivedQty, pendingQty) => {
    let remainingExpectedUnitWeights = [];
    
    // FALLBACK: If backend doesn't provide remainingExpectedUnitWeights
    // (for POs created before Phase 11A fix), calculate locally
    if (remainingExpectedUnitWeights.length === 0 && orderedSubProductWeights.length > 0) {
      const startIdx = receivedQty;
      const endIdx = receivedQty + pendingQty;
      remainingExpectedUnitWeights = orderedSubProductWeights.slice(startIdx, endIdx);
    }
    
    return remainingExpectedUnitWeights;
  };
  
  describe('Fallback calculation for legacy POs', () => {
    
    it('should calculate remaining weights for gaze 904 × 4', () => {
      const orderedSubProductWeights = [50, 30, 32];
      const receivedQty = 2;
      const pendingQty = 1;
      
      const result = calculateRemainingWeightsFallback(orderedSubProductWeights, receivedQty, pendingQty);
      
      expect(result).to.deep.equal([32]);
      expect(result).to.not.include(50);
      expect(result).to.not.include(30);
    });
    
    it('should calculate remaining weights for GAZE 999 × 8', () => {
      const orderedSubProductWeights = [90, 33];
      const receivedQty = 1;
      const pendingQty = 1;
      
      const result = calculateRemainingWeightsFallback(orderedSubProductWeights, receivedQty, pendingQty);
      
      expect(result).to.deep.equal([33]);
      expect(result).to.not.include(90);
    });
    
    it('should return empty array when all units received', () => {
      const orderedSubProductWeights = [50, 30, 32];
      const receivedQty = 3;
      const pendingQty = 0;
      
      const result = calculateRemainingWeightsFallback(orderedSubProductWeights, receivedQty, pendingQty);
      
      expect(result).to.deep.equal([]);
    });
    
    it('should return all weights when no receipt exists', () => {
      const orderedSubProductWeights = [50, 30, 32];
      const receivedQty = 0;
      const pendingQty = 3;
      
      const result = calculateRemainingWeightsFallback(orderedSubProductWeights, receivedQty, pendingQty);
      
      expect(result).to.deep.equal([50, 30, 32]);
    });
    
    it('should handle partial pending quantity', () => {
      const orderedSubProductWeights = [10, 20, 30, 40, 50];
      const receivedQty = 2;
      const pendingQty = 2;
      
      const result = calculateRemainingWeightsFallback(orderedSubProductWeights, receivedQty, pendingQty);
      
      expect(result).to.deep.equal([30, 40]);
      expect(result).to.not.include(10);
      expect(result).to.not.include(20);
      expect(result).to.not.include(50);
    });
    
    it('should never return previously received weights', () => {
      const orderedSubProductWeights = [100, 200, 300, 400];
      const receivedQty = 2;
      const pendingQty = 2;
      
      const result = calculateRemainingWeightsFallback(orderedSubProductWeights, receivedQty, pendingQty);
      
      expect(result).to.deep.equal([300, 400]);
      expect(result).to.not.include(100);
      expect(result).to.not.include(200);
    });
  });
  
  describe('Fallback with empty orderedSubProductWeights', () => {
    
    it('should return empty array when no sub-product weights', () => {
      const orderedSubProductWeights = [];
      const receivedQty = 0;
      const pendingQty = 2;
      
      const result = calculateRemainingWeightsFallback(orderedSubProductWeights, receivedQty, pendingQty);
      
      expect(result).to.deep.equal([]);
    });
  });
});
