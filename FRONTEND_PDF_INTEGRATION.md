# Frontend Integration - PDF Buttons

## Quick Integration Guide

### Option 1: Add to Challan Detail Modal

Add PDF buttons to your `ChallanDetailModal.jsx`:

```jsx
// Inside ChallanDetailModal component
import { salesChallanAPI } from '../../services/salesChallanAPI';
import { useState } from 'react';

const ChallanDetailModal = ({ challan, onClose }) => {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      await salesChallanAPI.generatePDF(challan._id);
      // Success - PDF will download automatically
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      setPdfLoading(true);
      await salesChallanAPI.previewPDF(challan._id);
      // Success - PDF will open in new tab
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Failed to preview PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="modal">
      {/* ... existing modal content ... */}
      
      {/* Add PDF buttons in the footer */}
      <div className="modal-footer flex gap-3">
        <button
          onClick={handlePreviewPDF}
          disabled={pdfLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {pdfLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span>👁️</span>
              Preview PDF
            </>
          )}
        </button>
        
        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
        >
          {pdfLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span>📥</span>
              Download PDF
            </>
          )}
        </button>
        
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};
```

### Option 2: Add to Challan Table Row Actions

Add PDF action to each challan row in `SalesChallan.jsx`:

```jsx
// In your challan table row
const handlePDFAction = async (challanId, action) => {
  try {
    if (action === 'download') {
      await salesChallanAPI.generatePDF(challanId);
    } else if (action === 'preview') {
      await salesChallanAPI.previewPDF(challanId);
    }
  } catch (error) {
    console.error('Error with PDF:', error);
    setError('Failed to generate PDF');
  }
};

// In your JSX table row
<td className="px-6 py-4 text-right">
  <div className="flex gap-2 justify-end">
    <button
      onClick={() => handleViewDetails(challan)}
      className="text-blue-600 hover:text-blue-800"
      title="View Details"
    >
      👁️ View
    </button>
    
    <button
      onClick={() => handlePDFAction(challan._id, 'preview')}
      className="text-teal-600 hover:text-teal-800"
      title="Preview PDF"
    >
      📄 PDF
    </button>
    
    <button
      onClick={() => handlePDFAction(challan._id, 'download')}
      className="text-green-600 hover:text-green-800"
      title="Download PDF"
    >
      📥 Download
    </button>
  </div>
</td>
```

### Option 3: Add Dropdown Menu with PDF Options

Create a dropdown menu for actions:

```jsx
import { useState } from 'react';

const ChallanActionsDropdown = ({ challan }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setIsOpen(false);
    setLoading(true);
    
    try {
      switch (action) {
        case 'view':
          // Handle view details
          break;
        case 'preview-pdf':
          await salesChallanAPI.previewPDF(challan._id);
          break;
        case 'download-pdf':
          await salesChallanAPI.generatePDF(challan._id);
          break;
        case 'edit':
          // Handle edit
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-gray-600 hover:text-gray-800"
        disabled={loading}
      >
        {loading ? '⏳' : '⋮'}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border">
          <button
            onClick={() => handleAction('view')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <span>👁️</span> View Details
          </button>
          
          <button
            onClick={() => handleAction('preview-pdf')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <span>📄</span> Preview PDF
          </button>
          
          <button
            onClick={() => handleAction('download-pdf')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <span>📥</span> Download PDF
          </button>
          
          <hr className="my-1" />
          
          <button
            onClick={() => handleAction('edit')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <span>✏️</span> Edit
          </button>
        </div>
      )}
      
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
```

### Option 4: Bulk PDF Generation

Generate PDFs for multiple challans:

```jsx
const BulkPDFGenerator = ({ selectedChallans }) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBulkDownload = async () => {
    setGenerating(true);
    setProgress(0);
    
    try {
      for (let i = 0; i < selectedChallans.length; i++) {
        await salesChallanAPI.generatePDF(selectedChallans[i]._id);
        setProgress(((i + 1) / selectedChallans.length) * 100);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      alert('All PDFs downloaded successfully!');
    } catch (error) {
      console.error('Error in bulk download:', error);
      alert('Some PDFs failed to download');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <button
        onClick={handleBulkDownload}
        disabled={generating || selectedChallans.length === 0}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50"
      >
        {generating ? (
          <>
            <span className="animate-spin">⏳</span>
            Generating {Math.round(progress)}%
          </>
        ) : (
          <>
            📥 Download {selectedChallans.length} PDFs
          </>
        )}
      </button>
      
      {generating && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
```

## Styling Examples

### Modern Button with Icon
```jsx
<button className="group relative px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg">
  <span className="flex items-center gap-2">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Download PDF
  </span>
</button>
```

### Minimal Icon Button
```jsx
<button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Download PDF">
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
</button>
```

## Error Handling

```jsx
const [pdfError, setPdfError] = useState(null);

const handlePDFWithError = async (challanId) => {
  try {
    setPdfError(null);
    await salesChallanAPI.generatePDF(challanId);
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to generate PDF';
    setPdfError(errorMessage);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => setPdfError(null), 5000);
  }
};

// Display error
{pdfError && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
    <p className="font-medium">PDF Generation Error</p>
    <p className="text-sm">{pdfError}</p>
  </div>
)}
```

## Loading States

```jsx
const [pdfStates, setPdfStates] = useState({});

const handlePDFWithLoading = async (challanId, action) => {
  setPdfStates(prev => ({ ...prev, [challanId]: true }));
  
  try {
    if (action === 'download') {
      await salesChallanAPI.generatePDF(challanId);
    } else {
      await salesChallanAPI.previewPDF(challanId);
    }
  } catch (error) {
    console.error('PDF error:', error);
  } finally {
    setPdfStates(prev => ({ ...prev, [challanId]: false }));
  }
};

// In button
<button disabled={pdfStates[challan._id]}>
  {pdfStates[challan._id] ? 'Generating...' : 'Download PDF'}
</button>
```

## Best Practices

1. **Always show loading state** during PDF generation
2. **Handle errors gracefully** with user-friendly messages
3. **Disable buttons** during generation to prevent multiple clicks
4. **Use tooltips** to explain button actions
5. **Test with slow connections** to ensure good UX
6. **Add success notifications** after successful generation
7. **Consider mobile users** - download might work better than preview

## Testing Checklist

- [ ] PDF downloads correctly
- [ ] PDF preview opens in new tab
- [ ] Loading states work properly
- [ ] Error messages display correctly
- [ ] Buttons are disabled during generation
- [ ] Works on mobile devices
- [ ] Works with slow internet
- [ ] Multiple PDFs can be generated
- [ ] Browser doesn't block popups (for preview)
- [ ] PDF contains correct data

## Ready to Use!

Choose the integration option that best fits your UI and implement it. All the backend functionality is ready and production-tested!
