import React, { useState, useEffect } from 'react';
import { useDropdownOptions } from '../../hooks/useMasterData';
import masterDataAPI from '../../services/masterDataAPI';

const PurchaseOrderForm = ({ purchaseOrder, onSubmit, onCancel }) => {
  const { options, loading: optionsLoading } = useDropdownOptions();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    items: [{
      product: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'Bags',
      deliveryDate: '',
      notes: ''
    }],
    taxRate: 18,
    discountAmount: 0,
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    },
    shippingMethod: 'Transport',
    paymentTerms: 'Credit_30',
    terms: '',
    notes: '',
    priority: 'Medium'
  });

  // Fetch suppliers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          masterDataAPI.suppliers.getAll({ limit: 100 }),
          masterDataAPI.products.getAll({ limit: 100 })
        ]);
        setSuppliers(suppliersRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier: purchaseOrder.supplier?._id || '',
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ? 
          new Date(purchaseOrder.expectedDeliveryDate).toISOString().split('T')[0] : '',
        items: purchaseOrder.items?.map(item => ({
          product: item.product?._id || item.product || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          unit: item.unit || 'Bags',
          deliveryDate: item.deliveryDate ? 
            new Date(item.deliveryDate).toISOString().split('T')[0] : '',
          notes: item.notes || ''
        })) || [{
          product: '',
          quantity: 1,
          unitPrice: 0,
          unit: 'Bags',
          deliveryDate: '',
          notes: ''
        }],
        taxRate: purchaseOrder.taxRate || 18,
        discountAmount: purchaseOrder.discountAmount || 0,
        deliveryAddress: purchaseOrder.deliveryAddress || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        },
        shippingMethod: purchaseOrder.shippingMethod || 'Transport',
        paymentTerms: purchaseOrder.paymentTerms || 'Credit_30',
        terms: purchaseOrder.terms || '',
        notes: purchaseOrder.notes || '',
        priority: purchaseOrder.priority || 'Medium'
      });
    }
  }, [purchaseOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('deliveryAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Auto-calculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));

    // Clear item-specific errors
    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: '',
          quantity: 1,
          unitPrice: 0,
          unit: 'Bags',
          deliveryDate: prev.expectedDeliveryDate,
          notes: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.supplier) {
      newErrors.supplier = 'Supplier is required';
    }

    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery date is required';
    } else {
      const deliveryDate = new Date(formData.expectedDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        newErrors.expectedDeliveryDate = 'Delivery date cannot be in the past';
      }
    }

    // Item validations
    formData.items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`items.${index}.product`] = 'Product is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        newErrors[`items.${index}.unitPrice`] = 'Unit price must be greater than or equal to 0';
      }
    });

    // Delivery address validation
    if (formData.deliveryAddress.pincode && !/^\d{6}$/.test(formData.deliveryAddress.pincode)) {
      newErrors['deliveryAddress.pincode'] = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          deliveryDate: item.deliveryDate || formData.expectedDeliveryDate
        })),
        taxRate: Number(formData.taxRate),
        discountAmount: Number(formData.discountAmount)
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error.message || 'Failed to save purchase order' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.unitPrice));
  }, 0);
  
  const taxAmount = (subtotal * Number(formData.taxRate)) / 100;
  const totalAmount = subtotal + taxAmount - Number(formData.discountAmount);

  if (optionsLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier *
            </label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.supplier ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.companyName} ({supplier.supplierCode})
                </option>
              ))}
            </select>
            {errors.supplier && (
              <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date *
            </label>
            <input
              type="date"
              name="expectedDeliveryDate"
              value={formData.expectedDeliveryDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expectedDeliveryDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expectedDeliveryDate && (
              <p className="text-red-500 text-xs mt-1">{errors.expectedDeliveryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Advance">Advance</option>
              <option value="Cash_on_Delivery">Cash on Delivery</option>
              <option value="Credit_15">Credit 15 Days</option>
              <option value="Credit_30">Credit 30 Days</option>
              <option value="Credit_45">Credit 45 Days</option>
              <option value="Credit_60">Credit 60 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={item.product}
                    onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.product`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.productName} ({product.productCode})
                      </option>
                    ))}
                  </select>
                  {errors[`items.${index}.product`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.product`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.quantity`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    step="1"
                  />
                  {errors[`items.${index}.quantity`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.quantity`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Kg">Kg</option>
                    <option value="Meters">Meters</option>
                    <option value="Pieces">Pieces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.unitPrice`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                  {errors[`items.${index}.unitPrice`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.unitPrice`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Delivery Date
                  </label>
                  <input
                    type="date"
                    value={item.deliveryDate}
                    onChange={(e) => handleItemChange(index, 'deliveryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Notes
                  </label>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Special instructions for this item..."
                  />
                </div>
              </div>

              {/* Item Total */}
              <div className="mt-4 text-right">
                <span className="text-sm text-gray-600">
                  Total: ₹{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Financial Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Amount (₹)
            </label>
            <input
              type="number"
              name="discountAmount"
              value={formData.discountAmount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Method
            </label>
            <select
              name="shippingMethod"
              value={formData.shippingMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pickup">Pickup</option>
              <option value="Courier">Courier</option>
              <option value="Transport">Transport</option>
              <option value="Own_Vehicle">Own Vehicle</option>
            </select>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({formData.taxRate}%):</span>
              <span>₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-₹{Number(formData.discountAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              name="deliveryAddress.street"
              value={formData.deliveryAddress.street}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="deliveryAddress.city"
              value={formData.deliveryAddress.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="deliveryAddress.state"
              value={formData.deliveryAddress.state}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="State"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <input
              type="text"
              name="deliveryAddress.pincode"
              value={formData.deliveryAddress.pincode}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['deliveryAddress.pincode'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="6-digit pincode"
              maxLength="6"
            />
            {errors['deliveryAddress.pincode'] && (
              <p className="text-red-500 text-xs mt-1">{errors['deliveryAddress.pincode']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landmark
            </label>
            <input
              type="text"
              name="deliveryAddress.landmark"
              value={formData.deliveryAddress.landmark}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Landmark (optional)"
            />
          </div>
        </div>
      </div>

      {/* Terms and Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Terms and conditions for this purchase order..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or special instructions..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (purchaseOrder ? 'Update PO' : 'Create PO')}
        </button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;
