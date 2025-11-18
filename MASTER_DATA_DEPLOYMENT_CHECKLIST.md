# Master Data Cleanup - Deployment Checklist

## ✅ Pre-Deployment (Development/Staging)

### Code Verification
- [x] All `productCode` references removed from codebase
- [x] All `supplierCode` references removed from codebase
- [x] All `customerCode` references removed from codebase
- [x] All `categoryCode` references removed from codebase
- [x] All models updated and validated
- [x] All controllers updated
- [x] All frontend components updated
- [x] No console errors in browser
- [x] No server errors in logs

### Database Verification
- [x] Migration scripts created
- [x] Migration scripts tested in development
- [x] All indexes dropped successfully
- [x] Database backup taken

### Testing Verification
- [x] Create Category → Success
- [x] Create Customer (with GST auto-fill PAN) → Success
- [x] Create Supplier (with GST auto-fill PAN) → Success
- [x] Create Product (with Category) → Success
- [x] Create Purchase Order (with Products) → Success
- [x] Create GRN (creates Inventory Lots) → Success
- [x] View Inventory (aggregated by Product) → Success
- [x] Create Sales Order (checks stock) → Success
- [x] Create Sales Challan (updates inventory) → Success
- [x] Generate PDF (shows product/category data) → Success
- [x] Search functionality works → Success
- [x] Filter functionality works → Success

---

## 🚀 Production Deployment

### Step 1: Backup (CRITICAL)
```bash
# Create full database backup
mongodump --uri="YOUR_PRODUCTION_MONGODB_URI" --out=backup-$(date +%Y%m%d-%H%M%S)

# Verify backup created
ls -lh backup-*
```
- [ ] Database backup completed
- [ ] Backup verified and stored safely
- [ ] Backup location documented: _______________

### Step 2: Maintenance Mode (Optional)
```bash
# Put application in maintenance mode if needed
# This prevents users from creating data during migration
```
- [ ] Maintenance mode enabled (if applicable)
- [ ] Users notified (if applicable)

### Step 3: Deploy Code
```bash
# Pull latest code
git fetch origin
git checkout feature/master-data-cleanup
git pull origin feature/master-data-cleanup

# Install dependencies
cd server && npm install
cd ../client && npm install

# Build frontend
cd client && npm run build

# Restart server
pm2 restart yarnflow-server
# OR
systemctl restart yarnflow
```
- [ ] Code pulled from repository
- [ ] Dependencies installed
- [ ] Frontend built successfully
- [ ] Server restarted
- [ ] Server is running (check `pm2 status` or `systemctl status`)

### Step 4: Run Migrations
```bash
cd server

# Run each migration script
node src/scripts/dropCategoryCodeIndex.js
node src/scripts/dropCustomerCodeIndex.js
node src/scripts/dropSupplierCodeIndex.js
node src/scripts/dropProductCodeIndex.js
```
- [ ] Category index dropped
- [ ] Customer index dropped
- [ ] Supplier index dropped
- [ ] Product index dropped
- [ ] All migrations completed successfully

### Step 5: Verify Deployment
```bash
# Check server logs
pm2 logs yarnflow-server
# OR
journalctl -u yarnflow -f
```
- [ ] No errors in server logs
- [ ] Application accessible
- [ ] Login works

### Step 6: Smoke Tests (Production)
- [ ] Master Data Dashboard loads
- [ ] Categories list loads
- [ ] Customers list loads
- [ ] Suppliers list loads
- [ ] Products list loads
- [ ] Create test category → Success
- [ ] Create test customer → Success
- [ ] Create test supplier → Success
- [ ] Create test product → Success
- [ ] View inventory → Success
- [ ] Search works → Success
- [ ] Existing POs load correctly
- [ ] Existing GRNs load correctly
- [ ] Existing SOs load correctly
- [ ] Existing Challans load correctly
- [ ] PDF generation works

### Step 7: Disable Maintenance Mode
- [ ] Maintenance mode disabled
- [ ] Users notified of completion

---

## 🔍 Post-Deployment Monitoring

### First Hour
- [ ] Monitor server logs for errors
- [ ] Monitor application performance
- [ ] Check user reports/feedback
- [ ] Verify no duplicate key errors
- [ ] Verify all forms working

### First Day
- [ ] Review error logs
- [ ] Check database performance
- [ ] Verify all workflows functioning
- [ ] Collect user feedback
- [ ] Monitor system metrics

### First Week
- [ ] Review all error reports
- [ ] Verify data integrity
- [ ] Check for any edge cases
- [ ] Document any issues found
- [ ] Plan any necessary hotfixes

---

## 🆘 Rollback Procedure (If Needed)

### When to Rollback:
- Critical errors preventing normal operation
- Data integrity issues
- Major functionality broken
- User-facing errors affecting business

### Rollback Steps:
```bash
# Step 1: Stop application
pm2 stop yarnflow-server

# Step 2: Restore database backup
mongorestore --uri="YOUR_PRODUCTION_MONGODB_URI" --drop backup-TIMESTAMP

# Step 3: Revert code
git checkout main
git pull origin main

# Step 4: Rebuild and restart
cd client && npm run build
cd ../server
pm2 restart yarnflow-server

# Step 5: Verify rollback
# Check that application works with old code
```

- [ ] Application stopped
- [ ] Database restored from backup
- [ ] Code reverted to previous version
- [ ] Application restarted
- [ ] Rollback verified working
- [ ] Incident documented
- [ ] Team notified

---

## 📊 Success Metrics

### Technical Metrics:
- [ ] Zero duplicate key errors
- [ ] All API endpoints responding correctly
- [ ] Database queries performing well
- [ ] No increase in error rates
- [ ] All workflows completing successfully

### Business Metrics:
- [ ] Users can create master data
- [ ] Purchase orders being created
- [ ] GRNs being processed
- [ ] Sales orders being created
- [ ] Inventory tracking accurate
- [ ] Reports generating correctly

---

## 📝 Deployment Notes

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Deployment Time**: _______________ (Start) to _______________ (End)  
**Downtime**: _______________ minutes  
**Issues Encountered**: _______________  
**Resolution**: _______________  

---

## ✅ Sign-Off

- [ ] Technical Lead Approval: _______________
- [ ] QA Approval: _______________
- [ ] Product Owner Approval: _______________
- [ ] Deployment Successful: _______________

---

## 📞 Emergency Contacts

**Technical Lead**: _______________  
**DevOps**: _______________  
**Database Admin**: _______________  
**On-Call Engineer**: _______________  

---

## 🎉 Deployment Complete!

Once all checklist items are marked complete and verified, the deployment is successful!

**Next Steps:**
1. Monitor for 24 hours
2. Collect user feedback
3. Document lessons learned
4. Update team on success
5. Close deployment ticket
