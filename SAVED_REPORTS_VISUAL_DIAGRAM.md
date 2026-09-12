# Saved Reports & Downloads - Visual Diagram

## User Interface Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REPORTS PAGE                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────────────┐
│   LEFT SIDEBAR (3)       │      MAIN CONTENT AREA (9)               │
│                          │                                          │
│ ┌────────────────────┐   │  ┌──────────────┬──────────────────────┐│
│ │ 📅 REPORT PERIOD   │   │  │ CONDITIONS   │   SORT BY            ││
│ │ [Last Month] ✓     │   │  │              │                      ││
│ │ Applied Range:     │   │  │ [Add cond.]  │ [Add sort]           ││
│ │ 01/07 to 31/07     │   │  └──────────────┴──────────────────────┘│
│ └────────────────────┘   │                                          │
│                          │  ┌──────────────────────────────────────┐│
│ ┌────────────────────┐   │  │         PREVIEW TABLE              ││
│ │ 📋 FIELDS          │   │  │  [Preview] [Export Excel]          ││
│ │ ☑ Product Name     │   │  │  Data rows...                      ││
│ │ ☑ Supplier         │   │  └──────────────────────────────────────┘│
│ │ ☑ Status           │   │                                          │
│ └────────────────────┘   │                                          │
│                          │                                          │
│ ┌────────────────────┐   │                                          │
│ │ ↕️ COLUMN SELECTOR  │   │                                          │
│ │ 1. Product Name    │   │                                          │
│ │ 2. Supplier        │   │                                          │
│ │ 3. Status          │   │                                          │
│ └────────────────────┘   │                                          │
│                          │                                          │
│ ┌────────────────────┐   │                                          │
│ │ 💾 SAVED REPORTS   │   │  ← FEATURE 1: SAVE CONFIGURATIONS      │
│ │ [Save current]     │   │                                          │
│ │                    │   │                                          │
│ │ 📁 Weekly POs      │   │                                          │
│ │ 📁 Inventory-Low   │   │                                          │
│ │ 📁 GRN-Monthly     │   │                                          │
│ │                    │   │                                          │
│ │ Click to load →    │   │                                          │
│ │ All config         │   │                                          │
│ │ loads instantly    │   │                                          │
│ └────────────────────┘   │                                          │
│                          │                                          │
│ ┌────────────────────┐   │                                          │
│ │ 📥 REPORT          │   │  ← FEATURE 2: TRACK DOWNLOADS          │
│ │ DOWNLOADS          │   │                                          │
│ │ 5 reports          │   │                                          │
│ │                    │   │                                          │
│ │ 📄 Purchase Orders │   │                                          │
│ │    01/07-31/07     │   │                                          │
│ │    14/08 10:30 AM  │   │                                          │
│ │    [⬇️] [🗑️]       │   │                                          │
│ │                    │   │                                          │
│ │ 📄 Inventory       │   │                                          │
│ │    01/08-31/08     │   │                                          │
│ │    14/08 09:15 AM  │   │                                          │
│ │    [⬇️] [🗑️]       │   │                                          │
│ │                    │   │                                          │
│ │ [Clear history]    │   │                                          │
│ └────────────────────┘   │                                          │
│                          │                                          │
└──────────────────────────┴──────────────────────────────────────────┘
```

---

## Feature 1: Saved Reports - Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAVED REPORTS WORKFLOW                       │
└─────────────────────────────────────────────────────────────────┘

WEEK 1: CREATE & SAVE
═══════════════════════════════════════════════════════════════════

Step 1: Configure Report
┌──────────────────────────────────────────────────────────────┐
│ 1. Select "Purchase Orders" module                           │
│ 2. Select fields: PO Number, Supplier, Status, Amount       │
│ 3. Add condition: Status = "Pending"                        │
│ 4. Add sort: By Order Date (descending)                     │
│ 5. Set date range: Last 7 Days                              │
│ 6. Click "Preview" to verify                                │
└──────────────────────────────────────────────────────────────┘
                              ↓
Step 2: Save Configuration
┌──────────────────────────────────────────────────────────────┐
│ Click "Save current" in Saved Reports panel                 │
│ Enter name: "Weekly Pending POs"                            │
│ Click "Save"                                                 │
│                                                              │
│ ✅ Configuration saved to database                          │
│ ✅ Appears in Saved Reports list                            │
└──────────────────────────────────────────────────────────────┘
                              ↓
Step 3: Export Report
┌──────────────────────────────────────────────────────────────┐
│ Click "Export Excel"                                         │
│ File downloads: purchase_orders_Report_1723654200000.xlsx   │
│                                                              │
│ ✅ Download tracked in "Report Downloads"                   │
│ ✅ Entry shows: Report name, date range, time               │
└──────────────────────────────────────────────────────────────┘


WEEK 2: REUSE SAVED REPORT
═══════════════════════════════════════════════════════════════════

Step 1: Load Saved Report
┌──────────────────────────────────────────────────────────────┐
│ Click "Weekly Pending POs" in Saved Reports                 │
│                                                              │
│ ✅ Report module selected: Purchase Orders                  │
│ ✅ Fields loaded: PO Number, Supplier, Status, Amount       │
│ ✅ Condition loaded: Status = "Pending"                     │
│ ✅ Sort loaded: By Order Date (descending)                  │
│ ✅ Date range loaded: Last 7 Days                           │
│                                                              │
│ Everything loads in 1 click! 🎉                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
Step 2: Generate Report
┌──────────────────────────────────────────────────────────────┐
│ Click "Preview" to see data                                  │
│ OR                                                            │
│ Click "Export Excel" to download directly                    │
│                                                              │
│ ✅ Same configuration as last week                          │
│ ✅ Fresh data from database                                 │
└──────────────────────────────────────────────────────────────┘
                              ↓
Step 3: Access Previous Week's Report
┌──────────────────────────────────────────────────────────────┐
│ Scroll to "Report Downloads" section                         │
│ Find last week's "Weekly Pending POs" entry                 │
│ Click download icon [⬇️]                                     │
│                                                              │
│ ✅ Last week's file downloads instantly                     │
│ ✅ No need to regenerate                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Report Downloads - Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                 REPORT DOWNLOADS WORKFLOW                   │
└─────────────────────────────────────────────────────────────┘

AUTOMATIC TRACKING
═══════════════════════════════════════════════════════════════════

User Action: Click "Export Excel"
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend generates Excel file                                 │
│ File downloads to user's device                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend automatically tracks download:                       │
│ - Report name: "Purchase Orders"                            │
│ - Module: "purchase_orders"                                 │
│ - Date range: "01/07/2026 to 31/07/2026"                   │
│ - Generated at: "14/08/2026 10:30 AM"                       │
│ - Filename: "purchase_orders_Report_1723654200000.xlsx"     │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ Entry saved to browser localStorage                          │
│ Appears in "Report Downloads" section                        │
│ ✅ User sees download in history                            │
└──────────────────────────────────────────────────────────────┘


USING DOWNLOAD HISTORY
═══════════════════════════════════════════════════════════════════

View History
┌──────────────────────────────────────────────────────────────┐
│ Scroll to "Report Downloads" in left sidebar                │
│ See all exported reports with:                               │
│ - Report name                                                │
│ - Module type                                                │
│ - Date range applied                                         │
│ - Generation timestamp                                       │
│ - Download count badge                                       │
└──────────────────────────────────────────────────────────────┘

Re-download Old Report
┌──────────────────────────────────────────────────────────────┐
│ Find report in "Report Downloads"                            │
│ Click download icon [⬇️]                                     │
│ File downloads again instantly                               │
│ ✅ No need to regenerate                                    │
│ ✅ Saves time and server resources                          │
└──────────────────────────────────────────────────────────────┘

Remove from History
┌──────────────────────────────────────────────────────────────┐
│ Find report in "Report Downloads"                            │
│ Click trash icon [🗑️]                                       │
│ Entry removed from history                                   │
│ ✅ Keeps list clean                                         │
└──────────────────────────────────────────────────────────────┘

Clear All History
┌──────────────────────────────────────────────────────────────┐
│ Scroll to bottom of "Report Downloads"                       │
│ Click "Clear history" button                                 │
│ All entries deleted                                          │
│ ✅ Saves browser storage space                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SAVED REPORTS DATA FLOW                  │
└─────────────────────────────────────────────────────────────┘

User Configures Report
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend State (useReportBuilder hook)                       │
│ - selectedFields: ["poNumber", "supplierName", ...]         │
│ - filters: { condition: "and", groups: [...] }              │
│ - sort: [{ fieldKey: "orderDate", direction: -1 }]          │
│ - dateRange: { startDate: "2026-08-07", endDate: "2026-08-14" }
└──────────────────────────────────────────────────────────────┘
         ↓
User Clicks "Save current"
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend sends POST request to backend                       │
│ POST /reports/{reportKey}/saved                             │
│ Body: {                                                      │
│   name: "Weekly Pending POs",                               │
│   config: {                                                  │
│     selectedFields: [...],                                  │
│     filters: {...},                                         │
│     sort: [...],                                            │
│     dateRange: {...}                                        │
│   }                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend (report.controller.js)                               │
│ - Validates payload                                          │
│ - Creates SavedReport document                               │
│ - Saves to MongoDB                                           │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ MongoDB (savedreports collection)                            │
│ Document saved with:                                         │
│ - name: "Weekly Pending POs"                                │
│ - reportKey: "purchase_orders"                              │
│ - config: {...}                                             │
│ - createdBy: "user@example.com"                             │
│ - createdAt: timestamp                                      │
└──────────────────────────────────────────────────────────────┘
         ↓
User Loads Saved Report (clicks name)
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend fetches saved report from backend                   │
│ GET /reports/saved/{id}                                     │
│ Returns: { name, reportKey, config, ... }                   │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend loads configuration into state                      │
│ - selectedFields = config.selectedFields                     │
│ - filters = config.filters                                  │
│ - sort = config.sort                                        │
│ - dateRange = config.dateRange                              │
│                                                              │
│ ✅ All UI updates automatically                             │
│ ✅ User sees all previous settings                          │
└──────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                   REPORT DOWNLOADS DATA FLOW                │
└─────────────────────────────────────────────────────────────┘

User Clicks "Export Excel"
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend sends POST request to backend                       │
│ POST /reports/{reportKey}/export                            │
│ Body: { selectedFields, filters, sort, dateRange }          │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend generates Excel file                                 │
│ - Queries database                                           │
│ - Formats data                                               │
│ - Creates Excel workbook                                     │
│ - Sends as blob response                                     │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend receives blob                                       │
│ - Downloads file to user's device                            │
│ - Calls addReportDownload() function                         │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend creates download entry                              │
│ {                                                            │
│   id: 1723654200000,                                         │
│   reportName: "Purchase Orders",                             │
│   module: "purchase_orders",                                 │
│   dateRange: "01/07/2026 to 31/07/2026",                    │
│   generatedAt: "14/08/2026 10:30 AM",                       │
│   filename: "purchase_orders_Report_1723654200000.xlsx",     │
│   timestamp: 1723654200000                                   │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Browser localStorage                                         │
│ Key: "reportDownloads"                                       │
│ Value: [download1, download2, download3, ...]               │
│                                                              │
│ ✅ Persists across page refreshes                           │
│ ✅ Persists across browser restarts                         │
│ ✅ Cleared only when user clears cache                      │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend displays in "Report Downloads" section              │
│ - Shows all entries from localStorage                        │
│ - User can re-download, remove, or clear                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Comparison: Saved Reports vs Report Downloads

```
┌─────────────────────────────────────────────────────────────┐
│                      FEATURE COMPARISON                     │
└─────────────────────────────────────────────────────────────┘

                    SAVED REPORTS    │    REPORT DOWNLOADS
────────────────────────────────────┼─────────────────────────
Purpose             Save config      │    Track exports
                    for reuse        │    
────────────────────────────────────┼─────────────────────────
What's Saved        Fields           │    Excel filename
                    Filters          │    Report name
                    Sorting          │    Date range
                    Date range       │    Generation time
────────────────────────────────────┼─────────────────────────
Storage             MongoDB          │    Browser localStorage
                    Database         │    (Local only)
────────────────────────────────────┼─────────────────────────
Persistence         Permanent        │    Until cleared
                    (until deleted)  │    or cache cleared
────────────────────────────────────┼─────────────────────────
User-Specific       Yes              │    Yes (per browser)
────────────────────────────────────┼─────────────────────────
Main Use Case       Reuse config     │    Re-download files
                    Quickly          │    Avoid regenerating
────────────────────────────────────┼─────────────────────────
Can Share           Future feature   │    No (local only)
────────────────────────────────────┼─────────────────────────
Automatic           Manual save      │    Automatic on export
                    (user clicks)    │    (no action needed)
────────────────────────────────────┼─────────────────────────
Example             "Weekly POs"     │    "Purchase Orders
                    config saved     │    01/07-31/07
                                     │    14/08 10:30 AM"
────────────────────────────────────┼─────────────────────────
```

---

## Summary

**Saved Reports** = Configuration Management
- Save report setup once
- Load and use repeatedly
- Perfect for recurring reports

**Report Downloads** = File Management
- Automatically track exported files
- Re-download without regenerating
- Keep history of what was exported

Together, they make reporting **faster**, **easier**, and **more efficient**! 🚀
