import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExcelImportButton from '../components/common/ExcelImportButton';
import { importMasterData } from '../services/masterDataAPI';

vi.mock('../services/masterDataAPI', () => ({
  importMasterData: vi.fn(),
}));

describe('Excel import overlays', () => {
  beforeEach(() => {
    importMasterData.mockReset();
  });

  it('renders the actions menu in the document overlay layer', () => {
    render(<ExcelImportButton type="customers" />);

    fireEvent.click(screen.getByRole('button', { name: /Excel/i }));

    const menu = screen.getByRole('menu', { name: 'Excel actions' });
    expect(menu).toHaveClass('fixed', 'z-[70]');
    expect(menu.parentElement).toBe(document.body);
  });

  it('closes the actions menu with Escape and restores trigger focus', () => {
    render(<ExcelImportButton type="customers" />);
    const trigger = screen.getByRole('button', { name: /Excel/i });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu', { name: 'Excel actions' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('places import results below the fixed application header', async () => {
    importMasterData.mockResolvedValue({
      data: { inserted: 2, updated: 0, skipped: 0, errors: [] },
    });
    const { container } = render(<ExcelImportButton type="customers" />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [new File(['companyName\nAcme'], 'customers.csv', { type: 'text/csv' })] },
    });

    await waitFor(() => expect(importMasterData).toHaveBeenCalledOnce());
    const result = await screen.findByRole('status');
    expect(result).toHaveClass('top-20', 'z-[35]');
    expect(result.parentElement).toBe(document.body);
  });
});
