# YarnFlow Reports - Complete Features Summary

## Overview

The Reports section now has **4 major features** to make reporting simple and efficient:

1. ✅ **Report Period Selector** - Choose date ranges easily
2. ✅ **Conditions & Sorting** - Filter and sort data
3. ✅ **Saved Reports** - Save configurations for reuse
4. ✅ **Report Downloads** - Track exported files

---

## Feature 1: Report Period Selector

### What It Does
Allows you to select a date range for your report with preset options.

### How to Use
```
Location: Left sidebar, top section "Report Period"

Options:
- [Today] - Only today's data
- [Yesterday] - Only yesterday's data
- [This Week] - Current week's data
- [This Month] - Current month's data
- [Last Month] - Previous month's data (DEFAULT)
- [Last 7 Days] - Last 7 days of data
- [Last 30 Days] - Last 30 days of data
- [Custom Date Range] - Select specific dates

Applied Range Display:
Shows: "01/07/2026 to 31/07/2026" in orange box
```

### Example
```
User selects "Last 7 Days"
↓
Report shows only data from last 7 days
↓
Click "Export Excel"
↓
Excel file contains only last 7 days of data
```

---

## Feature 2: Conditions (Filters)

### What It Does
Filter data based on specific conditions.

### How to Use
```
Location: Main content area, "Conditions" section

Steps:
1. Click "Add condition"
2. Select a field (e.g., "Status")
3. Select an operator (e.g., "equals")
4. Enter a value (e.g., "Pending")
5. Click "Preview" to see filtered results

For Reference Fields (like Supplier, Product):
- Dropdown automatically shows available values from database
- No need to type - just select from list
```

### Example
```
Condition 1: Status = "Pending"
Condition 2: Amount > 10000
↓
Report shows only Pending orders with amount > 10000
```

---

## Feature 3: Sort By

### What It Does
Sort results by one or more fields in ascending or descending order.

### How to Use
```
Location: Main content area, "Sort By" section

Steps:
1. Click "Add sort"
2. Select a field (e.g., "Order Date")
3. Click "Asc" or "Desc" to set direction
4. Add more sorts if needed (max 5)
5. Click "Preview" to see sorted results

Direction Toggle:
- [↑ Asc] = Ascending (A to Z, 0 to 9, oldest to newest)
- [↓ Desc] = Descending (Z to A, 9 to 0, newest to oldest)
```

### Example
```
Sort 1: By Order Date (Descending) - Newest first
Sort 2: By Supplier Name (Ascending) - A to Z
↓
Report shows newest orders first, then sorted by supplier
```

---

## Feature 4: Saved Reports

### What It Does
Save your report configuration (fields, filters, sorting) for quick reuse.

### Why Use It
**Scenario**: You need the same report every week
- **Without Saved Reports**: Manually configure every time (5 minutes)
- **With Saved Reports**: Click once to load everything (5 seconds)

### How to Create
```
1. Configure your report:
   - Select fields
   - Add conditions
   - Add sorting
   - Set date range

2. Click "Save current" in "Saved Reports" section

3. Enter a name (e.g., "Weekly Pending POs")

4. Click "Save"

✅ Configuration saved to database
✅ Appears in "Saved Reports" list
```

### How to Use
```
1. Open Reports section
2. Select same report module
3. Click saved report name in "Saved Reports"
4. All configuration loads instantly:
   - Same fields selected
   - Same conditions applied
   - Same sorting applied
   - Same date range set

5. Click "Preview" or "Export Excel"
```

### Example Saved Reports
```
"Weekly Pending POs"
- Fields: PO Number, Supplier, Status, Amount
- Condition: Status = "Pending"
- Sort: By Order Date (descending)
- Date Range: Last 7 Days

"Monthly Inventory"
- Fields: Product, Current Qty, Warehouse
- Condition: Current Qty < 100
- Sort: By Current Qty (ascending)
- Date Range: This Month

"Supplier Performance"
- Fields: Supplier, PO Count, On-Time %
- Condition: Status = "Completed"
- Sort: By Supplier Name
- Date Range: Last Month
```

### Managing Saved Reports
```
Load:   Click the saved report name
Edit:   Load it, modify, save with same name
Delete: Click trash icon [🗑️] next to name
```

---

## Feature 5: Report Downloads

### What It Does
Automatically tracks all Excel files you export and lets you re-download them.

### Why Use It
**Scenario**: You exported a report yesterday, now you need it again
- **Without Downloads**: Regenerate the report (takes time)
- **With Downloads**: Click download icon to get it instantly

### How It Works
```
Automatic Tracking:
1. You click "Export Excel"
2. File downloads to your device
3. Download is automatically tracked
4. Entry appears in "Report Downloads" section

No action needed - it happens automatically!
```

### What's Tracked
```
For each download, the system records:
- Report Name (e.g., "Purchase Orders")
- Module Type (e.g., "purchase_orders")
- Date Range Applied (e.g., "01/07/2026 to 31/07/2026")
- Generation Time (e.g., "14/08/2026 10:30 AM")
- Filename (e.g., "purchase_orders_Report_1723654200000.xlsx")
```

### How to Use Downloads
```
Location: Left sidebar, bottom section "Report Downloads"

View History:
- Scroll to "Report Downloads" section
- See all exported reports with details
- Shows download count badge

Re-download Old Report:
- Find report in "Report Downloads"
- Click download icon [⬇️]
- File downloads instantly
- No need to regenerate

Remove from History:
- Find report in "Report Downloads"
- Click trash icon [🗑️]
- Entry removed

Clear All History:
- Click "Clear history" button at bottom
- All entries deleted
- Frees up browser storage
```

### Example Download History
```
Report Downloads (5 reports)

📄 Purchase Orders
   purchase_orders | 01/07-31/07 | 14/08 10:30 AM
   [⬇️] [🗑️]

📄 Inventory Report
   inventory | 01/08-31/08 | 14/08 09:15 AM
   [⬇️] [🗑️]

📄 GRN Report
   grn | 01/08-31/08 | 13/08 02:45 PM
   [⬇️] [🗑️]

[Clear history]
```

---

## Complete Workflow Example

### Scenario: Weekly Purchase Order Report

#### Week 1: Create and Save
```
Step 1: Configure
  - Select "Purchase Orders" module
  - Select fields: PO Number, Order Date, Supplier, Status, Amount
  - Add condition: Status = "Pending"
  - Add sort: By Order Date (descending)
  - Set date range: Last 7 Days
  - Click "Preview" to verify

Step 2: Save
  - Click "Save current"
  - Enter name: "Weekly Pending POs"
  - Click "Save"

Step 3: Export
  - Click "Export Excel"
  - File downloads
  - Entry appears in "Report Downloads"
```

#### Week 2: Reuse and Track
```
Step 1: Load Saved Report
  - Click "Weekly Pending POs" in Saved Reports
  - All configuration loads instantly

Step 2: Generate Report
  - Click "Preview" to see data
  - Click "Export Excel" to download

Step 3: Access Previous Week's Report
  - Scroll to "Report Downloads"
  - Find last week's entry
  - Click download icon [⬇️]
  - Last week's file downloads instantly
```

---

## Feature Comparison

| Feature | Purpose | Storage | How Often Used |
|---------|---------|---------|----------------|
| **Report Period** | Select date range | UI State | Every report |
| **Conditions** | Filter data | UI State | Most reports |
| **Sort By** | Order results | UI State | Most reports |
| **Saved Reports** | Reuse configuration | Database | Weekly/Monthly |
| **Report Downloads** | Track exports | Browser | As needed |

---

## Quick Reference

### Keyboard Shortcuts
```
None yet - all features use mouse/touch
```

### Common Tasks

**Generate a report once:**
```
1. Select report module
2. Select fields
3. Set date range (defaults to Last Month)
4. Click "Preview" or "Export Excel"
```

**Generate same report weekly:**
```
1. Configure report
2. Click "Save current" and save it
3. Next week: Click saved report name
4. Click "Export Excel"
```

**Find an old report:**
```
1. Scroll to "Report Downloads"
2. Find the report
3. Click download icon [⬇️]
```

**Change a saved report:**
```
1. Load the saved report
2. Modify configuration
3. Click "Save current" with same name
4. Click "Save"
```

---

## Tips & Tricks

### For Better Reports
1. ✅ Use descriptive saved report names
2. ✅ Save frequently used configurations
3. ✅ Use conditions to filter unnecessary data
4. ✅ Sort by most important field first
5. ✅ Select only fields you need (faster export)

### For Better Performance
1. ✅ Use specific date ranges (smaller datasets)
2. ✅ Add conditions to reduce data
3. ✅ Clear old downloads periodically
4. ✅ Delete unused saved reports

### For Better Organization
1. ✅ Name saved reports clearly (e.g., "Weekly Pending POs" not "Report 1")
2. ✅ Include frequency in name (e.g., "Daily", "Weekly", "Monthly")
3. ✅ Include criteria in name (e.g., "Low Stock", "Pending", "Overdue")
4. ✅ Clean up download history regularly

---

## Limitations

### Saved Reports
- ✅ Can save unlimited reports
- ⚠️ Tied to specific report module
- ⚠️ Private to logged-in user
- ⚠️ Deleted if you delete the account

### Report Downloads
- ✅ Automatic tracking
- ⚠️ Stored in browser only (not synced across devices)
- ⚠️ Limited to ~5MB of storage
- ⚠️ Cleared if browser cache is cleared
- ⚠️ Shows last 100 downloads

---

## Troubleshooting

### Saved Report Not Saving
```
❌ Error: "Report key is required"
✅ Solution: Make sure you selected a report module first

❌ Error: "Name is required"
✅ Solution: Enter a name for the saved report

❌ Report not appearing in list
✅ Solution: Refresh the page
```

### Downloads Not Showing
```
❌ Downloads list is empty
✅ Solution: Export a report first

❌ Download disappeared
✅ Solution: Browser cache was cleared
✅ Solution: Click "Clear history" was used
```

### Date Range Not Working
```
❌ Still seeing data outside date range
✅ Solution: Refresh the page
✅ Solution: Select date range again and click Preview

❌ Can't select custom dates
✅ Solution: Click "Custom Date Range" button first
```

---

## Summary

The Reports section now provides:

✅ **Easy Date Selection** - Preset options + custom dates
✅ **Powerful Filtering** - Add multiple conditions
✅ **Flexible Sorting** - Sort by multiple fields
✅ **Configuration Reuse** - Save and load setups
✅ **Download Tracking** - Track and re-download files

All designed to make reporting **simple**, **fast**, and **efficient**! 🚀
