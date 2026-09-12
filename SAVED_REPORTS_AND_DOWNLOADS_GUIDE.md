# Saved Reports & Report Downloads - Complete Guide

## Overview

The Reports section now has TWO powerful features:

1. **Saved Reports** - Save report configurations for reuse
2. **Report Downloads** - Track all exported Excel files

---

## Feature 1: Saved Reports

### What is a Saved Report?

A **Saved Report** is a saved configuration that includes:
- ✅ Selected fields/columns
- ✅ Filters/Conditions applied
- ✅ Sort order
- ✅ A meaningful name

### Why Use Saved Reports?

**Scenario**: You need to generate the same report every week
- **Without Saved Reports**: Every time, you manually select fields, add filters, set sorting
- **With Saved Reports**: Click once to load everything automatically

### How to Create a Saved Report

#### Step 1: Configure Your Report
```
1. Open Reports section
2. Select a report module (e.g., "Purchase Orders")
3. Select columns you want (e.g., PO Number, Supplier, Status)
4. Add conditions/filters if needed (e.g., Status = "Pending")
5. Add sorting if needed (e.g., Sort by Order Date descending)
6. Click "Preview" to verify it looks correct
```

#### Step 2: Save the Configuration
```
1. In the left sidebar, find "Saved Reports" section
2. Click the orange "Save current" button
3. Enter a meaningful name (e.g., "Pending POs - Weekly")
4. Click "Save"
```

#### Step 3: Use the Saved Report Later
```
1. Open Reports section
2. Select the same report module
3. In "Saved Reports" section, click on your saved report name
4. All your configuration loads instantly:
   - Same columns selected
   - Same filters applied
   - Same sorting applied
5. Click "Preview" or "Export Excel"
```

### Example Use Cases

#### Use Case 1: Weekly Inventory Report
```
Name: "Inventory - Low Stock"
Configuration:
  - Fields: Product, Current Qty, Warehouse, Status
  - Filter: Current Qty < 100
  - Sort: By Current Qty (ascending)
  
Usage: Every Monday, click "Inventory - Low Stock" to see low stock items
```

#### Use Case 2: Monthly Sales Report
```
Name: "Sales - This Month"
Configuration:
  - Fields: Order Date, Customer, Amount, Status
  - Filter: Status = "Completed"
  - Sort: By Amount (descending)
  - Date Range: This Month
  
Usage: End of month, click to generate sales summary
```

#### Use Case 3: Supplier Performance
```
Name: "Supplier - On-Time Delivery"
Configuration:
  - Fields: Supplier, PO Count, Received On Time, Late Deliveries
  - Filter: Received Date >= Last Month
  - Sort: By Supplier Name
  
Usage: Monthly supplier review
```

### Managing Saved Reports

#### Load a Saved Report
```
Click on the saved report name in the "Saved Reports" section
→ Configuration loads automatically
```

#### Delete a Saved Report
```
Click the trash icon (🗑️) next to the saved report name
→ Report configuration is deleted
```

#### Edit a Saved Report
```
1. Load the saved report (click its name)
2. Modify the configuration (change fields, filters, sorting)
3. Click "Save current" and enter the same name
4. Click "Save"
→ The saved report is updated with new configuration
```

---

## Feature 2: Report Downloads

### What is Report Downloads?

**Report Downloads** is a history of all Excel files you've exported. It shows:
- 📄 Report name
- 📊 Module type
- 📅 Date range that was applied
- ⏰ When the file was generated
- 🔄 Button to re-download the file

### Why Use Report Downloads?

**Scenario**: You exported a report yesterday, but now you need it again
- **Without Downloads**: You have to regenerate the report (takes time)
- **With Downloads**: Click the download icon to get the file instantly

### How Report Downloads Works

#### Automatic Tracking
```
Every time you click "Export Excel":
1. Report is generated and downloaded
2. Download is automatically tracked
3. Entry appears in "Report Downloads" section
4. Entry includes: Report name, date range, generation time
```

#### View Download History
```
Location: Left sidebar, bottom section "Report Downloads"

Shows:
- 📄 Report Name (e.g., "Purchase Orders")
- 📊 Module (e.g., "purchase_orders")
- 📅 Date Range (e.g., "01/07/2026 to 31/07/2026")
- ⏰ Generated At (e.g., "14/08/2026 10:30 AM")
- Download Count Badge (e.g., "5 reports")
```

#### Re-download a Report
```
1. Find the report in "Report Downloads" section
2. Click the download icon (⬇️)
3. File downloads again instantly
```

#### Remove from History
```
1. Find the report in "Report Downloads" section
2. Click the trash icon (🗑️)
3. Entry is removed from history
```

#### Clear All History
```
1. Scroll to bottom of "Report Downloads" section
2. Click "Clear history" button
3. All download entries are deleted
```

### Example Download History

```
Report Downloads (5 reports)

📄 Purchase Orders
   purchase_orders
   01/07/2026 to 31/07/2026
   14/08/2026 10:30 AM
   [⬇️] [🗑️]

📄 Inventory Report
   inventory
   01/08/2026 to 31/08/2026
   14/08/2026 09:15 AM
   [⬇️] [🗑️]

📄 GRN Report
   grn
   01/08/2026 to 31/08/2026
   13/08/2026 02:45 PM
   [⬇️] [🗑️]

[Clear history]
```

---

## Complete Workflow Example

### Scenario: Weekly Purchase Order Report

#### Week 1: Create and Save
```
Step 1: Configure the report
  - Select "Purchase Orders" module
  - Select fields: PO Number, Order Date, Supplier, Status, Amount
  - Add filter: Status = "Pending"
  - Add sort: By Order Date (descending)
  - Set date range: Last 7 Days
  - Click Preview to verify

Step 2: Save the configuration
  - Click "Save current" in Saved Reports
  - Enter name: "Weekly Pending POs"
  - Click "Save"

Step 3: Export the report
  - Click "Export Excel"
  - File downloads as "purchase_orders_Report_1723654200000.xlsx"
  - Entry appears in "Report Downloads"
```

#### Week 2: Reuse Saved Report
```
Step 1: Load saved report
  - Click "Weekly Pending POs" in Saved Reports
  - All configuration loads instantly

Step 2: Generate report
  - Click "Preview" to see data
  - Click "Export Excel" to download

Step 3: Access previous week's report
  - Scroll to "Report Downloads"
  - Find last week's "Weekly Pending POs" entry
  - Click download icon to get last week's file
```

---

## Technical Details

### Where is Data Stored?

#### Saved Reports
- **Location**: MongoDB database
- **Collection**: `savedreports`
- **User-Specific**: Each user's saved reports are private
- **Persistence**: Permanent (until deleted)

#### Report Downloads
- **Location**: Browser localStorage
- **Key**: `reportDownloads`
- **User-Specific**: Per browser/device
- **Persistence**: Until browser cache is cleared

### Data Structure

#### Saved Report
```javascript
{
  _id: ObjectId,
  name: "Weekly Pending POs",
  reportKey: "purchase_orders",
  config: {
    selectedFields: ["poNumber", "orderDate", "supplierName", "status", "totalAmount"],
    filters: {
      condition: "and",
      groups: [{
        condition: "and",
        filters: [{
          field: "status",
          operator: "eq",
          value: "Pending"
        }]
      }]
    },
    sort: [{
      fieldKey: "orderDate",
      direction: -1
    }],
    dateRange: {
      startDate: "2026-08-07",
      endDate: "2026-08-14"
    }
  },
  createdBy: "user@example.com",
  createdAt: ISODate("2026-08-14T10:30:00Z")
}
```

#### Report Download Entry
```javascript
{
  id: 1723654200000,
  reportName: "Purchase Orders",
  module: "purchase_orders",
  dateRange: "01/07/2026 to 31/07/2026",
  generatedAt: "14/08/2026 10:30 AM",
  filename: "purchase_orders_Report_1723654200000.xlsx",
  timestamp: 1723654200000
}
```

---

## Limitations & Notes

### Saved Reports
- ✅ Can save unlimited reports
- ✅ Each user has their own saved reports
- ✅ Can edit by saving with same name
- ✅ Can delete anytime
- ⚠️ Saved reports are tied to the report module (can't mix modules)

### Report Downloads
- ✅ Automatically tracked
- ✅ Can re-download anytime
- ✅ Shows last 100 downloads
- ⚠️ Stored in browser localStorage (limited to ~5MB)
- ⚠️ Cleared if browser cache is cleared
- ⚠️ Different per browser/device

---

## FAQ

### Q: Can I share a saved report with other users?
**A**: Currently, saved reports are private. Future version will support sharing.

### Q: What happens if I delete a saved report?
**A**: The configuration is deleted. You can recreate it by configuring again and saving.

### Q: Can I export a saved report without previewing?
**A**: Yes! Load the saved report and click "Export Excel" directly.

### Q: How long are downloads kept in history?
**A**: Until you clear them manually or clear browser cache.

### Q: Can I download reports from a different device?
**A**: No, downloads are stored in browser localStorage. Each device has its own history.

### Q: What if I modify a saved report by accident?
**A**: You can reload the original saved report to restore the configuration.

### Q: Can I rename a saved report?
**A**: Yes, save it again with a new name, then delete the old one.

---

## Best Practices

### For Saved Reports
1. ✅ Use descriptive names (e.g., "Weekly Pending POs" not "Report 1")
2. ✅ Save frequently used report configurations
3. ✅ Delete unused saved reports to keep list clean
4. ✅ Include date range in name if it's important (e.g., "Monthly Sales")

### For Report Downloads
1. ✅ Check download history before regenerating reports
2. ✅ Clear old downloads periodically to save space
3. ✅ Note the date range in the download entry
4. ✅ Use meaningful filenames when saving to disk

---

## Summary

| Feature | Purpose | Storage | Persistence |
|---------|---------|---------|-------------|
| **Saved Reports** | Save report configuration for reuse | Database | Permanent |
| **Report Downloads** | Track exported Excel files | Browser | Until cleared |

Both features work together to make reporting faster and more efficient!
