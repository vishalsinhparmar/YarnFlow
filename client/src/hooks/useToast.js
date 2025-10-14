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
        created: () => toastSuccess('✅ Customer created successfully!'),
        updated: () => toastSuccess('✅ Customer updated successfully!'),
        deleted: (name) => toastSuccess(`🗑️ Customer "${name}" deleted successfully!`),
        createError: () => toastError('❌ Failed to create customer. Please try again.'),
        updateError: () => toastError('❌ Failed to update customer. Please try again.'),
        deleteError: () => toastError('❌ Failed to delete customer. Please try again.'),
        loadError: () => toastError('❌ Failed to load customers. Please refresh the page.')
    };

    // Supplier specific toast messages
    const supplierToasts = {
        created: () => toastSuccess('✅ Supplier created successfully!'),
        updated: () => toastSuccess('✅ Supplier updated successfully!'),
        deleted: (name) => toastSuccess(`🗑️ Supplier "${name}" deleted successfully!`),
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

    return { 
        toastSuccess, 
        toastError, 
        toastInfo, 
        toastWarning,
        customerToasts,
        supplierToasts
    };
}

export default useToast;