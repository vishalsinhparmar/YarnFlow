# YarnFlow Reports - Visual Guide & Layout

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REPORTS HEADER                              │
│                    Reports | Build dynamic reports...               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      REPORT SELECTOR                                │
│  [Select report module ▼] (Choose a report...)                      │
│  Description: Build dynamic reports with custom fields...           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────────┐
│      LEFT SIDEBAR (3)        │     MAIN CONTENT AREA (9)            │
│                              │                                      │
│  ┌────────────────────────┐  │  ┌──────────────┬──────────────────┐│
│  │  📅 REPORT PERIOD      │  │  │  CONDITIONS  │   SORT BY        ││
│  │  ┌──────────────────┐  │  │  │              │                  ││
│  │  │ [Today]          │  │  │  │ Match: All   │ [Add sort]       ││
│  │  │ [Yesterday]      │  │  │  │ groups ▼     │                  ││
│  │  │ [This Week]      │  │  │  │              │ Field ▼ Asc ✕    ││
│  │  │ [This Month]     │  │  │  │ Group 1      │                  ││
│  │  │ [Last Month] ✓   │  │  │  │ And ▼        │                  ││
│  │  │ [Last 7 Days]    │  │  │  │              │                  ││
│  │  │ [Last 30 Days]   │  │  │  │ [Add cond.]  │                  ││
│  │  │ [Custom Range]   │  │  │  │              │                  ││
│  │  │                  │  │  │  │ [Clear]      │                  ││
│  │  │ Applied Range:   │  │  │  └──────────────┴──────────────────┘│
│  │  │ 01/07 to 31/07   │  │  │                                      │
│  │  └──────────────────┘  │  │  ┌──────────────────────────────────┐│
│  └────────────────────────┘  │  │         PREVIEW TABLE            ││
│                              │  │  ┌──────────────────────────────┐ ││
│  ┌────────────────────────┐  │  │  │ Field1 │ Field2 │ Field3     │ ││
│  │  📋 FIELDS             │  │  │  ├────────┼────────┼────────────┤ ││
│  │  ☑ Product Name        │  │  │  │ Value1 │ Value2 │ Value3     │ ││
│  │  ☑ Category            │  │  │  │ Value1 │ Value2 │ Value3     │ ││
│  │  ☐ Description         │  │  │  │ Value1 │ Value2 │ Value3     │ ││
│  │  ☑ Status              │  │  │  └──────────────────────────────┘ ││
│  │  ☐ Created Date        │  │  │  [Preview] [Export Excel]         ││
│  │  ☑ Updated Date        │  │  │  Page 1 of 5 (250 results)        ││
│  │                        │  │  └──────────────────────────────────┘│
│  └────────────────────────┘  │                                      │
│                              │                                      │
│  ┌────────────────────────┐  │                                      │
│  │  ↕️ COLUMN SELECTOR     │  │                                      │
│  │  1. Product Name  ↑ ✕   │  │                                      │
│  │  2. Category      ↑ ✕   │  │                                      │
│  │  3. Status        ↓ ✕   │  │                                      │
│  │                        │  │                                      │
│  └────────────────────────┘  │                                      │
│                              │                                      │
│  ┌────────────────────────┐  │                                      │
│  │  💾 SAVED REPORTS      │  │                                      │
│  │  [Save current]        │  │                                      │
│  │                        │  │                                      │
│  │  📁 Inventory - Low    │  │                                      │
│  │  📁 PO - Pending       │  │                                      │
│  │  📁 GRN - This Month   │  │                                      │
│  │                        │  │                                      │
│  │  No saved reports yet. │  │                                      │
│  └────────────────────────┘  │                                      │
│                              │                                      │
│  ┌────────────────────────┐  │                                      │
│  │  📥 REPORT DOWNLOADS   │  │                                      │
│  │  3 reports             │  │                                      │
│  │                        │  │                                      │
│  │  📄 Inventory Report   │  │                                      │
│  │     Inventory          │  │                                      │
│  │     01/07 to 31/07     │  │                                      │
│  │     14/08 10:30 AM     │  │                                      │
│  │     [↓] [✕]            │  │                                      │
│  │                        │  │                                      │
│  │  📄 PO Summary         │  │                                      │
│  │     Purchase Orders    │  │                                      │
│  │     01/07 to 31/07     │  │                                      │
│  │     14/08 09:15 AM     │  │                                      │
│  │     [↓] [✕]            │  │                                      │
│  │                        │  │                                      │
│  │  [Clear history]       │  │                                      │
│  └────────────────────────┘  │                                      │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Report Period Selector (NEW)
```
┌─────────────────────────────────────────┐
│ 📅 Report Period                        │
├─────────────────────────────────────────┤
│ [Today] [Yesterday] [This Week]         │
│ [This Month] [Last Month] [Last 7 Days] │
│ [Last 30 Days]                          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Custom Date Range]                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Applied Range:                      │ │
│ │ 01/07/2026 to 31/07/2026            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Features**:
- Quick preset buttons
- Default: Last Month
- Custom date range toggle
- Clear applied range display

---

### 2. Conditions Builder (Improved)
```
┌──────────────────────────────────────────┐
│ Conditions          [+ Add group]        │
├──────────────────────────────────────────┤
│ (Only shown if multiple groups)          │
│ Combine groups: [All groups ▼]           │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Group 1  [And ▼]      [Remove]     │   │
│ │                                    │   │
│ │ [Field ▼] [Operator ▼] [Value]  ✕ │   │
│ │ [Field ▼] [Operator ▼] [Value]  ✕ │   │
│ │                                    │   │
│ │ [+ Add condition]                  │   │
│ └────────────────────────────────────┘   │
│                                          │
│ [↺ Clear filters]                       │
└──────────────────────────────────────────┘
```

**Improvements**:
- "Conditions" instead of "Filters"
- "Add condition" instead of "Add filter"
- "Combine groups" label only when needed
- Better visual organization

---

### 3. Sort By Builder (Fixed)
```
┌──────────────────────────────────────────┐
│ Sort By             [+ Add sort]         │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ [Field ▼] [↑ Asc] [✕]              │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ [Field ▼] [↓ Desc] [✕]             │   │
│ └────────────────────────────────────┘   │
│                                          │
│ No sorting applied. Click "Add sort"     │
│ to sort results.                         │
└──────────────────────────────────────────┘
```

**Fixes**:
- "Sort By" instead of "Sort"
- Clear direction indicators (Asc/Desc)
- Better visual cards
- Helpful empty state message

---

### 4. Saved Reports Panel (Fixed)
```
┌──────────────────────────────────────────┐
│ 💾 Saved Reports    [Save current]       │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Report name...  [Save] [✕]         │   │
│ │ Report key is required             │   │
│ └────────────────────────────────────┘   │
│                                          │
│ 📁 Inventory - Low Stock        [✕]     │
│ 📁 PO - Pending Approval        [✕]     │
│ 📁 GRN - This Month             [✕]     │
│                                          │
│ No saved reports yet.                    │
└──────────────────────────────────────────┘
```

**Fixes**:
- Proper validation before save
- Clear error messages
- Report selection validation
- Better UX feedback

---

### 5. Report Downloads (NEW)
```
┌──────────────────────────────────────────┐
│ 📥 Report Downloads  3                   │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ 📄 Inventory Report                │   │
│ │    Inventory                       │   │
│ │    01/07 to 31/07                  │   │
│ │    14/08 10:30 AM                  │   │
│ │                        [↓] [✕]     │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ 📄 PO Summary                      │   │
│ │    Purchase Orders                 │   │
│ │    01/07 to 31/07                  │   │
│ │    14/08 09:15 AM                  │   │
│ │                        [↓] [✕]     │   │
│ └────────────────────────────────────┘   │
│                                          │
│ [Clear history]                          │
└──────────────────────────────────────────┘
```

**Features**:
- Track all generated reports
- Re-download capability
- Remove individual entries
- Clear entire history

---

## User Interaction Flows

### Flow 1: Generate Basic Report
```
START
  ↓
Select Report Module
  ↓
[Period defaults to Last Month] ✓
  ↓
Select Columns
  ↓
Click "Preview"
  ↓
View Data Table
  ↓
Click "Export Excel"
  ↓
Download File
  ↓
[Added to Report Downloads] ✓
  ↓
END
```

### Flow 2: Add Conditions
```
START
  ↓
Click "Add condition"
  ↓
Select Field
  ↓
Choose Operator
  ↓
Enter Value
  ↓
Click "Preview"
  ↓
View Filtered Data
  ↓
Add More Conditions (if needed)
  ↓
Click "Export Excel"
  ↓
END
```

### Flow 3: Save Report Configuration
```
START
  ↓
Configure Report
(fields, conditions, sorting)
  ↓
Click "Save current"
  ↓
Enter Report Name
  ↓
Click "Save"
  ↓
[Validation checks] ✓
  ↓
Report Saved
  ↓
[Appears in Saved Reports list] ✓
  ↓
END
```

### Flow 4: Load Saved Report
```
START
  ↓
Click Saved Report Name
  ↓
[Definition loads]
  ↓
[Config applied automatically]
  ↓
Fields Selected ✓
  ↓
Conditions Applied ✓
  ↓
Sorting Applied ✓
  ↓
Ready to Preview/Export
  ↓
END
```

---

## Color Scheme

### Primary Colors
- **Orange**: #FF6B35 (Actions, highlights, selected state)
- **Gray**: #6B7280 (Text, secondary elements)
- **White**: #FFFFFF (Backgrounds)
- **Light Gray**: #F3F4F6 (Card backgrounds)

### Status Colors
- **Success**: Green (Saved, completed)
- **Error**: Red (Errors, delete actions)
- **Info**: Blue (Information, help)
- **Warning**: Orange (Caution, alerts)

### Typography
- **Headers**: Bold, 16-18px
- **Labels**: Medium, 14px
- **Body**: Regular, 14px
- **Small**: Regular, 12px

---

## Responsive Behavior

### Desktop (1200px+)
```
┌─────────────────────────────────────────┐
│ Left Sidebar (3 cols) │ Main (9 cols)   │
│ Vertical stack        │ 2-column grid   │
└─────────────────────────────────────────┘
```

### Tablet (768px - 1199px)
```
┌──────────────────────────┐
│ Left Sidebar (4 cols)    │
│ Main Content (8 cols)    │
│ Stacked layout           │
└──────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────┐
│ Full Width       │
│ Single Column    │
│ Vertical Stack   │
└──────────────────┘
```

---

## Accessibility Features

- ✅ Clear labels on all inputs
- ✅ Descriptive button text
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ ARIA labels where needed
- ✅ Error messages in plain language
- ✅ Loading state indicators
- ✅ Disabled state styling

---

## Animation & Transitions

- **Smooth Transitions**: 200ms ease
- **Button Hover**: Subtle background change
- **Loading Spinner**: Smooth rotation
- **Fade In**: New content appears smoothly
- **Slide Down**: Dropdown menus slide smoothly

---

## Error States

### Invalid Date Range
```
┌─────────────────────────────────────────┐
│ ⚠️ Please select valid dates            │
│    (Start date must be before end date) │
└─────────────────────────────────────────┘
```

### Missing Report Selection
```
┌─────────────────────────────────────────┐
│ ⚠️ Please select a report first         │
└─────────────────────────────────────────┘
```

### No Results
```
┌─────────────────────────────────────────┐
│ 📊 No results match the current filters │
│    Try adjusting your conditions        │
└─────────────────────────────────────────┘
```

---

## Loading States

### Definition Loading
```
┌─────────────────────────────────────────┐
│         ⟳ Loading report definition...  │
└─────────────────────────────────────────┘
```

### Preview Loading
```
┌─────────────────────────────────────────┐
│         ⟳ Loading preview...            │
└─────────────────────────────────────────┘
```

### Export Loading
```
┌─────────────────────────────────────────┐
│ [⟳ Exporting...] [Export Excel]         │
└─────────────────────────────────────────┘
```

---

## Summary

The improved Reports section provides:
- ✅ Clear, intuitive layout
- ✅ User-friendly terminology
- ✅ Smart defaults (Last Month)
- ✅ Professional design
- ✅ Responsive layout
- ✅ Accessibility support
- ✅ Clear error messages
- ✅ Helpful loading states

All while maintaining full backward compatibility with existing functionality.
