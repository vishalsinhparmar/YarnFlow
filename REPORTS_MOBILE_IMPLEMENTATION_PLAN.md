# REPORTS MOBILE APP - IMPLEMENTATION PLAN

**Date**: 2026-09-10  
**Status**: Implementation in progress

---

## CURRENT STATE ANALYSIS

### ✅ Already Implemented in Mobile
1. **Module Selection** - Report module picker
2. **Date Range** - Start/End date selection with quick buttons
3. **Field Selection** - Checkbox-based field selection with grouping
4. **Filters** - Add/remove filters with operators and values
5. **Sort** - Add/remove sort fields with direction toggle
6. **Preview** - Table preview with pagination
7. **Export** - Excel and PDF export buttons
8. **Save Template** - Save/update report templates
9. **Saved Reports Tab** - View and load saved reports
10. **Downloads Tab** - View and download exported reports

### ❌ Missing/Incomplete Features
1. **Field Reordering** - No drag-to-reorder for selected fields
2. **Column Visibility** - No way to toggle field visibility in preview
3. **Field Order Management** - Selected fields appear in selection order, not customizable
4. **Visual Feedback** - No drag indicators or visual feedback
5. **Mobile-Optimized Filters** - Filter UI could be more mobile-friendly
6. **Field Grouping in Preview** - No way to group fields by category

---

## IMPLEMENTATION ROADMAP

### PHASE 1: Field Reordering (PRIORITY: HIGH)
**Goal**: Allow users to drag fields to reorder them in the report

**Components to Create**:
1. `DraggableFieldList.tsx` - Draggable field list component
2. Update `ReportBuilderTab.tsx` - Integrate draggable fields

**Implementation Details**:
- Use `react-native-reanimated` for smooth animations
- Use `react-native-gesture-handler` for drag gestures
- Show drag handle icon on each field
- Visual feedback during drag (opacity, scale)
- Drop zone highlighting
- Haptic feedback on drag start/end

**Expected Changes**:
```typescript
// Before: Static field order
selectedFields: ['field1', 'field2', 'field3']

// After: User can reorder
selectedFields: ['field3', 'field1', 'field2']
```

### PHASE 2: Column Visibility Toggle (PRIORITY: HIGH)
**Goal**: Allow users to hide/show columns in preview without deselecting

**Components to Create**:
1. `ColumnVisibilityPanel.tsx` - Toggle visibility of columns
2. Update `ReportBuilderTab.tsx` - Add visibility toggle UI

**Implementation Details**:
- Separate "selected" from "visible" state
- Each field has: selected, visible, order
- Toggle visibility without removing from report
- Show/hide columns in preview dynamically

**Expected Changes**:
```typescript
// New state structure
fields: {
  field1: { selected: true, visible: true, order: 0 },
  field2: { selected: true, visible: false, order: 1 },
  field3: { selected: true, visible: true, order: 2 }
}
```

### PHASE 3: Mobile-Optimized Filter UI (PRIORITY: MEDIUM)
**Goal**: Improve filter UX for mobile devices

**Changes**:
1. Collapsible filter cards
2. Better operator selection (chips instead of buttons)
3. Improved value input (larger touch targets)
4. Swipe to delete filters
5. Filter templates/presets

### PHASE 4: Enhanced Sort UI (PRIORITY: MEDIUM)
**Goal**: Better sort field management

**Changes**:
1. Drag-to-reorder sort fields
2. Visual sort priority indicators
3. Quick sort buttons (A-Z, Z-A, etc.)

### PHASE 5: Advanced Features (PRIORITY: LOW)
**Goal**: Additional report features

**Changes**:
1. Report templates/presets
2. Scheduled reports
3. Report sharing
4. Custom field calculations
5. Conditional formatting

---

## TECHNICAL IMPLEMENTATION DETAILS

### Dependencies Already Available
- `react-native-reanimated` v4.1.1 ✅
- `react-native-gesture-handler` v2.28.0 ✅
- `expo-haptics` v15.0.7 ✅

### New Dependencies (if needed)
- None required for Phase 1-2

### File Structure
```
components/reports/
├── ReportBuilderTab.tsx (main component)
├── DraggableFieldList.tsx (NEW - Phase 1)
├── ColumnVisibilityPanel.tsx (NEW - Phase 2)
├── FilterBuilder.tsx (existing)
├── SortBuilder.tsx (existing)
├── PreviewPanel.tsx (existing)
└── ...
```

---

## IMPLEMENTATION SEQUENCE

### Week 1: Phase 1 (Field Reordering)
- [ ] Create `DraggableFieldList.tsx`
- [ ] Implement drag gesture handling
- [ ] Add visual feedback
- [ ] Integrate into `ReportBuilderTab.tsx`
- [ ] Test on iOS and Android

### Week 2: Phase 2 (Column Visibility)
- [ ] Create `ColumnVisibilityPanel.tsx`
- [ ] Implement visibility toggle logic
- [ ] Update preview to respect visibility
- [ ] Add UI for visibility management
- [ ] Test end-to-end

### Week 3: Phase 3 (Filter UI)
- [ ] Improve filter card design
- [ ] Add swipe-to-delete
- [ ] Better operator selection
- [ ] Larger touch targets

### Week 4: Phase 4 & 5
- [ ] Sort UI improvements
- [ ] Advanced features
- [ ] Testing and refinement

---

## SUCCESS CRITERIA

### Phase 1: Field Reordering
- [ ] Users can drag fields to reorder
- [ ] Visual feedback during drag
- [ ] Order persists in preview
- [ ] Works on iOS and Android
- [ ] Smooth 60 FPS animations

### Phase 2: Column Visibility
- [ ] Users can toggle column visibility
- [ ] Visibility doesn't affect field selection
- [ ] Preview updates dynamically
- [ ] Visibility state persists in template

### Phase 3: Filter UI
- [ ] Filters are easier to use on mobile
- [ ] Touch targets are at least 44x44 points
- [ ] Swipe-to-delete works smoothly
- [ ] No accidental deletions

---

## TESTING PLAN

### Unit Tests
- Field reordering logic
- Visibility toggle logic
- Filter validation
- Sort ordering

### Integration Tests
- Field selection + reordering + preview
- Filter + sort + preview
- Save/load template with field order
- Export with correct field order

### Manual Tests
- Test on iPhone (iOS)
- Test on Android phone
- Test on tablet
- Test with slow network
- Test with large datasets

---

## ROLLOUT PLAN

### Phase 1: Internal Testing
- Deploy to TestFlight (iOS)
- Deploy to Google Play Beta (Android)
- Gather feedback from team

### Phase 2: Beta Release
- Release to limited beta users
- Monitor for issues
- Gather user feedback

### Phase 3: Production Release
- Release to all users
- Monitor error logs
- Support user questions

---

## NOTES

- All changes must maintain backward compatibility
- Existing saved reports must continue to work
- No breaking changes to API contracts
- Performance must remain excellent (60 FPS)
- Mobile-first design approach

