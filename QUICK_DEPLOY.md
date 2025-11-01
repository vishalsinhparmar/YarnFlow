# ⚡ Quick Deploy Reference Card

## 🚀 Deploy in 5 Minutes

### Step 1: Backup (30 seconds)
```bash
mongodump --db yarnflow --out ./backup-$(date +%Y%m%d)
```

### Step 2: Backend (2 minutes)
```bash
cd server
npm install
pm2 restart yarnflow-server
pm2 logs yarnflow-server --lines 20
```

### Step 3: Frontend (2 minutes)
```bash
cd client
npm install
npm run build
# Deploy build/ folder to your web server
```

### Step 4: Verify (30 seconds)
```bash
# Check backend
curl http://localhost:5000/api/health

# Check frontend
# Open browser: http://localhost:3000
# Test: Create GRN, View Inventory, Click "View" button
```

---

## ✅ What to Test After Deploy

1. **GRN Creation** (1 min)
   - Create GRN with "Mark Complete" ✓
   - Check PO status = "Fully Received" ✓

2. **Inventory Page** (1 min)
   - Products aggregated (one row per product) ✓
   - Click "View" button ✓
   - See product details ✓

3. **GRN Form** (30 sec)
   - Completed POs not in dropdown ✓

---

## 🔙 Rollback (If Needed)

```bash
# Restore database
mongorestore --db yarnflow ./backup-YYYYMMDD/yarnflow

# Revert code
git revert HEAD

# Redeploy
cd server && pm2 restart yarnflow-server
cd client && npm run build
```

---

## 📋 Files Changed

**Backend (2)**:
- `server/src/controller/grnController.js`
- `server/src/models/PurchaseOrder.js`

**Frontend (4 + 1 new)**:
- `client/src/pages/Inventory.jsx`
- `client/src/components/Inventory/ProductDetail.jsx` ← NEW
- `client/src/pages/GoodsReceipt.jsx`
- `client/src/components/GRN/GRNForm.jsx`

---

## 🎯 Success Indicators

✅ No errors in `pm2 logs`
✅ Inventory page loads
✅ "View" button works
✅ GRN creation successful
✅ PO status updates correctly

---

## ⚠️ If Something Breaks

1. Check `pm2 logs yarnflow-server`
2. Check browser console (F12)
3. Follow rollback steps above
4. See `DEPLOYMENT_GUIDE_GRN_INVENTORY_FIX.md` for details

---

## 📊 Risk Level: 🟢 LOW

- ✅ Backward compatible
- ✅ No schema changes
- ✅ Easy rollback
- ✅ Tested thoroughly

---

**Deploy with confidence!** 🚀
