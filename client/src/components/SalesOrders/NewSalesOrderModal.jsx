import React, { useState, useEffect } from 'react';
import { salesOrderAPI, salesOrderUtils } from '../../services/salesOrderAPI.js';
import { apiRequest } from '../../services/common.js';

const NewSalesOrderModal = ({ isOpen, onClose, order = null }) => {
  const [formData, setFormData] = useState({
    customer: '',
    expectedDeliveryDate: '',
    items: [
      {
        product: '',
        productName: '',
        orderedQuantity: '',
        unit: '',
        unitPrice: '',
        taxRate: 18
      }
    ],
    customerPONumber: '',
    salesPerson: '',
    paymentTerms: 'Net_30',
    priority: 'Medium',
    orderType: 'Regular',
    shippingMethod: 'Standard',
    discountPercentage: 0,
    discountAmount: 0,
    shippingCharges: 0,
    customerNotes: '',
    internalNotes: '',
    createdBy: 'Admin'
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load customers and products
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadProducts();
      
      // Reset form data when opening modal
      if (!order) {
        setFormData({
          customer: '',
          expectedDeliveryDate: '',
          items: [
            {
              product: '',
              productName: '',
              orderedQuantity: '',
              unit: '',
              unitPrice: '',
              taxRate: 18
            }
          ],
          customerPONumber: '',
          salesPerson: '',
          paymentTerms: 'Net_30',
          priority: 'Medium',
          orderType: 'Regular',
          shippingMethod: 'Standard',
          discountPercentage: 0,
          discountAmount: 0,
          shippingCharges: 0,
          customerNotes: '',
          internalNotes: '',
          createdBy: 'Admin'
        });
      }
      
      // If editing existing order, populate form
      if (order) {
        setFormData({
          customer: order.customer._id || order.customer,
          expectedDeliveryDate: order.expectedDeliveryDate ? 
            new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
          items: order.items.map(item => ({
            product: item.product._id || item.product,
            productName: item.productName,
            orderedQuantity: item.orderedQuantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 18
          })),
          customerPONumber: order.customerPONumber || '',
          salesPerson: order.salesPerson || '',
          paymentTerms: order.paymentTerms || 'Net_30',
          priority: order.priority || 'Medium',
          orderType: order.orderType || 'Regular',
          shippingMethod: order.shippingMethod || 'Standard',
          discountPercentage: order.discountPercentage || 0,
          discountAmount: order.discountAmount || 0,
          shippingCharges: order.shippingCharges || 0,
          customerNotes: order.customerNotes || '',
          internalNotes: order.internalNotes || '',
          createdBy: 'Admin'
        });
      }
    }
  }, [isOpen, order]);

  const loadCustomers = async () => {
    try {
      // Load customers from master data API (centralized base)
      const data = await apiRequest('/master-data/customers');
      
      if (data.success) {
        setCustomers(data.data || []);
      } else {
        // Fallback to mock data if API fails
        const mockCustomers = [
          { _id: '1', companyName: 'Fashion Hub Ltd.', contactPerson: 'Rajesh Kumar' },
          { _id: '2', companyName: 'Textile World Co.', contactPerson: 'Priya Sharma' },
          { _id: '3', companyName: 'Premium Fabrics Inc.', contactPerson: 'Amit Patel' }
        ];
        setCustomers(mockCustomers);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      // Fallback to mock data
      const mockCustomers = [
        { _id: '1', companyName: 'Fashion Hub Ltd.', contactPerson: 'Rajesh Kumar' },
        { _id: '2', companyName: 'Textile World Co.', contactPerson: 'Priya Sharma' },
        { _id: '3', companyName: 'Premium Fabrics Inc.', contactPerson: 'Amit Patel' }
      ];
      setCustomers(mockCustomers);
    }
  };

  const loadProducts = async () => {
    try {
      // Load products from master data API (centralized base)
      const data = await apiRequest('/master-data/products');
      
      if (data.success) {
        setProducts(data.data || []);
      } else {
        // Fallback to mock data if API fails
        const mockProducts = [
          { _id: '1', productName: 'Cotton Yarn 20s', productCode: 'CY20S', unit: 'Kg', basePrice: 180 },
          { _id: '2', productName: 'Polyester Thread', productCode: 'PT150', unit: 'Spools', basePrice: 25 },
          { _id: '3', productName: 'Cotton Fabric', productCode: 'CF100', unit: 'Meters', basePrice: 120 }
        ];
        setProducts(mockProducts);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      // Fallback to mock data
      const mockProducts = [
        { _id: '1', productName: 'Cotton Yarn 20s', productCode: 'CY20S', unit: 'Kg', basePrice: 180 },
        { _id: '2', productName: 'Polyester Thread', productCode: 'PT150', unit: 'Spools', basePrice: 25 },
        { _id: '3', productName: 'Cotton Fabric', productCode: 'CF100', unit: 'Meters', basePrice: 120 }
      ];
      setProducts(mockProducts);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Auto-populate product details when product is selected
    if (field === 'product') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        updatedItems[index] = {
          ...updatedItems[index],
          productName: selectedProduct.productName,
          unit: selectedProduct.unit || selectedProduct.baseUnit || 'Units',
          unitPrice: selectedProduct.basePrice || selectedProduct.price || 0
        };
      }
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: '',
          productName: '',
          orderedQuantity: '',
          unit: '',
          unitPrice: '',
          taxRate: 18
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

  const calculateTotals = () => {
    return salesOrderUtils.calculateTotals(
      formData.items,
      formData.discountPercentage,
      formData.discountAmount,
      formData.shippingCharges
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.customer) {
        throw new Error('Please select a customer');
      }
      if (!formData.expectedDeliveryDate) {
        throw new Error('Please select expected delivery date');
      }
      if (!formData.items || formData.items.length === 0) {
        throw new Error('Please add at least one item');
      }
      
      // Validate each item
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (!item.product) {
          throw new Error(`Please select product for item ${i + 1}`);
        }
        if (!item.orderedQuantity || parseFloat(item.orderedQuantity) <= 0) {
          throw new Error(`Please enter valid quantity for item ${i + 1}`);
        }
        if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
          throw new Error(`Please enter valid unit price for item ${i + 1}`);
        }
        if (!item.unit) {
          throw new Error(`Unit is missing for item ${i + 1}`);
        }
      }

      // Prepare data for API - backend will calculate totals automatically
      const orderData = {
        customer: formData.customer,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        items: formData.items.map(item => {
          // Find product details for productName and productCode
          const selectedProduct = products.find(p => p._id === item.product);
          return {
            product: item.product,
            productName: selectedProduct?.productName || item.productName || 'Unknown Product',
            productCode: selectedProduct?.productCode || item.productCode || 'UNKNOWN',
            orderedQuantity: parseFloat(item.orderedQuantity || 0),
            unit: item.unit,
            unitPrice: parseFloat(item.unitPrice || 0),
            taxRate: parseFloat(item.taxRate || 18)
          };
        }),
        customerPONumber: formData.customerPONumber || '',
        salesPerson: formData.salesPerson || '',
        paymentTerms: formData.paymentTerms || 'Net_30',
        priority: formData.priority || 'Medium',
        orderType: formData.orderType || 'Regular',
        shippingMethod: formData.shippingMethod || 'Standard',
        discountPercentage: parseFloat(formData.discountPercentage || 0),
        discountAmount: parseFloat(formData.discountAmount || 0),
        shippingCharges: parseFloat(formData.shippingCharges || 0),
        customerNotes: formData.customerNotes || '',
        internalNotes: formData.internalNotes || '',
        createdBy: formData.createdBy || 'Admin'
      };

      console.log('Submitting order data:', orderData);

      if (order) {
        // Update existing order
        await salesOrderAPI.update(order._id, orderData);
      } else {
        // Create new order
        await salesOrderAPI.create(orderData);
      }

      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {order ? 'Update Sales Order' : 'New Sales Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.companyName} - {customer.contactPerson}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date *
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer PO Number
              </label>
              <input
                type="text"
                name="customerPONumber"
                value={formData.customerPONumber}
                onChange={handleInputChange}
                placeholder="Customer's PO reference"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Person
              </label>
              <input
                type="text"
                name="salesPerson"
                value={formData.salesPerson}
                onChange={handleInputChange}
                placeholder="Sales person name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Advance">Advance</option>
                <option value="COD">COD</option>
                <option value="Net_15">Net 15</option>
                <option value="Net_30">Net 30</option>
                <option value="Net_45">Net 45</option>
                <option value="Net_60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type
              </label>
              <select
                name="orderType"
                value={formData.orderType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Regular">Regular</option>
                <option value="Rush">Rush</option>
                <option value="Sample">Sample</option>
                <option value="Bulk">Bulk</option>
                <option value="Export">Export</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Method
              </label>
              <select
                name="shippingMethod"
                value={formData.shippingMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="Overnight">Overnight</option>
                <option value="Pickup">Pickup</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <select
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.productName} ({product.productCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.orderedQuantity}
                        onChange={(e) => handleItemChange(index, 'orderedQuantity', e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        required
                        placeholder="e.g., Kg, Meters, Pieces"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-end">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-right text-sm text-gray-600">
                    Total: {salesOrderUtils.formatCurrency((item.orderedQuantity || 0) * (item.unitPrice || 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount %
              </label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount
              </label>
              <input
                type="number"
                name="discountAmount"
                value={formData.discountAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Charges
              </label>
              <input
                type="number"
                name="shippingCharges"
                value={formData.shippingCharges}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{salesOrderUtils.formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Amount:</span>
                <span>{salesOrderUtils.formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{salesOrderUtils.formatCurrency(totals.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{salesOrderUtils.formatCurrency(formData.shippingCharges)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>{salesOrderUtils.formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Notes
              </label>
              <textarea
                name="customerNotes"
                value={formData.customerNotes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Notes visible to customer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Internal notes (not visible to customer)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSalesOrderModal;
