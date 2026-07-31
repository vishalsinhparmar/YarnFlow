import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PurchaseOrderForm from '../components/PurchaseOrders/PurchaseOrderForm';
import masterDataAPI from '../services/masterDataAPI';

vi.mock('../services/masterDataAPI', () => {
  const suppliers = {
    getAll: vi.fn(() => Promise.resolve({
      success: true,
      data: [{ _id: 'supplier-1', companyName: 'Apex International' }],
      pagination: { current: 1, pages: 1, total: 1 }
    })),
    create: vi.fn()
  };
  const categories = {
    getAll: vi.fn(() => Promise.resolve({
      success: true,
      data: [{
        _id: 'category-1',
        categoryName: 'Existing Yarn',
        description: 'Standard yarn products',
        hasSubProducts: false,
        status: 'Active'
      }],
      pagination: { current: 1, pages: 1, total: 1 }
    })),
    create: vi.fn()
  };
  const products = {
    getAll: vi.fn(() => Promise.resolve({
      success: true,
      data: [],
      pagination: { current: 1, pages: 1, total: 0 }
    })),
    create: vi.fn()
  };

  return {
    default: { suppliers, categories, products },
    subProductAPI: {
      bulkAdd: vi.fn()
    },
    unitAPI: {
      getAll: vi.fn(() => Promise.resolve({ success: true, data: [] }))
    }
  };
});

describe('Purchase order category workflow', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    masterDataAPI.categories.create.mockReset();
  });

  it('uses the complete master-data category form and selects the created category', async () => {
    masterDataAPI.categories.create.mockResolvedValue({
      success: true,
      data: {
        _id: 'category-new',
        categoryName: 'Sized Yarn',
        description: 'Products with size variants',
        hasSubProducts: true,
        status: 'Active'
      }
    });

    render(
      <PurchaseOrderForm
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        purchaseOrder={null}
      />
    );

    await waitFor(() => {
      expect(masterDataAPI.categories.getAll).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Select Category$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Create category/i }));

    expect(screen.getByRole('dialog', { name: 'Create Category' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Products in this category have Sub Products/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Enter category name'), {
      target: { value: 'Sized Yarn' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter category description (optional)'), {
      target: { value: 'Products with size variants' }
    });
    fireEvent.click(screen.getByLabelText(/Products in this category have Sub Products/i));
    fireEvent.click(screen.getByRole('button', { name: 'Create Category' }));

    await waitFor(() => {
      expect(masterDataAPI.categories.create).toHaveBeenCalledWith({
        categoryName: 'Sized Yarn',
        description: 'Products with size variants',
        hasSubProducts: true
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Create Category' })).not.toBeInTheDocument();
      expect(screen.getAllByText('Sized Yarn').length).toBeGreaterThan(0);
      expect(screen.getByText(/Variant tracking enabled/i)).toBeInTheDocument();
    });
  });
});
