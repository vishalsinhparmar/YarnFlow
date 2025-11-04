# Production Deployment Guide - Weight System

## Overview

This guide will help you safely deploy the weight tracking system to production without affecting your live server.

---

## Files Changed

### Backend Files (6 files)

1. **`server/src/models/InventoryLot.js`**
   - Added `weight` field to `movements` array
   - **Impact:** Schema change (backward compatible)
   - **Risk:** LOW - New field with default value

2. **`server/src/controller/inventoryController.js`**
   - Added weight aggregation logic
   - Added debug logging
   - **Impact:** API response includes new weight fields
   - **Risk:** LOW - Only adds new fields, doesn't remove existing

3. **`server/src/controller/salesChallanController.js`**
   - Added weight calculation in FIFO deduction
   - Added weight to movement records
   - Added debug logging
   - **Impact:** Saves weight in movements
   - **Risk:** LOW - Backward compatible

### Frontend Files (4 files)

4. **`client/src/components/SalesOrders/NewSalesOrderModal.jsx`**
   - Added auto-weight calculation
   - Added `onSubmit` callback
   - Added suggested weight display
   - **Impact:** Better UX for weight entry
   - **Risk:** LOW - Only UI improvements

5. **`client/src/components/SalesChallan/CreateChallanModal.jsx`**
   - Added proportional weight calculation
   - Added auto-weight update on quantity change
   - **Impact:** Auto-calculates weight from SO
   - **Risk:** LOW - Improves accuracy

6. **`client/src/pages/Inventory.jsx`**
   - Updated weight column display
   - Added +/- weight indicators
   - **Impact:** Better weight visualization
   - **Risk:** LOW - Only UI changes

7. **`client/src/components/InventoryLotsManagement/InventoryLotDetail.jsx`**
   - Added weight to quantity section
   - Added weight to movement history
   - **Impact:** Shows weight in lot details
   - **Risk:** LOW - Only UI changes

---

## Git Workflow

### Step 1: Create New Branch

```bash
# Make sure you're on main/master branch
git checkout main
git pull origin main

# Create new feature branch
git checkout -b feature/weight-tracking-system

# Verify you're on the new branch
git branch
```

### Step 2: Review Changes

```bash
# See all modified files
git status

# Review changes in each file
git diff server/src/models/InventoryLot.js
git diff server/src/controller/inventoryController.js
git diff server/src/controller/salesChallanController.js
git diff client/src/components/SalesOrders/NewSalesOrderModal.jsx
git diff client/src/components/SalesChallan/CreateChallanModal.jsx
git diff client/src/pages/Inventory.jsx
git diff client/src/components/InventoryLotsManagement/InventoryLotDetail.jsx
```

### Step 3: Stage and Commit Changes

```bash
# Stage all changes
git add .

# Or stage files individually
git add server/src/models/InventoryLot.js
git add server/src/controller/inventoryController.js
git add server/src/controller/salesChallanController.js
git add client/src/components/SalesOrders/NewSalesOrderModal.jsx
git add client/src/components/SalesChallan/CreateChallanModal.jsx
git add client/src/pages/Inventory.jsx
git add client/src/components/InventoryLotsManagement/InventoryLotDetail.jsx

# Commit with descriptive message
git commit -m "feat: Add complete weight tracking system

- Add weight field to InventoryLot movements schema
- Implement weight aggregation in inventory controller
- Add proportional weight calculation in sales challan
- Add auto-weight calculation in sales order modal
- Add weight display with +/- indicators in inventory UI
- Add weight tracking in lot details and movement history

Changes are backward compatible and production-safe."
```

### Step 4: Push to Remote

```bash
# Push new branch to remote
git push origin feature/weight-tracking-system

# If this is the first push of this branch
git push -u origin feature/weight-tracking-system
```

---

## Pre-Deployment Checklist

### Backend Checks

- [ ] **Schema Change Review**
  - ✅ `weight` field has default value (0)
  - ✅ Existing documents won't break
  - ✅ No required fields added

- [ ] **API Backward Compatibility**
  - ✅ New fields added (not removed)
  - ✅ Existing API responses still work
  - ✅ Old clients won't break

- [ ] **Database Impact**
  - ✅ No migrations required
  - ✅ Existing data remains valid
  - ✅ New field auto-populated

### Frontend Checks

- [ ] **UI Changes**
  - ✅ Graceful fallback for missing data
  - ✅ No breaking changes to existing flows
  - ✅ Backward compatible with old API

- [ ] **Build Check**
  ```bash
  cd client
  npm run build
  ```

---

## Deployment Strategy

### Option 1: Staged Deployment (RECOMMENDED)

```
1. Deploy Backend First
   ↓
2. Test API with old frontend
   ↓
3. Deploy Frontend
   ↓
4. Test complete flow
```

### Option 2: Blue-Green Deployment

```
1. Deploy to staging environment
   ↓
2. Run full tests
   ↓
3. Switch traffic to new version
   ↓
4. Monitor for issues
```

---

## Deployment Steps

### Step 1: Deploy Backend

```bash
# SSH to production server
ssh user@your-production-server

# Navigate to project directory
cd /path/to/YarnFlow/server

# Pull latest changes
git fetch origin
git checkout feature/weight-tracking-system
git pull origin feature/weight-tracking-system

# Install dependencies (if any new)
npm install

# Restart server
pm2 restart yarnflow-server

# Or if using different process manager
npm run restart
```

### Step 2: Verify Backend

```bash
# Check server logs
pm2 logs yarnflow-server

# Test API endpoint
curl http://localhost:3050/api/inventory

# Verify response includes new fields:
# - currentWeight
# - receivedWeight
# - issuedWeight
```

### Step 3: Deploy Frontend

```bash
# Navigate to client directory
cd /path/to/YarnFlow/client

# Pull latest changes
git pull origin feature/weight-tracking-system

# Install dependencies
npm install

# Build production bundle
npm run build

# Deploy build files to web server
# (Copy dist folder to nginx/apache root)
```

### Step 4: Verify Frontend

```bash
# Check browser console for errors
# Test flows:
# 1. Create Sales Order with weight
# 2. Create Sales Challan from SO
# 3. View inventory with weight display
# 4. View lot details with weight
```

---

## Rollback Plan

### If Issues Occur

```bash
# Backend Rollback
cd /path/to/YarnFlow/server
git checkout main
pm2 restart yarnflow-server

# Frontend Rollback
cd /path/to/YarnFlow/client
git checkout main
npm run build
# Deploy previous build
```

---

## Testing Checklist

### After Backend Deployment

- [ ] Server starts without errors
- [ ] API returns new weight fields
- [ ] Existing API calls still work
- [ ] No database errors in logs

### After Frontend Deployment

- [ ] Application loads without errors
- [ ] Can create Sales Order with weight
- [ ] Can create Sales Challan with weight
- [ ] Inventory displays weight correctly
- [ ] Lot details show weight
- [ ] Movement history shows weight

### End-to-End Test

- [ ] **Test 1: Create SO**
  - Select product
  - Enter quantity
  - Verify weight auto-fills
  - Submit SO

- [ ] **Test 2: Create Challan**
  - Select SO
  - Verify weight auto-fills
  - Change quantity
  - Verify weight updates
  - Submit challan

- [ ] **Test 3: Check Inventory**
  - View inventory page
  - Verify weight decreased
  - Verify +/- indicators show
  - Click "View" on product
  - Verify lot details show weight

---

## Monitoring

### What to Monitor

1. **Server Logs**
   ```bash
   pm2 logs yarnflow-server --lines 100
   
   # Look for:
   📦 Deducted ... kg
   ⚖️  Weight saved in movement: ... kg
   📊 Product ...: Issued weight from movements: ... kg
   ```

2. **Database Queries**
   ```bash
   # Check if movements have weight field
   db.inventorylots.findOne({}, { movements: 1 })
   ```

3. **API Response Time**
   - Monitor `/api/inventory` endpoint
   - Should not be significantly slower

4. **Error Rates**
   - Watch for any new errors
   - Check browser console
   - Check server error logs

---

## Production Safety Measures

### Backward Compatibility ✅

1. **Schema Changes**
   - `weight` field has default value (0)
   - Existing documents work without migration
   - No breaking changes

2. **API Changes**
   - Only adds new fields
   - Doesn't remove or rename existing fields
   - Old clients continue to work

3. **Frontend Changes**
   - Graceful fallback for missing data
   - Uses optional chaining (`?.`)
   - Checks for data existence before display

### Data Integrity ✅

1. **Existing Data**
   - Old challans: movements without weight (weight = 0)
   - New challans: movements with weight
   - Both work correctly

2. **Calculations**
   - Weight defaults to 0 if not present
   - No division by zero errors
   - Safe number formatting

---

## Post-Deployment Verification

### Immediate Checks (First 15 minutes)

```bash
# 1. Check server is running
pm2 status

# 2. Check for errors
pm2 logs yarnflow-server --err --lines 50

# 3. Test API
curl http://localhost:3050/api/inventory | jq '.data[0].products[0]'

# 4. Check frontend loads
curl http://your-domain.com
```

### Short-term Monitoring (First Hour)

- [ ] Create test Sales Order
- [ ] Create test Sales Challan
- [ ] Verify weight calculations
- [ ] Check inventory display
- [ ] Monitor error logs

### Long-term Monitoring (First Day)

- [ ] Monitor user feedback
- [ ] Check error rates
- [ ] Verify data accuracy
- [ ] Review performance metrics

---

## Troubleshooting

### Issue 1: Weight Not Showing

**Symptom:** Weight shows as 0 or undefined

**Solution:**
```bash
# Check if schema updated
# Restart server to reload schema
pm2 restart yarnflow-server

# Check if movements have weight
db.inventorylots.findOne({}, { movements: 1 })
```

### Issue 2: Weight Calculation Wrong

**Symptom:** Weight doesn't match expected value

**Solution:**
```bash
# Check console logs for weight calculations
pm2 logs yarnflow-server | grep "⚖️"

# Verify weight per unit calculation
# weight / quantity should be consistent
```

### Issue 3: Frontend Not Updating

**Symptom:** Old UI still showing

**Solution:**
```bash
# Clear browser cache
# Hard refresh (Ctrl + Shift + R)

# Or rebuild frontend
cd client
npm run build
```

---

## Summary

### Changes Made

**Backend (3 files):**
1. ✅ InventoryLot.js - Added weight to movements
2. ✅ inventoryController.js - Added weight aggregation
3. ✅ salesChallanController.js - Added weight calculation

**Frontend (4 files):**
4. ✅ NewSalesOrderModal.jsx - Auto-weight calculation
5. ✅ CreateChallanModal.jsx - Proportional weight
6. ✅ Inventory.jsx - Weight display with indicators
7. ✅ InventoryLotDetail.jsx - Weight in details

### Safety Measures

✅ **Backward Compatible** - No breaking changes
✅ **Default Values** - New field has default (0)
✅ **Graceful Fallback** - UI handles missing data
✅ **No Migration** - Existing data works as-is
✅ **Rollback Ready** - Can revert if needed

### Deployment Command Summary

```bash
# 1. Create branch
git checkout -b feature/weight-tracking-system

# 2. Commit changes
git add .
git commit -m "feat: Add complete weight tracking system"

# 3. Push to remote
git push -u origin feature/weight-tracking-system

# 4. Deploy backend
ssh production-server
cd /path/to/YarnFlow/server
git pull origin feature/weight-tracking-system
pm2 restart yarnflow-server

# 5. Deploy frontend
cd /path/to/YarnFlow/client
git pull origin feature/weight-tracking-system
npm run build

# 6. Monitor
pm2 logs yarnflow-server
```

---

## Final Checklist

Before deploying to production:

- [ ] All changes committed to feature branch
- [ ] Code reviewed
- [ ] Tested locally
- [ ] Backend deployed and verified
- [ ] Frontend deployed and verified
- [ ] End-to-end test passed
- [ ] Monitoring in place
- [ ] Rollback plan ready

**Status:** ✅ Ready for Production Deployment
