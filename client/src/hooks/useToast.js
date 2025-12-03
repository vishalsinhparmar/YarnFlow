import toast from 'react-hot-toast';

const useToast = () => {
    
    // Success toast for create/update operations
    const toastSuccess = (message) => {
        return toast.success(message, {
            duration: 3000,
            position: 'top-right',
            style: {
                background: '#10B981',
                color: '#fff',
                fontWeight: '500',
                borderRadius: '8px',
                padding: '12px 16px'
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#10B981'
            }
        });
    };

    // Error toast for failed operations
    const toastError = (message) => {
        return toast.error(message, {
            duration: 4000,
            position: 'top-right',
            style: {
                background: '#EF4444',
                color: '#fff',
                fontWeight: '500',
                borderRadius: '8px',
                padding: '12px 16px'
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#EF4444'
            }
        });
    };

    // Info toast for general information
    const toastInfo = (message) => {
        return toast(message, {
            duration: 3000,
            position: 'top-right',
            icon: 'ℹ️',
            style: {
                background: '#3B82F6',
                color: '#fff',
                fontWeight: '500',
                borderRadius: '8px',
                padding: '12px 16px'
            }
        });
    };

    // Warning toast
    const toastWarning = (message) => {
        return toast(message, {
            duration: 3000,
            position: 'top-right',
            icon: '⚠️',
            style: {
                background: '#F59E0B',
                color: '#fff',
                fontWeight: '500',
                borderRadius: '8px',
                padding: '12px 16px'
            }
        });
    };

 
    // Customer specific toast messages
    const customerToasts = {
        createSuccess: (name) => toastSuccess(`✅ Customer "${name}" created successfully!`),
        updateSuccess: (name) => toastSuccess(`✅ Customer "${name}" updated successfully!`),
        deleteSuccess: (name) => toastSuccess(`🗑️ Customer "${name}" deleted successfully!`),
        createError: () => toastError('❌ Failed to create customer. Please try again.'),
        updateError: () => toastError('❌ Failed to update customer. Please try again.'),
        deleteError: () => toastError('❌ Failed to delete customer. Please try again.'),
        loadError: () => toastError('❌ Failed to load customers. Please refresh the page.')
    };

    // Supplier specific toast messages
    const supplierToasts = {
        createSuccess: (name) => toastSuccess(`✅ Supplier "${name}" created successfully!`),
        updateSuccess: (name) => toastSuccess(`✅ Supplier "${name}" updated successfully!`),
        deleteSuccess: (name) => toastSuccess(`🗑️ Supplier "${name}" deleted successfully!`),
        createError: (error) => {
            const errorMessage = error?.message || 'Failed to create supplier';
            return toastError(`❌ ${errorMessage}`);
        },
        updateError: (error) => {
            const errorMessage = error?.message || 'Failed to update supplier';
            return toastError(`❌ ${errorMessage}`);
        },
        deleteError: () => toastError('❌ Failed to delete supplier. Please try again.'),
        loadError: () => toastError('❌ Failed to load suppliers. Please refresh the page.'),
        validationError: (message) => toastError(`📝 ${message}`)
    };

    // Category specific toast messages
    const categoryToasts = {
        createSuccess: (name) => toastSuccess(`✅ Category "${name}" created successfully!`),
        updateSuccess: (name) => toastSuccess(`✅ Category "${name}" updated successfully!`),
        deleteSuccess: (name) => toastSuccess(`🗑️ Category "${name}" deleted successfully!`),
        createError: () => toastError('❌ Failed to create category. Please try again.'),
        updateError: () => toastError('❌ Failed to update category. Please try again.'),
        deleteError: () => toastError('❌ Failed to delete category. Please try again.'),
        loadError: () => toastError('❌ Failed to load categories. Please refresh the page.')
    };

    // Product specific toast messages
    const productToasts = {
        createSuccess: (name) => toastSuccess(`✅ Product "${name}" created successfully!`),
        updateSuccess: (name) => toastSuccess(`✅ Product "${name}" updated successfully!`),
        deleteSuccess: (name) => toastSuccess(`🗑️ Product "${name}" deleted successfully!`),
        createError: () => toastError('❌ Failed to create product. Please try again.'),
        updateError: () => toastError('❌ Failed to update product. Please try again.'),
        deleteError: () => toastError('❌ Failed to delete product. Please try again.'),
        loadError: () => toastError('❌ Failed to load products. Please refresh the page.')
    };

    // Purchase Order specific toast messages
    const purchaseOrderToasts = {
        createSuccess: (poNumber) => toastSuccess(`✅ Purchase Order "${poNumber}" created successfully!`),
        updateSuccess: (poNumber) => toastSuccess(`✅ Purchase Order "${poNumber}" updated successfully!`),
        deleteSuccess: (poNumber) => toastSuccess(`🗑️ Purchase Order "${poNumber}" deleted successfully!`),
        approveSuccess: (poNumber) => toastSuccess(`✅ Purchase Order "${poNumber}" approved successfully!`),
        createError: () => toastError('❌ Failed to create purchase order. Please try again.'),
        updateError: () => toastError('❌ Failed to update purchase order. Please try again.'),
        deleteError: () => toastError('❌ Failed to delete purchase order. Please try again.'),
        loadError: () => toastError('❌ Failed to load purchase orders. Please refresh the page.')
    };

    // Goods Receipt Note specific toast messages
    const grnToasts = {
        createSuccess: (grnNumber) => toastSuccess(`✅ GRN "${grnNumber}" created successfully!`),
        approveSuccess: (grnNumber) => toastSuccess(`✅ GRN "${grnNumber}" approved successfully!`),
        updateSuccess: (grnNumber) => toastSuccess(`✅ GRN "${grnNumber}" updated successfully!`),
        createError: () => toastError('❌ Failed to create GRN. Please try again.'),
        approveError: () => toastError('❌ Failed to approve GRN. Please try again.'),
        loadError: () => toastError('❌ Failed to load GRNs. Please refresh the page.')
    };

    // Sales Order specific toast messages
    const salesOrderToasts = {
        createSuccess: (soNumber) => toastSuccess(`✅ Sales Order "${soNumber}" created successfully!`),
        updateSuccess: (soNumber) => toastSuccess(`✅ Sales Order "${soNumber}" updated successfully!`),
        deleteSuccess: (soNumber) => toastSuccess(`🗑️ Sales Order "${soNumber}" deleted successfully!`),
        approveSuccess: (soNumber) => toastSuccess(`✅ Sales Order "${soNumber}" approved successfully!`),
        createError: () => toastError('❌ Failed to create sales order. Please try again.'),
        updateError: () => toastError('❌ Failed to update sales order. Please try again.'),
        deleteError: () => toastError('❌ Failed to delete sales order. Please try again.'),
        loadError: () => toastError('❌ Failed to load sales orders. Please refresh the page.')
    };

    // Sales Challan specific toast messages
    const salesChallanToasts = {
        createSuccess: (challanNumber) => toastSuccess(`✅ Sales Challan "${challanNumber}" created successfully!`),
        updateSuccess: (challanNumber) => toastSuccess(`✅ Sales Challan "${challanNumber}" updated successfully!`),
        deleteSuccess: (challanNumber) => toastSuccess(`🗑️ Sales Challan "${challanNumber}" deleted successfully!`),
        dispatchSuccess: (challanNumber) => toastSuccess(`✅ Sales Challan "${challanNumber}" dispatched successfully!`),
        createError: () => toastError('❌ Failed to create sales challan. Please try again.'),
        updateError: () => toastError('❌ Failed to update sales challan. Please try again.'),
        deleteError: () => toastError('❌ Failed to delete sales challan. Please try again.'),
        loadError: () => toastError('❌ Failed to load sales challans. Please refresh the page.')
    };

    return { 
        toastSuccess, 
        toastError, 
        toastInfo, 
        toastWarning,
        customerToasts,
        supplierToasts,
        categoryToasts,
        productToasts,
        purchaseOrderToasts,
        grnToasts,
        salesOrderToasts,
        salesChallanToasts
    };
}

export default useToast;