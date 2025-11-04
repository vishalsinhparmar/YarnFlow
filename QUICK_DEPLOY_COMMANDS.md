# Quick Deploy Commands - Weight System

## Step-by-Step Git Commands

### 1. Create Feature Branch

```bash
# Navigate to project root
cd c:\Users\vishalsinh\YarnFlow

# Check current branch
git branch

# Make sure you're on main
git checkout main

# Pull latest changes
git pull origin main

# Create new feature branch
git checkout -b feature/weight-tracking-system
```

---

### 2. Review Your Changes

```bash
# See all modified files
git status

# Should show:
# Modified:
#   server/src/models/InventoryLot.js
#   server/src/controller/inventoryController.js
#   server/src/controller/salesChallanController.js
#   client/src/components/SalesOrders/NewSalesOrderModal.jsx
#   client/src/components/SalesChallan/CreateChallanModal.jsx
#   client/src/pages/Inventory.jsx
#   client/src/components/InventoryLotsManagement/InventoryLotDetail.jsx
```

---

### 3. Stage Changes

```bash
# Stage all changes at once
git add .

# OR stage files individually for better control
git add server/src/models/InventoryLot.js
git add server/src/controller/inventoryController.js
git add server/src/controller/salesChallanController.js
git add client/src/components/SalesOrders/NewSalesOrderModal.jsx
git add client/src/components/SalesChallan/CreateChallanModal.jsx
git add client/src/pages/Inventory.jsx
git add client/src/components/InventoryLotsManagement/InventoryLotDetail.jsx
```

---

### 4. Commit Changes

```bash
git commit -m "feat: Add complete weight tracking system

- Add weight field to InventoryLot movements schema
- Implement weight aggregation in inventory controller  
- Add proportional weight calculation in sales challan
- Add auto-weight calculation in sales order modal
- Add weight display with +/- indicators in inventory UI
- Add weight tracking in lot details and movement history

Changes are backward compatible and production-safe.
No breaking changes. Schema change uses default values."
```

---

### 5. Push to Remote

```bash
# Push new branch to remote repository
git push -u origin feature/weight-tracking-system
```

---

## Files Changed Summary

### Backend (3 files)
```
✅ server/src/models/InventoryLot.js
   - Added weight field to movements array
   
✅ server/src/controller/inventoryController.js
   - Added weight aggregation logic
   - Added debug logging
   
✅ server/src/controller/salesChallanController.js
   - Added weight calculation in FIFO
   - Added weight to movement records
```

### Frontend (4 files)
```
✅ client/src/components/SalesOrders/NewSalesOrderModal.jsx
   - Auto-weight calculation on quantity change
   - Added onSubmit callback
   
✅ client/src/components/SalesChallan/CreateChallanModal.jsx
   - Proportional weight from SO
   - Auto-update on quantity change
   
✅ client/src/pages/Inventory.jsx
   - Weight display with +/- indicators
   
✅ client/src/components/InventoryLotsManagement/InventoryLotDetail.jsx
   - Weight in lot details and movements
```

---

## Production Deployment (After Branch is Approved)

### Backend Deployment

```bash
# SSH to production server
ssh user@your-production-server

# Navigate to server directory
cd /path/to/YarnFlow/server

# Fetch latest changes
git fetch origin

# Checkout feature branch
git checkout feature/weight-tracking-system

# Pull latest
git pull origin feature/weight-tracking-system

# Install dependencies (if needed)
npm install

# Restart server
pm2 restart yarnflow-server

# Check logs
pm2 logs yarnflow-server --lines 50
```

### Frontend Deployment

```bash
# Navigate to client directory
cd /path/to/YarnFlow/client

# Pull latest changes
git pull origin feature/weight-tracking-system

# Install dependencies
npm install

# Build for production
npm run build

# Deploy dist folder to web server
# (Copy to nginx/apache root or use your deployment method)
```

---

## Verification Commands

### Check Git Status

```bash
# Verify you're on the right branch
git branch

# Should show:
#   main
# * feature/weight-tracking-system

# Check commit history
git log --oneline -5
```

### Check Remote

```bash
# Verify branch pushed to remote
git branch -r

# Should show:
#   origin/main
#   origin/feature/weight-tracking-system
```

---

## Rollback (If Needed)

```bash
# Switch back to main branch
git checkout main

# On production server
ssh user@your-production-server
cd /path/to/YarnFlow/server
git checkout main
pm2 restart yarnflow-server
```

---

## Merge to Main (After Testing)

```bash
# Switch to main branch
git checkout main

# Pull latest
git pull origin main

# Merge feature branch
git merge feature/weight-tracking-system

# Push to main
git push origin main

# Delete feature branch (optional)
git branch -d feature/weight-tracking-system
git push origin --delete feature/weight-tracking-system
```

---

## Safety Checklist

Before pushing:
- [ ] All files saved
- [ ] No syntax errors
- [ ] Tested locally
- [ ] Reviewed changes with `git diff`
- [ ] Meaningful commit message

After pushing:
- [ ] Branch visible on GitHub/GitLab
- [ ] CI/CD pipeline passes (if configured)
- [ ] Ready for code review
- [ ] Ready for deployment

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git status` | See modified files |
| `git branch` | See current branch |
| `git checkout -b <name>` | Create new branch |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Commit changes |
| `git push -u origin <branch>` | Push new branch |
| `git log --oneline` | See commit history |
| `git diff <file>` | See file changes |

---

## Your Exact Commands

```bash
# 1. Create branch
cd c:\Users\vishalsinh\YarnFlow
git checkout main
git pull origin main
git checkout -b feature/weight-tracking-system

# 2. Stage and commit
git add .
git commit -m "feat: Add complete weight tracking system"

# 3. Push
git push -u origin feature/weight-tracking-system

# Done! ✅
```

---

## What Happens Next

1. **Branch Created** ✅
   - Your changes are in `feature/weight-tracking-system`
   - Main branch is untouched
   - Production is safe

2. **Code Review** (Optional)
   - Team can review changes
   - Make adjustments if needed
   - Test in staging environment

3. **Deployment**
   - Deploy backend first
   - Test API
   - Deploy frontend
   - Verify everything works

4. **Merge to Main**
   - After successful testing
   - Merge feature branch to main
   - Delete feature branch

---

## Status

✅ **Ready to Execute**

All commands are safe and production-ready. Your main branch and production server will NOT be affected until you explicitly deploy the feature branch.
