import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';


/**
 * Generate Sales Challan PDF Invoice
 * Production-ready, dynamically-sized PDF — never clips content.
 * @param {Object} challanData - Complete challan data with populated fields
 * @param {Object} companyInfo - Live company profile from DB
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateSalesChallanPDF = async (challanData, companyInfo = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // ─── Resolve company fields (all filtered, never raw empty strings) ───
      const company = {
        name:          companyInfo.companyName || 'Company Name',
        hoAddress:     companyInfo.headOfficeAddress || '',
        boAddress:     companyInfo.branchOfficeAddress || '',
        phone:         companyInfo.phone || '',
        msmeNo:        companyInfo.msmeNo || '',
        gstin:         companyInfo.gstin || '',
        panNo:         companyInfo.panNo || '',
        email:         companyInfo.email || '',
        city:          companyInfo.city || '',
        state:         companyInfo.state || '',
        // *** KEY FIX: filter out blank strings before using ***
        terms:         (companyInfo.challanTermsAndConditions || []).filter(t => t && t.trim()),
        footerNote:    companyInfo.challanFooterNote || 'Computer-generated delivery challan',
        signatureLabel:companyInfo.signatureLabel || 'For',
      };

      // ─── Layout constants ─────────────────────────────────────────────────
      const M  = 20;           // margin
      const PW = 298;          // page width (A6)
      const CW = PW - M * 2;  // content width = 258
      const items = challanData.items || [];

      // ─── Row height helper ────────────────────────────────────────────────
      const rowH = (item) => {
        if (item.notes && item.notes.trim()) {
          const lines = Math.ceil(item.notes.length / 34);
          return Math.max(20, Math.min(14 + lines * 8 + 4, 44));
        }
        return 14;
      };

      // ─── Pre-compute page height so nothing is clipped ───────────────────
      const addrLines = [company.hoAddress, company.boAddress].filter(Boolean).length;
      const contactParts = [
        company.phone  ? `Mobile: ${company.phone}` : '',
        company.msmeNo ? `MSME: ${company.msmeNo}` : '',
        company.panNo  ? `PAN: ${company.panNo}` : ''
      ].filter(Boolean);

      const HEADER_H  = 16                            // company name
                      + addrLines * 9                 // address lines
                      + (contactParts.length ? 9 : 0) // phone/msme line
                      + (company.gstin ? 10 : 0)      // gstin
                      + 14                            // "DELIVERY CHALLAN" title
                      + 6;                            // separator
      const DETAILS_H = 48 + 6;                       // info box + gap
      const TABLE_H   = 16                            // header row
                      + items.reduce((s, it) => s + rowH(it), 0)
                      + 16;                           // totals row
      const TERMS_H   = company.terms.length > 0
                        ? 6 + 8 + company.terms.length * 8 + 4
                        : 6;
      const SIG_H     = 24;   // signature row
      const FOOT_H    = 18;   // footer lines
      const PAD       = 14;

      const computedH = M + HEADER_H + DETAILS_H + TABLE_H + TERMS_H + SIG_H + FOOT_H + PAD;
      const pageHeight = Math.max(420, computedH);

      // ─── Create document ──────────────────────────────────────────────────
      const doc = new PDFDocument({ size: [PW, pageHeight], margin: M, bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = M;

      // ════════════════════════════════════════════════
      // SECTION 1 — COMPANY HEADER
      // ════════════════════════════════════════════════

      // Company name
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#111111')
         .text(company.name, M, y, { align: 'center', width: CW });
      y += 16;

      // Address lines
      if (company.hoAddress) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#555555')
           .text(`H.O. – ${company.hoAddress}`, M, y, { align: 'center', width: CW });
        y += 9;
      }
      if (company.boAddress) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#555555')
           .text(`B.O. – ${company.boAddress}`, M, y, { align: 'center', width: CW });
        y += 9;
      }

      // Phone / MSME / PAN on one line
      if (contactParts.length > 0) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#555555')
           .text(contactParts.join('  |  '), M, y, { align: 'center', width: CW });
        y += 9;
      }

      // GSTIN — bold, prominent
      if (company.gstin) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#222222')
           .text(`GST: ${company.gstin}`, M, y, { align: 'center', width: CW });
        y += 10;
      }

      // "DELIVERY CHALLAN" badge
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0369a1')
         .text('DELIVERY CHALLAN', M, y, { align: 'center', width: CW });
      y += 14;

      // Full-width rule
      doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#cbd5e1').lineWidth(0.6).stroke();
      y += 6;

      // ════════════════════════════════════════════════
      // SECTION 2 — CHALLAN INFO BOX (two columns)
      // ════════════════════════════════════════════════

      const BOX_H  = 48;
      const divX   = M + Math.floor(CW / 2);
      const leftX  = M + 5;
      const rightX = divX + 5;

      // Box outline
      doc.rect(M, y, CW, BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();
      // Vertical divider
      doc.moveTo(divX, y).lineTo(divX, y + BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();

      const boxY = y + 6;

      // Left column — Challan details
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280')
         .text('Challan No.', leftX, boxY);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111111')
         .text(challanData.challanNumber || 'N/A', leftX, boxY + 8);
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280')
         .text('Date', leftX, boxY + 20);
      doc.fontSize(7).font('Helvetica').fillColor('#111111')
         .text(formatDate(challanData.challanDate), leftX, boxY + 28);

      // Left column secondary — SO ref
      const soRef = challanData.salesOrder?.soNumber || challanData.soReference || '';
      if (soRef) {
        doc.fontSize(6).font('Helvetica').fillColor('#6b7280')
           .text('SO Ref.', leftX, boxY + 37);
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#0369a1')
           .text(soRef, leftX + 22, boxY + 37);
      }

      // Right column — Customer
      const customerInfo    = challanData.customerDetails || {};
      const customerAddress = challanData.customer?.address || {};
      const customerName    = customerInfo.companyName || challanData.customerName || 'N/A';
      const cityState       = [customerAddress.city, customerAddress.state].filter(Boolean).join(', ');
      const customerGST     = customerInfo.gstNumber || challanData.customer?.gstNumber || '';

      doc.fontSize(6).font('Helvetica').fillColor('#6b7280')
         .text('Delivery To', rightX, boxY);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111111')
         .text(customerName, rightX, boxY + 8, { width: divX - rightX - 4 });
      if (cityState) {
        doc.fontSize(6).font('Helvetica').fillColor('#555555')
           .text(cityState, rightX, boxY + 20, { width: divX - rightX - 4 });
      }
      if (customerGST) {
        doc.fontSize(6).font('Helvetica').fillColor('#555555')
           .text(`GSTIN: ${customerGST}`, rightX, boxY + 30, { width: divX - rightX - 4 });
      }

      y += BOX_H + 6;

      // ════════════════════════════════════════════════
      // SECTION 3 — ITEMS TABLE
      // ════════════════════════════════════════════════

      // Column layout
      const C1X = M,         C1W = 14;   // #
      const C2X = M + 14,    C2W = 88;   // Product
      const C3X = M + 102,   C3W = 58;   // Category
      const C4X = M + 160,   C4W = 46;   // Qty
      const C5X = M + 206,   C5W = 52;   // Weight (right-edge = M+258=CW+M ✓)

      const TH = 16; // table header height

      // Header fill
      doc.rect(M, y, CW, TH).fillColor('#1e3a5f').fill();

      // Draw full outer border on header
      doc.rect(M, y, CW, TH).strokeColor('#1e3a5f').lineWidth(0.5).stroke();

      // Header text
      const hY = y + 5;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
         .text('#',        C1X + 2, hY, { width: C1W - 2, align: 'center' })
         .text('Product',  C2X + 2, hY, { width: C2W - 4 })
         .text('Category', C3X,     hY, { width: C3W,     align: 'center' })
         .text('Qty',      C4X,     hY, { width: C4W,     align: 'center' })
         .text('Weight',   C5X,     hY, { width: C5W - 2, align: 'center' });

      y += TH;

      // Column dividers helper
      const drawColDividers = (top, height, color = '#d1d5db') => {
        doc.strokeColor(color).lineWidth(0.4);
        [C2X, C3X, C4X, C5X].forEach(cx => {
          doc.moveTo(cx, top).lineTo(cx, top + height).stroke();
        });
      };

      let totalQty = 0;
      let totalWeight = 0;

      items.forEach((item, index) => {
        const rh      = rowH(item);
        const hasNote = item.notes && item.notes.trim();
        const rY      = y + 4;

        // Alternating row background
        doc.rect(M, y, CW, rh)
           .fillColor(index % 2 === 0 ? '#f8fafc' : '#ffffff')
           .fill();

        // Row border (bottom only — cleaner look)
        doc.moveTo(M, y + rh).lineTo(M + CW, y + rh)
           .strokeColor('#e2e8f0').lineWidth(0.4).stroke();

        // Outer borders
        doc.moveTo(M,      y).lineTo(M,      y + rh).strokeColor('#94a3b8').lineWidth(0.4).stroke();
        doc.moveTo(M + CW, y).lineTo(M + CW, y + rh).strokeColor('#94a3b8').lineWidth(0.4).stroke();

        // Col dividers
        drawColDividers(y, rh);

        // Resolve category
        let cat = 'N/A';
        if      (challanData.salesOrder?.category?.categoryName) cat = challanData.salesOrder.category.categoryName;
        else if (challanData.salesOrder?.category?.name)         cat = challanData.salesOrder.category.name;
        else if (item.product?.category?.categoryName)           cat = item.product.category.categoryName;
        else if (item.product?.category?.name)                   cat = item.product.category.name;
        else if (item.categoryName)                              cat = item.categoryName;
        else if (item.category?.categoryName)                    cat = item.category.categoryName;
        else if (item.category?.name)                            cat = item.category.name;

        // Row data
        doc.fontSize(7).font('Helvetica').fillColor('#1e293b')
           .text(String(index + 1),                          C1X + 2, rY, { width: C1W - 2, align: 'center' })
           .text(item.productName || 'N/A',                  C2X + 3, rY, { width: C2W - 6 })
           .text(cat,                                         C3X + 2, rY, { width: C3W - 4, align: 'center' })
           .text(`${item.dispatchQuantity || 0} ${item.unit || 'Bags'}`, C4X + 2, rY, { width: C4W - 4, align: 'center' })
           .text(`${(item.weight || 0).toFixed(2)} kg`,      C5X + 2, rY, { width: C5W - 4, align: 'right'  });

        // Notes (italic, blue)
        if (hasNote) {
          doc.fontSize(6).font('Helvetica-Oblique').fillColor('#1d4ed8')
             .text(item.notes, C2X + 3, rY + 10, { width: C2W - 6, height: rh - 14 });
        }

        totalQty    += item.dispatchQuantity || 0;
        totalWeight += item.weight || 0;
        y += rh;
      });

      // Totals row
      const TR_H = 16;
      doc.rect(M, y, CW, TR_H).fillColor('#e8f0fe').fill();
      doc.rect(M, y, CW, TR_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();
      drawColDividers(y, TR_H, '#94a3b8');

      const tY = y + 5;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a')
         .text('TOTAL',                              C2X + 3, tY, { width: C2W + C3W - 6 })
         .text(String(totalQty),                     C4X + 2, tY, { width: C4W - 4, align: 'center' })
         .text(`${totalWeight.toFixed(2)} kg`,       C5X + 2, tY, { width: C5W - 4, align: 'right'  });
      y += TR_H;

      // ════════════════════════════════════════════════
      // SECTION 4 — TERMS & CONDITIONS
      // ════════════════════════════════════════════════

      y += 6;
      doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      y += 5;

      if (company.terms.length > 0) {
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#374151')
           .text('Terms & Conditions:', M, y);
        y += 8;

        company.terms.forEach((term, i) => {
          doc.fontSize(6).font('Helvetica').fillColor('#4b5563')
             .text(`${i + 1}.  ${term}`, M + 6, y, { width: CW - 6 });
          y += 8;
        });
        y += 3;
      }

      // ════════════════════════════════════════════════
      // SECTION 5 — SIGNATURE & FOOTER
      // ════════════════════════════════════════════════

      // Signature block — right-aligned
      doc.moveTo(M + CW - 80, y).lineTo(M + CW, y).strokeColor('#94a3b8').lineWidth(0.4).stroke();
      y += 4;
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280')
         .text(`${company.signatureLabel} ${company.name}`, M, y, { align: 'right', width: CW });
      y += 8;
      doc.fontSize(5.5).font('Helvetica').fillColor('#9ca3af')
         .text('Authorised Signatory', M, y, { align: 'right', width: CW });
      y += 10;

      // Footer rule
      doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#e2e8f0').lineWidth(0.4).stroke();
      y += 5;

      // Footer text
      doc.fontSize(5.5).font('Helvetica').fillColor('#9ca3af')
         .text(company.footerNote, M, y, { align: 'center', width: CW });
      y += 7;
      doc.fontSize(5).font('Helvetica').fillColor('#9ca3af')
         .text(`Generated: ${formatDateTime(new Date())}`, M, y, { align: 'center', width: CW });

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
      // ─── Resolve company fields ───────────────────────────────────────────
      const company = {
        name:           companyInfo.companyName          || 'Company Name',
        hoAddress:      companyInfo.headOfficeAddress    || '',
        boAddress:      companyInfo.branchOfficeAddress  || '',
        phone:          companyInfo.phone                || '',
        msmeNo:         companyInfo.msmeNo               || '',
        gstin:          companyInfo.gstin                || '',
        panNo:          companyInfo.panNo                || '',
        city:           companyInfo.city                 || '',
        terms:          (companyInfo.challanTermsAndConditions || []).filter(t => t && t.trim()),
        footerNote:     companyInfo.challanFooterNote    || 'Computer-generated delivery challan',
        signatureLabel: companyInfo.signatureLabel       || 'For',
      };

      const contactParts = [
        company.phone  ? `Mobile: ${company.phone}`    : '',
        company.msmeNo ? `MSME: ${company.msmeNo}`     : '',
        company.panNo  ? `PAN: ${company.panNo}`       : '',
      ].filter(Boolean);

      // ─── Layout constants ─────────────────────────────────────────────────
      const M  = 20;
      const PW = 298;
      const CW = PW - M * 2;

      // ─── Consolidate products from all challans ───────────────────────────
      const productMap = new Map();
      consolidatedData.challans.forEach(challan => {
        challan.items?.forEach(item => {
          const key = `${item.product?._id || item.productCode}__${item.subProduct || ''}`;
          if (productMap.has(key)) {
            const ex = productMap.get(key);
            ex.dispatchedQty += item.dispatchQuantity || 0;
            ex.weight        += item.weight           || 0;
          } else {
            let cat = 'N/A';
            if      (item.product?.category?.categoryName) cat = item.product.category.categoryName;
            else if (item.product?.category?.name)         cat = item.product.category.name;
            else if (item.categoryName)                    cat = item.categoryName;
            else if (item.category?.categoryName)          cat = item.category.categoryName;
            else if (item.product?.categoryName)           cat = item.product.categoryName;
            else if (item.productName)                     cat = 'General';
            productMap.set(key, {
              productName:  item.productName || item.product?.productName || 'N/A',
              subProduct:   item.subProductName || '',
              category:     cat,
              dispatchedQty: item.dispatchQuantity || 0,
              unit:         item.unit   || 'Bags',
              weight:       item.weight || 0,
              notes:        item.notes  || '',
            });
          }
        });
      });
      const allProducts = Array.from(productMap.values());

      // ─── Row height helper ────────────────────────────────────────────────
      const rowH = (p) => {
        if (p.notes && p.notes.trim()) {
          return Math.max(20, Math.min(14 + Math.ceil(p.notes.length / 34) * 8 + 4, 44));
        }
        return 14;
      };

      // ─── Pre-compute page height ──────────────────────────────────────────
      const addrLines = [company.hoAddress, company.boAddress].filter(Boolean).length;
      let H = M;
      H += 16;                            // company name
      H += addrLines * 9;                 // address lines
      H += contactParts.length > 0 ? 9 : 0;
      H += company.gstin ? 10 : 0;
      H += 14 + 6 + 6;                    // DELIVERY CHALLAN + rule + gap
      H += 48 + 6;                        // info box + gap
      H += 18;                            // table header
      allProducts.forEach(p => { H += rowH(p); });
      H += 15 + 8;                        // totals row + gap
      if (company.terms.length > 0) {
        H += 7;                           // T&C heading
        H += company.terms.length * 11;   // each term
        H += 6;
      }
      H += 30 + 6;                        // signature block
      H += 6 + 7 + 7;                     // footer
      H += M;
      const pageHeight = Math.max(420, H);

      // ─── Create document ──────────────────────────────────────────────────
      const doc = new PDFDocument({ size: [PW, pageHeight], margin: M, bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = M;

      // ════════════════════════════════════════════
      // SECTION 1 — COMPANY HEADER
      // ════════════════════════════════════════════
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#111111')
         .text(company.name, M, y, { align: 'center', width: CW });
      y += 16;

      if (company.hoAddress) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#555555')
           .text(`H.O. – ${company.hoAddress}`, M, y, { align: 'center', width: CW });
        y += 9;
      }
      if (company.boAddress) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#555555')
           .text(`B.O. – ${company.boAddress}`, M, y, { align: 'center', width: CW });
        y += 9;
      }
      if (contactParts.length > 0) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#555555')
           .text(contactParts.join('  |  '), M, y, { align: 'center', width: CW });
        y += 9;
      }
      if (company.gstin) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#222222')
           .text(`GST: ${company.gstin}`, M, y, { align: 'center', width: CW });
        y += 10;
      }

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0369a1')
         .text('DELIVERY CHALLAN', M, y, { align: 'center', width: CW });
      y += 14;

      doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#cbd5e1').lineWidth(0.6).stroke();
      y += 6;

      // ════════════════════════════════════════════
      // SECTION 2 — INFO BOX (two columns)
      // ════════════════════════════════════════════
      const BOX_H  = 48;
      const divX   = M + Math.floor(CW / 2);
      const leftX  = M + 5;
      const rightX = divX + 5;

      doc.rect(M, y, CW, BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();
      doc.moveTo(divX, y).lineTo(divX, y + BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();

      const boxY = y + 6;
      const customerInfo  = consolidatedData.customerDetails || {};
      const customerAddr  = consolidatedData.customer?.address || {};

      // Left — SO reference + order date
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('SO Ref.', leftX, boxY);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0369a1')
         .text(consolidatedData.soNumber || 'N/A', leftX, boxY + 8);
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Order Date', leftX, boxY + 20);
      doc.fontSize(7).font('Helvetica').fillColor('#111111')
         .text(formatDate(consolidatedData.salesOrder?.orderDate), leftX, boxY + 28);

      // Right — customer
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Delivery To', rightX, boxY);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111111')
         .text(customerInfo.companyName || 'N/A', rightX, boxY + 8, { width: divX - rightX - 4 });

      const cityLine = [customerAddr.city || company.city, customerAddr.state].filter(Boolean).join(', ');
      if (cityLine) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#6b7280')
           .text(cityLine, rightX, boxY + 20, { width: divX - rightX - 4 });
      }
      if (customerInfo.gstin) {
        doc.fontSize(6.5).font('Helvetica').fillColor('#555555')
           .text(`GSTIN: ${customerInfo.gstin}`, rightX, boxY + 30, { width: divX - rightX - 4 });
      }

      y += BOX_H + 6;

      // ════════════════════════════════════════════
      // SECTION 3 — ITEMS TABLE
      // ════════════════════════════════════════════
      const c1x = M + 4,   c1w = 12;
      const c2x = M + 18,  c2w = 86;
      const c3x = M + 108, c3w = 58;
      const c4x = M + 170, c4w = 46;
      const c5x = M + 218, c5w = 40;

      const TH = 18;
      doc.rect(M, y, CW, TH).fillColor('#1e3a5f').fill();
      const thY = y + 5;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
         .text('#',        c1x, thY, { width: c1w, align: 'center' })
         .text('Product',  c2x, thY, { width: c2w, align: 'center' })
         .text('Category', c3x, thY, { width: c3w, align: 'center' })
         .text('Qty',      c4x, thY, { width: c4w, align: 'center' })
         .text('Weight',   c5x, thY, { width: c5w, align: 'right'  });

      // column dividers in header
      const divLine = (x) => doc.moveTo(x, y).lineTo(x, y + TH).strokeColor('#2d4f7c').lineWidth(0.4).stroke();
      [c2x - 2, c3x - 2, c4x - 2, c5x - 2].forEach(divLine);

      y += TH;

      let totalQty = 0, totalWeight = 0;

      allProducts.forEach((product, idx) => {
        const rh   = rowH(product);
        const fill = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(M, y, CW, rh).fillColor(fill).fill();

        const ry = y + 4;
        const label = product.subProduct
          ? `${product.productName} × ${product.subProduct}`
          : product.productName;

        doc.fillColor('#1e293b').fontSize(7).font('Helvetica')
           .text((idx + 1).toString(),         c1x, ry, { width: c1w, align: 'center' })
           .text(label,                         c2x, ry, { width: c2w - 2 })
           .text(product.category,              c3x, ry, { width: c3w, align: 'center' })
           .text(`${product.dispatchedQty} ${product.unit}`, c4x, ry, { width: c4w, align: 'center' })
           .text(`${product.weight.toFixed(2)} kg`,          c5x, ry, { width: c5w, align: 'right' });

        if (product.notes && product.notes.trim()) {
          doc.fontSize(6).font('Helvetica-Oblique').fillColor('#2563eb')
             .text(product.notes, c2x, ry + 9, { width: c2w - 2 });
        }

        // column dividers per row
        [c2x - 2, c3x - 2, c4x - 2, c5x - 2].forEach(x =>
          doc.moveTo(x, y).lineTo(x, y + rh).strokeColor('#e2e8f0').lineWidth(0.3).stroke()
        );
        doc.moveTo(M, y + rh).lineTo(M + CW, y + rh).strokeColor('#e2e8f0').lineWidth(0.3).stroke();

        totalQty    += product.dispatchedQty;
        totalWeight += product.weight;
        y += rh;
      });

      // Totals row
      doc.rect(M, y, CW, 15).fillColor('#e8f0fe').fill();
      const ty = y + 4;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1e293b')
         .text('TOTAL', c2x, ty, { width: c2w + c3w })
         .text(totalQty.toString(),            c4x, ty, { width: c4w, align: 'center' })
         .text(`${totalWeight.toFixed(2)} kg`, c5x, ty, { width: c5w, align: 'right'  });
      doc.rect(M, y, CW, 15).strokeColor('#94a3b8').lineWidth(0.4).stroke();
      y += 15 + 8;

      // ════════════════════════════════════════════
      // SECTION 4 — TERMS & CONDITIONS
      // ════════════════════════════════════════════
      if (company.terms.length > 0) {
        doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
        y += 5;
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#1e293b')
           .text('Terms & Conditions:', M, y);
        y += 7;
        company.terms.forEach((term, i) => {
          doc.fontSize(6).font('Helvetica').fillColor('#374151')
             .text(`${i + 1}.  ${term}`, M + 4, y, { width: CW - 4 });
          y += 11;
        });
        y += 4;
      }

      // ════════════════════════════════════════════
      // SECTION 5 — SIGNATURE
      // ════════════════════════════════════════════
      const sigX = M + CW - 80;
      doc.moveTo(sigX, y + 20).lineTo(M + CW, y + 20).strokeColor('#475569').lineWidth(0.5).stroke();
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#1e293b')
         .text(`${company.signatureLabel} ${company.name}`, sigX, y + 22, { width: 80, align: 'center' });
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280')
         .text('Authorised Signatory', sigX, y + 30, { width: 80, align: 'center' });
      y += 36;

      // ════════════════════════════════════════════
      // SECTION 6 — FOOTER
      // ════════════════════════════════════════════
      doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#cbd5e1').lineWidth(0.4).stroke();
      y += 5;
      doc.fontSize(5.5).font('Helvetica').fillColor('#94a3b8')
         .text(company.footerNote, M, y, { align: 'center', width: CW });
      y += 7;
      doc.fontSize(5).font('Helvetica').fillColor('#94a3b8')
         .text(`Generated: ${formatDateTime(new Date())}`, M, y, { align: 'center', width: CW });

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
