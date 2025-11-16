import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Generate Sales Challan PDF Invoice
 * Production-ready PDF generation with proper formatting and company branding
 * @param {Object} challanData - Complete challan data with populated fields
 * @param {Object} companyInfo - Company details for header
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateSalesChallanPDF = async (challanData, companyInfo = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document - A6 size
      const doc = new PDFDocument({
        size: [298, 420], // A6: 105mm x 148mm
        margin: 18,
        bufferPages: true
      });

      // Buffer to store PDF data
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Fixed company info - no overrides allowed
      const company = {
        name: 'Pavan Kumar Raj Kumar',
        address: 'H.O. – Bajaji Road, Deoria (U.P.), B.O. – Chakenyat, Bhadohi',
        phone: 'Mobile: 9415203756',
        msmeNo: 'MSME No.: UP-66-0007062',
        gstin: 'GST: 09ACBPA4526C1Z9',
        city: 'Deoria U.P.'
      };

      // Debug log to verify our code is being used
      console.log('PDF Generator - Company Info:', {
        name: company.name,
        address: company.address,
        gstin: company.gstin
      });

      // Page dimensions
      const margin = 18;
      const pageWidth = 298;
      const pageHeight = 420;
      const contentWidth = 262;
      let yPosition = margin;

      // HEADER - Clean and readable with complete address
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(company.name, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 14;

      // Full address line
      doc.fontSize(6)
         .font('Helvetica')
         .fillColor('#666')
         .text(company.address, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 10;

      // Phone and MSME number
      doc.fontSize(6)
         .font('Helvetica')
         .fillColor('#666')
         .text(`${company.phone}, ${company.msmeNo}`, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 10;

      // GST Number
      doc.fontSize(7)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text(company.gstin, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 12;

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#0891b2')
         .text('DELIVERY CHALLAN', margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 15;

      // Line separator
      doc.moveTo(margin, yPosition)
         .lineTo(margin + contentWidth, yPosition)
         .strokeColor('#ddd')
         .lineWidth(0.5)
         .stroke();
      yPosition += 8;

      // DETAILS - Boxed layout with borders
      const detailsBoxHeight = 42;
      const leftCol = margin + 3;
      const rightCol = margin + 133;
      const startY = yPosition;

      // Draw details box
      doc.rect(margin, yPosition, contentWidth, detailsBoxHeight)
         .strokeColor('#d1d5db')
         .lineWidth(0.5)
         .stroke();

      // Vertical divider between left and right
      doc.moveTo(rightCol - 3, yPosition)
         .lineTo(rightCol - 3, yPosition + detailsBoxHeight)
         .strokeColor('#d1d5db')
         .lineWidth(0.5)
         .stroke();

      yPosition += 5;

      // Left: Challan Details
      doc.fontSize(6.5)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text('Challan No:', leftCol, yPosition);
      yPosition += 9;
      doc.fontSize(7.5)
         .font('Helvetica-Bold')
         .fillColor('#000')
         .text(challanData.challanNumber || 'N/A', leftCol, yPosition);
      yPosition += 11;
      
      doc.fontSize(6.5)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text('Date:', leftCol, yPosition);
      yPosition += 9;
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#000')
         .text(formatDate(challanData.challanDate), leftCol, yPosition);

      // Right: Customer Details
      yPosition = startY + 5;
      const customerInfo = challanData.customerDetails || {};
      const customerAddress = challanData.customer?.address || {};
      
      doc.fontSize(6.5)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text('Delivery To:', rightCol, yPosition);
      yPosition += 9;
      doc.fontSize(7.5)
         .font('Helvetica-Bold')
         .fillColor('#000')
         .text(customerInfo.companyName || challanData.customerName || 'N/A', rightCol, yPosition, { width: 126 });
      yPosition += 9;
      
      const cityLine = [customerAddress.city, customerAddress.state].filter(Boolean).join(', ');
      if (cityLine) {
        doc.fontSize(6.5)
           .font('Helvetica')
           .fillColor('#666')
           .text(cityLine, rightCol, yPosition, { width: 126 });
      }

      yPosition = startY + detailsBoxHeight;
      
      doc.moveTo(margin, yPosition)
         .lineTo(margin + contentWidth, yPosition)
         .strokeColor('#ddd')
         .lineWidth(0.5)
         .stroke();
      yPosition += 8;

      // TABLE - Simple professional structure with black borders
      const tableHeaderHeight = 16;
      doc.rect(margin, yPosition, contentWidth, tableHeaderHeight)
         .fillAndStroke('#f5f5f5', '#000000');

      const tableTop = yPosition + 5;
      // Improved column positioning with better padding
      const col1X = margin + 5;          // # (with left padding)
      const col2X = margin + 20;         // Product
      const col3X = margin + 110;        // Category
      const col4X = margin + 170;        // Qty
      const col5X = margin + 220;        // Weight
      
      // Column widths with proper padding
      const col1W = 12;   // #
      const col2W = 85;   // Product
      const col3W = 55;   // Category
      const col4W = 45;   // Qty
      const col5W = 40;   // Weight

      doc.fontSize(7.5)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('#', col1X, tableTop, { width: col1W, align: 'center' })
         .text('Product', col2X, tableTop, { width: col2W, align: 'center' })
         .text('Category', col3X, tableTop, { width: col3W, align: 'center' })
         .text('Qty', col4X, tableTop, { width: col4W, align: 'center' })
         .text('Weight', col5X, tableTop, { width: col5W, align: 'center' });

      // Draw complete table borders including left and right edges
      doc.strokeColor('#000000').lineWidth(0.5);
      // Left border
      doc.moveTo(margin, yPosition).lineTo(margin, yPosition + tableHeaderHeight).stroke();
      // Internal vertical lines
      doc.moveTo(col2X - 3, yPosition).lineTo(col2X - 3, yPosition + tableHeaderHeight).stroke();
      doc.moveTo(col3X - 3, yPosition).lineTo(col3X - 3, yPosition + tableHeaderHeight).stroke();
      doc.moveTo(col4X - 3, yPosition).lineTo(col4X - 3, yPosition + tableHeaderHeight).stroke();
      doc.moveTo(col5X - 3, yPosition).lineTo(col5X - 3, yPosition + tableHeaderHeight).stroke();
      // Right border
      doc.moveTo(margin + contentWidth, yPosition).lineTo(margin + contentWidth, yPosition + tableHeaderHeight).stroke();

      yPosition += tableHeaderHeight;

      // Table Rows
      const items = challanData.items || [];
      let totalQty = 0;
      let totalWeight = 0;

      items.forEach((item, index) => {
        const hasNotes = item.notes && item.notes.trim();
        // Calculate dynamic row height based on notes length
        let rowHeight = 13; // Base height
        if (hasNotes) {
          const notesLength = item.notes.length;
          if (notesLength > 80) {
            rowHeight = 28; // Very long notes
          } else if (notesLength > 40) {
            rowHeight = 22; // Medium notes
          } else {
            rowHeight = 18; // Short notes
          }
        }

        // Simple alternate row colors
        if (index % 2 === 0) {
          doc.rect(margin, yPosition, contentWidth, rowHeight)
             .fillColor('#fafafa')
             .fill();
        }

        const rowY = yPosition + 5; // Better vertical padding

        let categoryName = 'N/A';
        // Try multiple sources for category information
        if (item.product?.category) {
          categoryName = item.product.category.categoryName || 
                       item.product.category.name || 
                       item.product.category;
        } else if (item.categoryName) {
          categoryName = item.categoryName;
        } else if (item.category) {
          categoryName = item.category.categoryName || 
                       item.category.name || 
                       item.category;
        } else if (item.product?.categoryName) {
          categoryName = item.product.categoryName;
        } else if (item.product?.category_name) {
          categoryName = item.product.category_name;
        }
        
        // If still N/A, try to extract from product name or use a default
        if (categoryName === 'N/A' && item.productName) {
          // You can add logic here to derive category from product name if needed
          categoryName = 'General'; // or keep as 'N/A'
        }

        // Main row data with improved alignment
        doc.fillColor('#1a1a1a')
           .fontSize(7)
           .font('Helvetica')
           .text((index + 1).toString(), col1X, rowY, { width: col1W, align: 'center' })
           .text(item.productName || 'N/A', col2X + 2, rowY, { width: col2W - 4 })
           .text(categoryName, col3X, rowY, { width: col3W, align: 'center' })
           .text(`${item.dispatchQuantity || 0} ${item.unit || 'Bags'}`, col4X, rowY, { width: col4W, align: 'center' })
           .text(`${(item.weight || 0).toFixed(2)} kg`, col5X, rowY, { width: col5W, align: 'center' });

        // Product notes (if any) - displayed below product name in same cell
        if (hasNotes) {
          const notesY = rowY + 9;
          const maxNotesHeight = rowHeight - 12; // Leave some padding
          doc.fontSize(5.5)
             .fillColor('#2563eb')
             .font('Helvetica-Oblique')
             .text(item.notes, col2X + 2, notesY, { 
               width: col2W - 4, 
               height: maxNotesHeight,
               lineGap: -1,
               ellipsis: true // Add ellipsis if text is too long
             })
             .font('Helvetica')
             .fillColor('#1a1a1a');
        }

        // Draw complete row borders including left and right edges
        doc.strokeColor('#000000').lineWidth(0.5);
        // Left border
        doc.moveTo(margin, yPosition).lineTo(margin, yPosition + rowHeight).stroke();
        // Internal vertical lines
        doc.moveTo(col2X - 3, yPosition).lineTo(col2X - 3, yPosition + rowHeight).stroke(); // After #
        doc.moveTo(col3X - 3, yPosition).lineTo(col3X - 3, yPosition + rowHeight).stroke(); // After Product
        doc.moveTo(col4X - 3, yPosition).lineTo(col4X - 3, yPosition + rowHeight).stroke(); // After Category
        doc.moveTo(col5X - 3, yPosition).lineTo(col5X - 3, yPosition + rowHeight).stroke(); // After Qty
        // Right border
        doc.moveTo(margin + contentWidth, yPosition).lineTo(margin + contentWidth, yPosition + rowHeight).stroke();

        // Bottom border
        doc.moveTo(margin, yPosition + rowHeight)
           .lineTo(margin + contentWidth, yPosition + rowHeight)
           .strokeColor('#000000')
           .lineWidth(0.5)
           .stroke();

        totalQty += item.dispatchQuantity || 0;
        totalWeight += item.weight || 0;
        yPosition += rowHeight;
      });

      // TOTALS
      doc.rect(margin, yPosition, contentWidth, 15)
         .fillAndStroke('#f0f0f0', '#000000');

      const totalY = yPosition + 4.5;
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('TOTAL', col2X, totalY, { width: 88 })
         .text(totalQty.toString(), col4X, totalY, { width: 48, align: 'center' })
         .text(`${totalWeight.toFixed(2)} kg`, col5X, totalY, { width: 45, align: 'center' });

      yPosition += 15;

      // FOOTER - Compact
      yPosition += 6;
      doc.fontSize(5.5)
         .font('Helvetica')
         .fillColor('#999')
         .text('Computer-generated delivery challan', margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 7;
      doc.fontSize(5)
         .text(`Generated: ${formatDateTime(new Date())}`, margin, yPosition, { align: 'center', width: contentWidth });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating Sales Challan PDF:', error);
      reject(error);
    }
  });
};

/**
 * Format date to DD/MM/YYYY
 */
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date and time to DD/MM/YYYY HH:MM:SS
 */
const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Save PDF to file system (optional - for local storage)
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} filename - Filename to save
 * @param {string} directory - Directory path
 * @returns {Promise<string>} File path
 */
export const savePDFToFile = async (pdfBuffer, filename, directory = './pdfs') => {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const filepath = path.join(directory, filename);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filepath, pdfBuffer, (err) => {
        if (err) {
          console.error('Error saving PDF file:', err);
          reject(err);
        } else {
          console.log(`PDF saved successfully: ${filepath}`);
          resolve(filepath);
        }
      });
    });
  } catch (error) {
    console.error('Error in savePDFToFile:', error);
    throw error;
  }
};

/**
 * Generate Consolidated PDF for Sales Order (All Challans)
 * Shows all challans for a completed SO in one PDF
 * @param {Object} consolidatedData - SO data with all challans
 * @param {Object} companyInfo - Company details
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateSalesOrderConsolidatedPDF = async (consolidatedData, companyInfo = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [298, 420], // A6: 105mm x 148mm
        margin: 18,
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const company = {
        name: 'Pavan Kumar Raj Kumar',
        address: 'H.O. – Bajaji Road, Deoria (U.P.), B.O. – Chakenyat, Bhadohi',
        phone: 'Mobile: 9415203756',
        msmeNo: 'MSME No.: UP-66-0007062',
        gstin: 'GST: 09ACBPA4526C1Z9',
        city: 'Deoria U.P.'
      };

      // Debug log for consolidated PDF
      console.log('🔥 CONSOLIDATED PDF Generator - Company Info:', {
        name: company.name,
        address: company.address,
        gstin: company.gstin
      });

      const margin = 18;
      const pageWidth = 298;
      const pageHeight = 420;
      const contentWidth = 262;
      let yPosition = margin;

      // HEADER - Clean and readable with complete address
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(company.name, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 14;

      // Full address line
      doc.fontSize(6)
         .font('Helvetica')
         .fillColor('#666')
         .text(company.address, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 10;

      // Phone and MSME number
      doc.fontSize(6)
         .font('Helvetica')
         .fillColor('#666')
         .text(`${company.phone}, ${company.msmeNo}`, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 10;

      // GST Number
      doc.fontSize(7)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text(company.gstin, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 12;

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#0891b2')
         .text('DELIVERY CHALLAN', margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 15;

      // Line separator
      doc.moveTo(margin, yPosition)
         .lineTo(margin + contentWidth, yPosition)
         .strokeColor('#ddd')
         .lineWidth(0.5)
         .stroke();
      yPosition += 8;

      // DETAILS - Boxed layout with borders
      const detailsBoxHeight = 42;
      const leftCol = margin + 3;
      const rightCol = margin + 133;
      const startY = yPosition;

      // Draw details box
      doc.rect(margin, yPosition, contentWidth, detailsBoxHeight)
         .strokeColor('#d1d5db')
         .lineWidth(0.5)
         .stroke();

      // Vertical divider between left and right
      doc.moveTo(rightCol - 3, yPosition)
         .lineTo(rightCol - 3, yPosition + detailsBoxHeight)
         .strokeColor('#d1d5db')
         .lineWidth(0.5)
         .stroke();

      yPosition += 5;

      // Left: SO Details
      doc.fontSize(6.5)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text('SO Number:', leftCol, yPosition);
      yPosition += 9;
      doc.fontSize(7.5)
         .font('Helvetica-Bold')
         .fillColor('#000')
         .text(consolidatedData.soNumber || 'N/A', leftCol, yPosition);
      yPosition += 11;
      
      doc.fontSize(6.5)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text('Order Date:', leftCol, yPosition);
      yPosition += 9;
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#000')
         .text(formatDate(consolidatedData.salesOrder?.orderDate), leftCol, yPosition);

      // Right: Customer Details
      yPosition = startY + 5;
      const customerInfo = consolidatedData.customerDetails || {};
      const customerAddress = consolidatedData.customer?.address || {};
      
      doc.fontSize(6.5)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text('Delivery To:', rightCol, yPosition);
      yPosition += 9;
      doc.fontSize(7.5)
         .font('Helvetica-Bold')
         .fillColor('#000')
         .text(customerInfo.companyName || 'N/A', rightCol, yPosition, { width: 126 });
      yPosition += 9;
      
      const cityLine = [customerAddress.city, customerAddress.state].filter(Boolean).join(', ');
      if (cityLine) {
        doc.fontSize(6.5)
           .font('Helvetica')
           .fillColor('#666')
           .text(cityLine, rightCol, yPosition, { width: 126 });
      }

      yPosition = startY + detailsBoxHeight;
      
      doc.moveTo(margin, yPosition)
         .lineTo(margin + contentWidth, yPosition)
         .strokeColor('#ddd')
         .lineWidth(0.5)
         .stroke();
      yPosition += 8;

      // Collect and consolidate products from all challans
      const productMap = new Map();
      
      consolidatedData.challans.forEach(challan => {
        challan.items?.forEach(item => {
          const productKey = item.product?._id?.toString() || item.productCode;
          
          if (productMap.has(productKey)) {
            const existing = productMap.get(productKey);
            existing.dispatchedQty += item.dispatchQuantity || 0;
            existing.weight += item.weight || 0;
          } else {
            // Get category from multiple possible sources
            let categoryName = 'N/A';
            if (item.product?.category) {
              categoryName = item.product.category.categoryName || 
                           item.product.category.name || 
                           item.product.category;
            } else if (item.categoryName) {
              categoryName = item.categoryName;
            } else if (item.category) {
              categoryName = item.category.categoryName || 
                           item.category.name || 
                           item.category;
            } else if (item.product?.categoryName) {
              categoryName = item.product.categoryName;
            } else if (item.product?.category_name) {
              categoryName = item.product.category_name;
            }
            
            // If still N/A, use a default
            if (categoryName === 'N/A' && item.productName) {
              categoryName = 'General';
            }
            
            productMap.set(productKey, {
              productName: item.productName || item.product?.productName || 'N/A',
              category: categoryName,
              dispatchedQty: item.dispatchQuantity || 0,
              unit: item.unit || 'Bags',
              weight: item.weight || 0,
              notes: item.notes || ''
            });
          }
        });
      });

      const allProducts = Array.from(productMap.values());

      // TABLE - Simple professional structure with black borders
      const tableHeaderHeight = 16;
      doc.rect(margin, yPosition, contentWidth, tableHeaderHeight)
         .fillAndStroke('#f5f5f5', '#000000');

      const tableTop = yPosition + 5;
      // Improved column positioning with better padding
      const col1X = margin + 5;          // # (with left padding)
      const col2X = margin + 20;         // Product
      const col3X = margin + 110;        // Category
      const col4X = margin + 170;        // Qty
      const col5X = margin + 220;        // Weight
      
      // Column widths with proper padding
      const col1W = 12;   // #
      const col2W = 85;   // Product
      const col3W = 55;   // Category
      const col4W = 45;   // Qty
      const col5W = 40;   // Weight

      doc.fontSize(7.5)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('#', col1X, tableTop, { width: col1W, align: 'center' })
         .text('Product', col2X, tableTop, { width: col2W, align: 'center' })
         .text('Category', col3X, tableTop, { width: col3W, align: 'center' })
         .text('Qty', col4X, tableTop, { width: col4W, align: 'center' })
         .text('Weight', col5X, tableTop, { width: col5W, align: 'center' });

      // Draw complete table borders including left and right edges
      doc.strokeColor('#000000').lineWidth(0.5);
      // Left border
      doc.moveTo(margin, yPosition).lineTo(margin, yPosition + tableHeaderHeight).stroke();
      // Internal vertical lines
      doc.moveTo(col2X - 3, yPosition).lineTo(col2X - 3, yPosition + tableHeaderHeight).stroke();
      doc.moveTo(col3X - 3, yPosition).lineTo(col3X - 3, yPosition + tableHeaderHeight).stroke();
      doc.moveTo(col4X - 3, yPosition).lineTo(col4X - 3, yPosition + tableHeaderHeight).stroke();
      doc.moveTo(col5X - 3, yPosition).lineTo(col5X - 3, yPosition + tableHeaderHeight).stroke();
      // Right border
      doc.moveTo(margin + contentWidth, yPosition).lineTo(margin + contentWidth, yPosition + tableHeaderHeight).stroke();

      yPosition += tableHeaderHeight;

      // Table Rows
      let totalQty = 0;
      let totalWeight = 0;

      allProducts.forEach((product, index) => {
        const hasNotes = product.notes && product.notes.trim();
        const rowHeight = hasNotes ? 22 : 13;

        // Simple alternate row colors
        if (index % 2 === 0) {
          doc.rect(margin, yPosition, contentWidth, rowHeight)
             .fillColor('#fafafa')
             .fill();
        }

        const rowY = yPosition + 5; // Better vertical padding

        // Main row data
        doc.fillColor('#1a1a1a')
           .fontSize(7)
           .font('Helvetica')
           .text((index + 1).toString(), col1X, rowY, { width: col1W, align: 'center' })
           .text(product.productName, col2X + 2, rowY, { width: col2W - 4 })
           .text(product.category, col3X, rowY, { width: col3W, align: 'center' })
           .text(`${product.dispatchedQty} ${product.unit}`, col4X, rowY, { width: col4W, align: 'center' })
           .text(`${product.weight.toFixed(2)} kg`, col5X, rowY, { width: col5W, align: 'center' });

        // Product notes (if any) - displayed below product name in same cell
        if (hasNotes) {
          doc.fontSize(5.5)
             .fillColor('#2563eb')
             .font('Helvetica-Oblique')
             .text(product.notes, col2X + 2, rowY + 9, { width: col2W - 4, lineGap: -1 })
             .font('Helvetica')
             .fillColor('#1a1a1a');
        }

        // Draw complete row borders including left and right edges
        doc.strokeColor('#000000').lineWidth(0.5);
        // Left border
        doc.moveTo(margin, yPosition).lineTo(margin, yPosition + rowHeight).stroke();
        // Internal vertical lines
        doc.moveTo(col2X - 3, yPosition).lineTo(col2X - 3, yPosition + rowHeight).stroke(); // After #
        doc.moveTo(col3X - 3, yPosition).lineTo(col3X - 3, yPosition + rowHeight).stroke(); // After Product
        doc.moveTo(col4X - 3, yPosition).lineTo(col4X - 3, yPosition + rowHeight).stroke(); // After Category
        doc.moveTo(col5X - 3, yPosition).lineTo(col5X - 3, yPosition + rowHeight).stroke(); // After Qty
        // Right border
        doc.moveTo(margin + contentWidth, yPosition).lineTo(margin + contentWidth, yPosition + rowHeight).stroke();

        // Bottom border
        doc.moveTo(margin, yPosition + rowHeight)
           .lineTo(margin + contentWidth, yPosition + rowHeight)
           .strokeColor('#000000')
           .lineWidth(0.5)
           .stroke();

        totalQty += product.dispatchedQty;
        totalWeight += product.weight;
        yPosition += rowHeight;
      });

      // TOTALS
      doc.rect(margin, yPosition, contentWidth, 15)
         .fillAndStroke('#f0f0f0', '#000000');

      const totalY = yPosition + 4.5;
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('TOTAL', col2X, totalY, { width: 88 })
         .text(totalQty.toString(), col4X, totalY, { width: 48, align: 'center' })
         .text(`${totalWeight.toFixed(2)} kg`, col5X, totalY, { width: 45, align: 'center' });

      yPosition += 15;

      // FOOTER - Compact
      yPosition += 6;
      doc.fontSize(5.5)
         .font('Helvetica')
         .fillColor('#999')
         .text('Computer-generated delivery challan', margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 7;
      doc.fontSize(5)
         .text(`Generated: ${formatDateTime(new Date())}`, margin, yPosition, { align: 'center', width: contentWidth });

      doc.end();
    } catch (error) {
      console.error('Error generating consolidated PDF:', error);
      reject(error);
    }
  });
};

export default {
  generateSalesChallanPDF,
  generateSalesOrderConsolidatedPDF,
  savePDFToFile
};
