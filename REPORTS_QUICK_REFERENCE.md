# YarnFlow Reports - Quick Reference Guide

## What's New

### 1. **Report Period Selector** 📅
- **Location**: Left sidebar, top section
- **Default**: Last Month (automatically applied)
- **Quick Options**: Today, Yesterday, This Week, This Month, Last 7 Days, Last 30 Days
- **Custom Range**: Toggle to select specific start and end dates
- **Display**: Applied date range shown in orange box

### 2. **Improved Terminology** 📝
| Old Term | New Term | Where |
|----------|----------|-------|
| Filters | Conditions | Filter section header |
| Add filter | Add condition | Filter action button |
| Sort | Sort By | Sort section header |
| Match | Combine groups | Filter group logic |

### 3. **Fixed Sort Functionality** ⬆️⬇️
- **How to Use**:
  1. Click "Add sort" button
  2. Select a field from dropdown
  3. Click "Asc" or "Desc" button to toggle direction
  4. Remove with trash icon
- **Improvements**: Better visual feedback, clearer direction indicators, proper validation

### 4. **Fixed Saved Reports** 💾
- **How to Save**:
  1. Configure your report (fields, conditions, sorting)
  2. Click "Save current" in Saved Reports panel
  3. Enter a report name
  4. Click "Save"
- **How to Load**: Click on any saved report name to instantly load it
- **Improvements**: Proper validation, clear error messages, no more "Report key required" error

### 5. **Report Downloads History** 📥
- **Location**: Left sidebar, bottom section
- **Shows**: Report name, module, date range, generation time
- **Actions**:
  - Download icon: Re-download the report
  - Trash icon: Remove from history
  - "Clear history" button: Remove all entries
- **Storage**: Browser localStorage (persists across sessions)

---

## User Workflows

### Generate a Basic Report
```
1. Open Reports section
2. Select report module (e.g., "Inventory")
3. Period defaults to "Last Month" ✓
4. Select columns you want
5. Click "Preview" to see data
6. Click "Export Excel" to download
```

### Filter Data
```
1. In "Conditions" section, click "Add condition"
2. Select field → Choose operator → Enter value
3. Click "Preview" to apply
4. Add more conditions if needed
```

### Sort Results
```
1. In "Sort By" section, click "Add sort"
2. Select field to sort by
3. Click "Asc" or "Desc" to set direction
4. Click "Preview" to see sorted results
5. Add up to 5 sort rules
```

### Save Report Configuration
```
1. Configure report (fields, conditions, sorting)
2. Click "Save current" in Saved Reports
3. Enter name (e.g., "Inventory - Low Stock")
4. Click "Save"
5. Next time: Click saved report name to load instantly
```

### Re-download Previous Report
```
1. Check "Report Downloads" section
2. Find the report you want
3. Click download icon to re-download
4. Or click trash to remove from history
```

---

## Keyboard Shortcuts & Tips

### Tips for Power Users
- **Multiple Conditions**: Use "Add group" to create complex logic (AND/OR)
- **Column Reordering**: Drag fields in Column Selector (if supported)
- **Quick Export**: Select fields → Click Export (uses Last Month by default)
- **Saved Templates**: Save frequently used configurations as saved reports

### Browser Tips
- **Download History**: Persists even after closing browser
- **Clearing History**: Use "Clear history" button in Report Downloads
- **Multiple Reports**: Open in new tabs to compare side-by-side

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Report key is required" error | Select a report module first |
| Sort not working | Ensure field is sortable (check definition) |
| No results in preview | Check date range and filter conditions |
| Can't save report | Select report module and enter report name |
| Download history empty | Generate and export a report first |

---

## Component Files

### Frontend Components
```
client/src/components/reports/
├── ReportBuilder.jsx          - Main container
├── DateRangeSelector.jsx      - Date range picker (NEW)
├── FilterBuilder.jsx          - Conditions builder
├── SortBuilder.jsx            - Sort builder (IMPROVED)
├── FieldPanel.jsx             - Column selector
├── ColumnSelector.jsx         - Selected columns manager
├── SavedReportsPanel.jsx      - Save/load configs (FIXED)
├── ReportDownloads.jsx        - Download history (NEW)
├── PreviewPanel.jsx           - Data preview table
└── useReportBuilder.js        - State management hook
```

### Backend APIs (Unchanged)
```
GET    /api/reports                          - List reports
GET    /api/reports/:reportKey/definition    - Get definition
POST   /api/reports/:reportKey/preview       - Preview data
POST   /api/reports/:reportKey/export        - Export Excel
GET    /api/reports/:reportKey/lookup-options/:fieldKey
GET    /api/reports/saved                    - List saved reports
POST   /api/reports/saved                    - Create saved report
PUT    /api/reports/saved/:id                - Update saved report
DELETE /api/reports/saved/:id                - Delete saved report
```

---

## Performance Notes

- **Preview**: Limited to 50 rows per page (configurable)
- **Export**: Limited to 50,000 rows (safety limit)
- **Date Range**: Calculated client-side (no server impact)
- **Download History**: Stored in browser localStorage
- **Sorting**: Performed server-side via MongoDB aggregation

---

## Future Enhancements

Planned for future versions:
- [ ] Server-side download history (tied to user account)
- [ ] Email report scheduling
- [ ] Report templates
- [ ] Chart visualizations
- [ ] PDF export
- [ ] Report sharing

---

## Support

For issues or questions:
1. Check the "Common Issues & Solutions" table above
2. Review the full documentation in `REPORTS_IMPROVEMENTS.md`
3. Check browser console for error messages
4. Verify report module is selected before saving

---

**Last Updated**: August 2026
**Version**: 2.0 (Improved & User-Friendly)
