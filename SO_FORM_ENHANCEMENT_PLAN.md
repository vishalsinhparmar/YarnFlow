# Sales Order Form Enhancement Plan

**Status**: 🔄 IN PROGRESS  
**Date**: August 22, 2026

---

## Critical Issues Identified

### 1. ❌ Missing "+ Add Customer" Feature
**Current State**: Customer dropdown only shows existing customers  
**Required**: Add inline "+ Add Customer" option to create new customers on-the-fly  
**Reference**: PO form uses `InlineFormModal` + `SupplierFormScreen`  
**Implementation**: Add `InlineFormModal` + `CustomerFormScreen` to SO form

### 2. ❌ Old Date Picker UI
**Current State**: Using `DatePickerInput` component (old style)  
**Required**: Use modern `CalendarDatePicker` like PO form  
**Reference**: PO form imports `CalendarDatePicker` from `../../components/CalendarDatePicker`  
**Implementation**: Replace `DatePickerInput` with `CalendarDatePicker`

### 3. ❌ Duplicate Product/Sub-Product Rows
**Current State**: Multiple "Remove Sub-Product Row" links visible, confusing UI  
**Problem**: Product grouping shows all items without clear separation  
**Required**: Clear visual hierarchy - product card header, then sub-product rows  
**Implementation**: Improve `getProductGroups()` rendering with better UI structure

### 4. ❌ Poor Form Layout
**Current State**: Form elements not properly aligned, missing visual hierarchy  
**Required**: Professional production-level UI with clear sections  
**Implementation**: Improve styling and layout structure

### 5. ❌ Missing Error Handling
**Current State**: Backend errors not properly displayed  
**Required**: Show backend validation errors in form  
**Implementation**: Add error state management and display

---

## Implementation Steps

### Step 1: Add InlineFormModal and CustomerFormScreen imports
- Import `InlineFormModal` from `@/components/InlineFormModal`
- Import `CustomerFormScreen` from `@/app/master-data/customers/form`
- Add state for `showAddCustomerModal`

### Step 2: Replace DatePickerInput with CalendarDatePicker
- Import `CalendarDatePicker` from `../../components/CalendarDatePicker`
- Replace `DatePickerInput` component with `CalendarDatePicker`
- Update props to match CalendarDatePicker API

### Step 3: Improve Product/Sub-Product UI
- Better visual separation in product cards
- Clear product header with name and code
- Sub-product rows properly indented/styled
- Remove confusing "Remove Sub-Product Row" text duplication

### Step 4: Add "+ Add Customer" Button
- Add button next to customer dropdown
- Show `InlineFormModal` with `CustomerFormScreen`
- Refresh customer list after new customer created
- Set newly created customer as selected

### Step 5: Improve Error Handling
- Add error state for form validation
- Display backend errors in toast
- Show field-level errors if needed

---

## Files to Modify

1. **app/sales-orders/form.tsx** - Main form component
   - Add imports for InlineFormModal, CustomerFormScreen, CalendarDatePicker
   - Add state for showAddCustomerModal
   - Replace DatePickerInput with CalendarDatePicker
   - Add "+ Add Customer" button and handler
   - Improve product/sub-product rendering
   - Add error handling

---

## Expected Outcome

✅ Professional production-level SO form  
✅ "+ Add Customer" inline creation  
✅ Modern date picker UI  
✅ Clear product/sub-product hierarchy  
✅ Proper error handling  
✅ No duplicate confusing elements  

---

## Notes

- Reference PO form for implementation patterns
- Use existing components (InlineFormModal, CalendarDatePicker)
- Maintain backward compatibility
- Keep validation logic intact
- Ensure all workflows preserved

