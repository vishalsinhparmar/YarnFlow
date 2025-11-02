# 🧪 Quick Testing Guide - Sales Order Module

## ⚡ 5-Minute Production Safety Test

### 1️⃣ **Test Create New Order** (2 min)

**Steps:**
1. Open Sales Order page
2. Click "+ New Sales Order"
3. Select customer
4. Select category → Verify products load
5. Select product → Verify unit/weight auto-fill
6. Enter quantity
7. Click Submit

**Expected:** ✅ Order created successfully

**If Error:** Check console, verify category has inventory

---

### 2️⃣ **Test Edit Order** (1 min)

**Steps:**
1. Find a Draft order
2. Click "Edit"
3. Verify category pre-selected
4. Verify products loaded
5. Change category
6. Verify products reload
7. Click Submit

**Expected:** ✅ Order updated successfully

**If Error:** Check if order is Draft status

---

### 3️⃣ **Test View Order** (1 min)

**Steps:**
1. Click "View" on any order
2. Verify modal opens
3. Check Basic Information shows:
   - Customer name
   - Category (or "N/A" for old orders)
   - Order date
   - Expected delivery
4. Check Items show:
   - Product name
   - Quantity
   - Weight
5. Check Total Weight displayed

**Expected:** ✅ All info displays correctly

**If Error:** Check browser console

---

### 4️⃣ **Test Filters** (1 min)

**Steps:**
1. Click "Draft" filter → Verify only Draft orders show
2. Click "Pending" filter → Verify only Pending orders show
3. Click "All" filter → Verify all orders show
4. Type in search → Verify filtering works

**Expected:** ✅ Filters work correctly

**If Error:** Check network tab for API errors

---

### 5️⃣ **Test Cancel Order** (30 sec)

**Steps:**
1. Find a Draft or Pending order
2. Click "Cancel"
3. Confirm cancellation

**Expected:** ✅ Order cancelled, status updated

**If Error:** Check if order is already Delivered/Cancelled

---

## 🚨 Critical Tests (Must Pass):

### ✅ **Test 1: Old Orders Still Work**
- [ ] View old order (without category) → No crash
- [ ] Category shows "N/A"
- [ ] All other fields display correctly

### ✅ **Test 2: Edit Restrictions**
- [ ] Try to edit Pending order → Error message
- [ ] Try to edit Delivered order → Error message
- [ ] Can only edit Draft orders → Success

### ✅ **Test 3: Validation**
- [ ] Try to submit without customer → Error
- [ ] Try to submit without category → Error
- [ ] Try to submit without items → Error
- [ ] Try to exceed stock → Error

---

## 🎯 Quick Smoke Test (30 seconds):

```bash
# 1. Open Sales Order page
# 2. Check page loads without errors
# 3. Click any filter button
# 4. Click "View" on any order
# 5. Close modal
```

**If all 5 steps work → ✅ SAFE TO USE**

---

## 🔍 What to Look For:

### ✅ **Good Signs:**
- Page loads quickly
- No console errors
- Filters work smoothly
- Modals open/close properly
- Data displays correctly
- Actions work as expected

### ❌ **Warning Signs:**
- Console errors (red text)
- Blank screens
- "Cannot read property" errors
- Network errors (500, 404)
- Data not loading
- Buttons not working

---

## 🆘 If Something Breaks:

### **Frontend Issues:**
1. Check browser console (F12)
2. Look for red errors
3. Check network tab for failed requests
4. Refresh page (Ctrl+F5)

### **Backend Issues:**
1. Check server console
2. Look for error messages
3. Verify database connection
4. Check API endpoints

### **Quick Fixes:**
```bash
# Restart frontend
npm start

# Restart backend
npm run dev

# Clear cache
Ctrl+Shift+Delete → Clear cache

# Hard refresh
Ctrl+F5
```

---

## ✅ Production Ready Checklist:

**Before Going Live:**
- [ ] All 5 quick tests passed
- [ ] No console errors
- [ ] Old orders display correctly
- [ ] New orders create successfully
- [ ] Edit works for Draft orders only
- [ ] Cancel works correctly
- [ ] Filters work
- [ ] Search works
- [ ] Modals open/close properly
- [ ] No data loss

**If all checked → 🚀 DEPLOY!**

---

## 📞 Support:

**If you encounter issues:**
1. Check console for errors
2. Verify API is running
3. Check database connection
4. Review error messages
5. Test with different data

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Category is required" | Select a category before submitting |
| "Cannot modify order in X status" | Can only edit Draft orders |
| "Quantity exceeds available stock" | Reduce quantity or check inventory |
| Products not loading | Check if category has inventory |
| Modal not opening | Check console for errors |

---

## 🎉 Success Criteria:

**✅ Everything is working if:**
1. Can create new orders
2. Can edit Draft orders
3. Can view all orders
4. Can cancel orders
5. Filters work
6. Search works
7. No console errors
8. Old orders display correctly
9. Category shows properly
10. Total weight calculates

**All 10 = PRODUCTION READY!** 🚀
