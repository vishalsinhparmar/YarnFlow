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
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      // Buffer to store PDF data
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Default company info if not provided
      const company = {
        name: companyInfo.name || 'YarnFlow',
        address: companyInfo.address || 'Business Address Line 1',
        city: companyInfo.city || 'City, State - 000000',
        phone: companyInfo.phone || '+91 00000 00000',
        email: companyInfo.email || 'info@yarnflow.com',
        gstin: companyInfo.gstin || 'GSTIN: 00XXXXX0000X0X0',
        ...companyInfo
      };

      // Page dimensions
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - (2 * margin);

      // ============================================
      // HEADER SECTION - Company Details
      // ============================================
      let yPosition = margin;

      // Company Name (Large, Bold)
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(company.name, margin, yPosition, { align: 'center' });
      
      yPosition += 30;

      // Company Address & Contact
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4a4a4a')
         .text(company.address, margin, yPosition, { align: 'center' });
      
      yPosition += 12;
      
      doc.text(`${company.city} | Phone: ${company.phone} | Email: ${company.email}`, 
               margin, yPosition, { align: 'center' });
      
      yPosition += 12;
      
      if (company.gstin) {
        doc.text(company.gstin, margin, yPosition, { align: 'center' });
        yPosition += 15;
      }

      // Horizontal line after header
      yPosition += 5;
      doc.moveTo(margin, yPosition)
         .lineTo(pageWidth - margin, yPosition)
         .strokeColor('#cccccc')
         .lineWidth(1)
         .stroke();
      
      yPosition += 20;

      // ============================================
      // DOCUMENT TITLE
      // ============================================
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#0891b2')
         .text('DELIVERY CHALLAN', margin, yPosition, { align: 'center' });
      
      yPosition += 30;

      // ============================================
      // CHALLAN INFO & CUSTOMER INFO (Two Columns)
      // ============================================
      const leftColumnX = margin;
      const rightColumnX = pageWidth / 2 + 10;
      const columnStartY = yPosition;

      // LEFT COLUMN - Challan Details
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('Challan Details:', leftColumnX, yPosition);
      
      yPosition += 15;

      const challanDetails = [
        { label: 'Challan No:', value: challanData.challanNumber || 'N/A' },
        { label: 'Date:', value: formatDate(challanData.challanDate) },
        { label: 'SO Reference:', value: challanData.soReference || challanData.salesOrder?.soNumber || 'N/A' },
        { label: 'Warehouse:', value: challanData.warehouseLocation || 'N/A' },
        { label: 'Status:', value: challanData.status || 'Prepared' }
      ];

      doc.fontSize(9).font('Helvetica');
      challanDetails.forEach(detail => {
        doc.fillColor('#4a4a4a')
           .text(detail.label, leftColumnX, yPosition, { width: 90, continued: false });
        doc.fillColor('#1a1a1a')
           .text(detail.value, leftColumnX + 95, yPosition, { width: 150 });
        yPosition += 14;
      });

      // RIGHT COLUMN - Customer Details (Delivery Address)
      yPosition = columnStartY;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('Delivery To:', rightColumnX, yPosition);
      
      yPosition += 15;

      const customerInfo = challanData.customerDetails || {};
      const customerAddress = challanData.customer?.address || {};
      
      // Company Name
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(customerInfo.companyName || challanData.customerName || 'N/A', 
               rightColumnX, yPosition, { width: 200 });
      yPosition += 14;

      // Address
      if (customerAddress.street || customerAddress.city) {
        doc.font('Helvetica').fillColor('#4a4a4a');
        
        if (customerAddress.street) {
          doc.text(customerAddress.street, rightColumnX, yPosition, { width: 200 });
          yPosition += 12;
        }
        
        const cityLine = [
          customerAddress.city,
          customerAddress.state,
          customerAddress.pincode
        ].filter(Boolean).join(', ');
        
        if (cityLine) {
          doc.text(cityLine, rightColumnX, yPosition, { width: 200 });
          yPosition += 12;
        }
        
        if (customerAddress.country) {
          doc.text(customerAddress.country, rightColumnX, yPosition, { width: 200 });
          yPosition += 14;
        }
      }

      // Contact Details
      doc.fontSize(9).font('Helvetica');
      const contactDetails = [
        { label: 'Contact:', value: customerInfo.contactPerson || 'N/A' },
        { label: 'Phone:', value: customerInfo.phone || 'N/A' },
        { label: 'Email:', value: customerInfo.email || 'N/A' }
      ];

      contactDetails.forEach(detail => {
        doc.fillColor('#4a4a4a')
           .text(detail.label, rightColumnX, yPosition, { width: 60, continued: false });
        doc.fillColor('#1a1a1a')
           .text(detail.value, rightColumnX + 65, yPosition, { width: 135 });
        yPosition += 12;
      });

      // Move to next section
      yPosition = Math.max(yPosition, columnStartY + 90) + 20;

      // ============================================
      // ITEMS TABLE
      // ============================================
      
      // Table Header Background
      doc.rect(margin, yPosition, contentWidth, 25)
         .fillColor('#0891b2')
         .fill();

      // Table Headers
      const tableTop = yPosition + 8;
      const col1X = margin + 5;          // S.No
      const col2X = margin + 35;         // Product Code
      const col3X = margin + 130;        // Product Name
      const col4X = margin + 280;        // Ordered Qty
      const col5X = margin + 360;        // Dispatched Qty
      const col6X = margin + 450;        // Unit
      const col7X = margin + 500;        // Weight (kg)

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('S.No', col1X, tableTop, { width: 25 })
         .text('Product Code', col2X, tableTop, { width: 90 })
         .text('Product Name', col3X, tableTop, { width: 145 })
         .text('Ordered', col4X, tableTop, { width: 70, align: 'right' })
         .text('Dispatched', col5X, tableTop, { width: 80, align: 'right' })
         .text('Unit', col6X, tableTop, { width: 45 })
         .text('Weight', col7X, tableTop, { width: 45, align: 'right' });

      yPosition += 25;

      // Table Rows
      const items = challanData.items || [];
      let totalOrderedQty = 0;
      let totalDispatchedQty = 0;
      let totalWeight = 0;
      let rowNumber = 1;

      doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');

      items.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 150) {
          doc.addPage();
          yPosition = margin;
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(margin, yPosition, contentWidth, 20)
             .fillColor('#f9fafb')
             .fill();
        }

        const rowY = yPosition + 6;

        // Row data
        doc.fillColor('#1a1a1a')
           .text(rowNumber.toString(), col1X, rowY, { width: 25 })
           .text(item.productCode || 'N/A', col2X, rowY, { width: 90 })
           .text(item.productName || 'N/A', col3X, rowY, { width: 145 })
           .text((item.orderedQuantity || 0).toString(), col4X, rowY, { width: 70, align: 'right' })
           .text((item.dispatchQuantity || 0).toString(), col5X, rowY, { width: 80, align: 'right' })
           .text(item.unit || 'PCS', col6X, rowY, { width: 45 })
           .text((item.weight || 0).toFixed(2), col7X, rowY, { width: 45, align: 'right' });

        // Accumulate totals
        totalOrderedQty += item.orderedQuantity || 0;
        totalDispatchedQty += item.dispatchQuantity || 0;
        totalWeight += item.weight || 0;

        yPosition += 20;
        rowNumber++;
      });

      // Table border
      doc.rect(margin, tableTop - 8, contentWidth, yPosition - (tableTop - 8))
         .strokeColor('#cccccc')
         .lineWidth(0.5)
         .stroke();

      // ============================================
      // TOTALS ROW
      // ============================================
      yPosition += 5;

      doc.rect(margin, yPosition, contentWidth, 25)
         .fillColor('#f3f4f6')
         .fill();

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('TOTAL', col3X, yPosition + 8, { width: 145 })
         .text(totalOrderedQty.toString(), col4X, yPosition + 8, { width: 70, align: 'right' })
         .text(totalDispatchedQty.toString(), col5X, yPosition + 8, { width: 80, align: 'right' })
         .text(`${totalWeight.toFixed(2)} kg`, col7X - 20, yPosition + 8, { width: 65, align: 'right' });

      yPosition += 30;

      // ============================================
      // SUMMARY SECTION
      // ============================================
      if (yPosition > pageHeight - 200) {
        doc.addPage();
        yPosition = margin;
      }

      yPosition += 10;

      // Summary box
      const summaryBoxY = yPosition;
      doc.rect(margin, summaryBoxY, contentWidth, 80)
         .strokeColor('#0891b2')
         .lineWidth(1)
         .stroke();

      yPosition += 10;

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#0891b2')
         .text('Summary', margin + 10, yPosition);

      yPosition += 18;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#1a1a1a');

      const summaryItems = [
        `Total Items: ${items.length}`,
        `Total Ordered Quantity: ${totalOrderedQty} units`,
        `Total Dispatched Quantity: ${totalDispatchedQty} units`,
        `Total Weight: ${totalWeight.toFixed(2)} kg`,
        `Completion Status: ${totalOrderedQty === totalDispatchedQty ? 'Completed' : 'Partial'}`
      ];

      summaryItems.forEach(item => {
        doc.text(`• ${item}`, margin + 15, yPosition);
        yPosition += 14;
      });

      // ============================================
      // NOTES SECTION (if any)
      // ============================================
      if (challanData.notes) {
        yPosition += 15;

        if (yPosition > pageHeight - 150) {
          doc.addPage();
          yPosition = margin;
        }

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#1a1a1a')
           .text('Notes:', margin, yPosition);

        yPosition += 15;

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#4a4a4a')
           .text(challanData.notes, margin, yPosition, { 
             width: contentWidth,
             align: 'left'
           });

        yPosition += 40;
      }

      // ============================================
      // FOOTER SECTION
      // ============================================
      const footerY = pageHeight - 100;

      // Signature section
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4a4a4a')
         .text('Prepared By', margin, footerY)
         .text('Authorized Signatory', pageWidth - margin - 120, footerY, { width: 120, align: 'right' });

      // Line for signature
      doc.moveTo(margin, footerY + 40)
         .lineTo(margin + 100, footerY + 40)
         .strokeColor('#cccccc')
         .lineWidth(0.5)
         .stroke();

      doc.moveTo(pageWidth - margin - 120, footerY + 40)
         .lineTo(pageWidth - margin, footerY + 40)
         .stroke();

      // Footer note
      const footerNoteY = pageHeight - 40;
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#999999')
         .text('This is a computer-generated delivery challan and does not require a signature.', 
               margin, footerNoteY, { 
                 width: contentWidth, 
                 align: 'center' 
               });

      doc.fontSize(7)
         .text(`Generated on: ${formatDateTime(new Date())}`, 
               margin, footerNoteY + 12, { 
                 width: contentWidth, 
                 align: 'center' 
               });

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
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const company = {
        name: companyInfo.name || 'YarnFlow',
        address: companyInfo.address || 'Business Address',
        city: companyInfo.city || 'City, State',
        phone: companyInfo.phone || 'Phone',
        email: companyInfo.email || 'Email',
        gstin: companyInfo.gstin || 'GSTIN',
        ...companyInfo
      };

      const pageWidth = doc.page.width;
      const margin = 40;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // ============================================
      // HEADER
      // ============================================
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(company.name, margin, yPosition, { align: 'center', width: contentWidth });
      
      yPosition += 25;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4a4a4a')
         .text(`${company.address}`, margin, yPosition, { align: 'center', width: contentWidth });
      
      yPosition += 12;

      doc.text(`${company.city}`, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 12;

      doc.text(`Phone: ${company.phone} | Email: ${company.email}`, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 12;

      doc.text(`${company.gstin}`, margin, yPosition, { align: 'center', width: contentWidth });
      yPosition += 25;

      // Title
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#0891b2')
         .text('CONSOLIDATED DELIVERY CHALLAN', margin, yPosition, { align: 'center', width: contentWidth });
      
      yPosition += 30;

      // ============================================
      // SO & CUSTOMER INFO
      // ============================================
      const leftColumnX = margin;
      const rightColumnX = margin + (contentWidth / 2) + 10;
      const columnStartY = yPosition;

      // LEFT - SO Details
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('Sales Order Details:', leftColumnX, yPosition);
      
      yPosition += 15;

      const soDetails = [
        { label: 'SO Number:', value: consolidatedData.soNumber || 'N/A' },
        { label: 'Order Date:', value: formatDate(consolidatedData.salesOrder?.orderDate) },
        { label: 'Total Challans:', value: consolidatedData.totalChallans || 0 }
      ];

      doc.fontSize(9).font('Helvetica');
      soDetails.forEach(detail => {
        doc.fillColor('#4a4a4a')
           .text(detail.label, leftColumnX, yPosition, { width: 80, continued: false });
        doc.fillColor('#1a1a1a')
           .text(detail.value, leftColumnX + 85, yPosition, { width: 150 });
        yPosition += 14;
      });

      // RIGHT - Customer Address
      yPosition = columnStartY;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('Delivery To:', rightColumnX, yPosition);
      
      yPosition += 15;

      const customerInfo = consolidatedData.customerDetails || {};
      const customerAddress = consolidatedData.customer?.address || {};
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(customerInfo.companyName || 'N/A', rightColumnX, yPosition, { width: 200 });
      yPosition += 14;

      if (customerAddress.street || customerAddress.city) {
        doc.font('Helvetica').fillColor('#4a4a4a');
        
        if (customerAddress.street) {
          doc.text(customerAddress.street, rightColumnX, yPosition, { width: 200 });
          yPosition += 12;
        }
        
        const cityLine = [
          customerAddress.city,
          customerAddress.state,
          customerAddress.pincode
        ].filter(Boolean).join(', ');
        
        if (cityLine) {
          doc.text(cityLine, rightColumnX, yPosition, { width: 200 });
          yPosition += 12;
        }
      }

      yPosition = Math.max(yPosition, columnStartY + 70) + 20;

      // ============================================
      // PRODUCTS TABLE
      // ============================================
      
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
              // Try different field names for category
              categoryName = item.product.category.name || 
                           item.product.category.categoryName || 
                           item.product.category;
            } else if (item.categoryName) {
              categoryName = item.categoryName;
            }
            
            productMap.set(productKey, {
              productCode: item.productCode || item.product?.productCode || 'N/A',
              productName: item.productName || item.product?.productName || 'N/A',
              category: categoryName,
              orderedQty: item.orderedQuantity || 0,
              dispatchedQty: item.dispatchQuantity || 0,
              unit: item.unit || 'Bags',
              weight: item.weight || 0
            });
          }
        });
      });

      const allProducts = Array.from(productMap.values());

      // Table with borders
      const tableStartY = yPosition;
      const tableWidth = contentWidth;
      const colWidths = [35, 160, 95, 65, 55, 75]; // Column widths
      const rowHeight = 22;
      
      // Table Header
      doc.rect(margin, yPosition, tableWidth, 25).fillAndStroke('#0891b2', '#0891b2');
      
      yPosition += 7;

      const tableHeaders = [
        { text: 'S.No', width: colWidths[0] },
        { text: 'Product Name', width: colWidths[1] },
        { text: 'Category', width: colWidths[2] },
        { text: 'Quantity', width: colWidths[3] },
        { text: 'Unit', width: colWidths[4] },
        { text: 'Weight (kg)', width: colWidths[5] }
      ];

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#ffffff');

      let xPos = margin + 5;
      tableHeaders.forEach((header, i) => {
        doc.text(header.text, xPos, yPosition, { width: header.width - 10, align: i === 0 ? 'left' : 'left' });
        xPos += header.width;
      });

      yPosition += 20;

      // Table Rows with borders
      doc.fontSize(9).font('Helvetica').fillColor('#1a1a1a');

      let totalQty = 0;
      let totalWeight = 0;

      allProducts.forEach((product, index) => {
        if (yPosition > 720) {
          doc.addPage();
          yPosition = margin;
        }

        const rowY = yPosition;

        // Row background (alternate colors)
        if (index % 2 === 0) {
          doc.rect(margin, rowY, tableWidth, rowHeight).fillAndStroke('#f9fafb', '#d1d5db');
        } else {
          doc.rect(margin, rowY, tableWidth, rowHeight).stroke('#d1d5db');
        }

        // Draw vertical lines for columns
        let currentX = margin;
        colWidths.forEach(width => {
          doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke('#d1d5db');
          currentX += width;
        });
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke('#d1d5db');

        // Cell content
        doc.fillColor('#1a1a1a');
        xPos = margin + 5;
        
        doc.text((index + 1).toString(), xPos, rowY + 6, { width: colWidths[0] - 10, align: 'left' });
        xPos += colWidths[0];
        
        doc.text(product.productName, xPos, rowY + 6, { width: colWidths[1] - 10, align: 'left' });
        xPos += colWidths[1];
        
        doc.text(product.category, xPos, rowY + 6, { width: colWidths[2] - 10, align: 'left' });
        xPos += colWidths[2];
        
        doc.text(product.dispatchedQty.toString(), xPos, rowY + 6, { width: colWidths[3] - 10, align: 'right' });
        xPos += colWidths[3];
        
        doc.text(product.unit, xPos, rowY + 6, { width: colWidths[4] - 10, align: 'center' });
        xPos += colWidths[4];
        
        doc.text(product.weight.toFixed(2), xPos, rowY + 6, { width: colWidths[5] - 10, align: 'right' });

        totalQty += product.dispatchedQty;
        totalWeight += product.weight;

        yPosition += rowHeight;
      });

      // Totals Row with border
      doc.rect(margin, yPosition, tableWidth, 24).fillAndStroke('#e5e7eb', '#d1d5db');
      
      // Draw vertical lines for totals row
      let currentX = margin;
      colWidths.forEach(width => {
        doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + 24).stroke('#d1d5db');
        currentX += width;
      });
      doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + 24).stroke('#d1d5db');
      
      yPosition += 7;

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a');
      
      xPos = margin + colWidths[0] + colWidths[1] + 5;
      doc.text('TOTAL', xPos, yPosition, { width: colWidths[2] - 10, align: 'left' });
      xPos += colWidths[2];
      
      doc.text(totalQty.toString(), xPos, yPosition, { width: colWidths[3] - 10, align: 'right' });
      xPos += colWidths[3] + colWidths[4];
      
      doc.text(totalWeight.toFixed(2), xPos, yPosition, { width: colWidths[5] - 10, align: 'right' });

      yPosition += 30;

      // Summary
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text('Summary:', margin, yPosition);
      
      yPosition += 15;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4a4a4a')
         .text(`• Total Products: ${allProducts.length}`, margin, yPosition);
      yPosition += 14;
      doc.text(`• Total Quantity: ${totalQty} units`, margin, yPosition);
      yPosition += 14;
      doc.text(`• Total Weight: ${totalWeight.toFixed(2)} kg`, margin, yPosition);
      yPosition += 14;
      doc.text(`• Number of Challans: ${consolidatedData.totalChallans}`, margin, yPosition);
      yPosition += 14;
      doc.text(`• Status: Completed & Delivered`, margin, yPosition);

      yPosition += 30;

      // Footer
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text('This is a computer-generated document', margin, yPosition, { align: 'center', width: contentWidth });
      
      yPosition += 12;

      doc.text(`Generated on: ${formatDateTime(new Date())}`, margin, yPosition, { align: 'center', width: contentWidth });

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
