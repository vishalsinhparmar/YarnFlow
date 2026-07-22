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

      // ─── Format weight: omit trailing .00 for whole numbers ───────────────
      const formatW = (n) => {
        const v = Number(n);
        return v % 1 === 0 ? String(v) : v.toFixed(2);
      };

      const contactParts = [
        company.phone  ? `Mobile: ${company.phone}` : '',
        company.msmeNo ? `MSME: ${company.msmeNo}` : '',
        company.panNo  ? `PAN: ${company.panNo}` : ''
      ].filter(Boolean);

      // ─── Row height: col2 = product name lines + note lines stacked;
      //                col4 = weight text lines. Row = max of both * LINE_H + PAD.
      // At font size 7 on col2 (width=82px): ~16 chars/line (Helvetica 7pt ~5px/char)
      // At font size 7 on col4 (width=96px): ~20 chars/line
      const C2_CPL = 16;  // chars per line in Product column (col2, font 7)
      const C4_CPL = 23;  // chars per line in Weight column (col4=96px, font 7pt ≈ 4.2px/char)
      const ROW_LINE_H = 7;  // px per text line (Helvetica 7pt actual line height)
      const ROW_PAD    = 6;  // top+bottom padding per row

      const rowH = (item) => {
        const hasSub = Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0;
        const label = item.subProductName
          ? `${item.productName || ''} × ${item.subProductName}`
          : (item.productName || '');
        // col2: product name lines
        const productLines = Math.max(1, Math.ceil(label.length / C2_CPL));
        // col2: note lines (placed below product name)
        const noteLines = item.notes && item.notes.trim()
          ? Math.ceil(item.notes.length / C2_CPL) : 0;
        const col2Lines = productLines + noteLines;
        // col4: weight text lines
        const wText = hasSub
          ? item.subProductWeights.map(w => formatW(w)).join(', ') + ' kg'
          : `${formatW(item.weight || 0)} kg`;
        const col4Lines = Math.max(1, Math.ceil(wText.length / C4_CPL));
        const totalLines = Math.max(col2Lines, col4Lines);
        return Math.max(18, totalLines * ROW_LINE_H + ROW_PAD);
      };

      // ─── Fixed dimensions ─────────────────────────────────────────────────
      const BOX_H = 60;  // info box
      const TH    = 16;  // table header height
      const TR_H  = 14;  // totals row height

      // Always A6 height pages — overflow adds pages as needed
      const A6_H = 420;
      const termsBlockH = company.terms.length > 0
        ? 11 + company.terms.length * 8 : 0;
      // Footer block height: gap(6) + sig(36) + rule+footer(18) = 60
      const FOOTER_H = 60;

      // ─── Create document ─────────────────────────────────────────────────
      const doc = new PDFDocument({
        size: [PW, A6_H],
        margin: M,
        bufferPages: true,
        autoFirstPage: true,
      });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // pageBottom = usable bottom of current page
      let pageBottom = A6_H - M;

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

      const divX   = M + Math.floor(CW / 2);
      const leftX  = M + 5;
      const rightX = divX + 5;

      // Box outline
      doc.rect(M, y, CW, BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();
      // Vertical divider
      doc.moveTo(divX, y).lineTo(divX, y + BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();

      const boxY = y + 6;

      // Left column — stacked rows: Challan No. | Date | SO Ref | Warehouse
      // Row 1: Challan No. label + value
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Challan No.', leftX, boxY);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111111').text(challanData.challanNumber || 'N/A', leftX, boxY + 7);

      // Row 2: Date label + value (inline on same line)
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Date', leftX, boxY + 19);
      doc.fontSize(6.5).font('Helvetica').fillColor('#111111').text(formatDate(challanData.challanDate), leftX + 16, boxY + 19);

      // Row 3: SO Ref label + value (inline)
      const soRef = challanData.salesOrder?.soNumber || challanData.soReference || '';
      if (soRef) {
        doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('SO Ref.', leftX, boxY + 30);
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#0369a1').text(soRef, leftX + 22, boxY + 30, { width: (divX - leftX) - 24 });
      }

      // Row 4: Warehouse label + value (inline)
      const warehouseLoc = challanData.warehouseLocation || '';
      if (warehouseLoc) {
        doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Warehouse', leftX, boxY + 41);
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#166534').text(warehouseLoc, leftX + 36, boxY + 41, { width: (divX - leftX) - 38 });
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

      // Column layout: CW=258: 12+82+32+96+36=258 ✓
      const C1X = M,         C1W = 12;
      const C2X = M + 12,    C2W = 82;
      const C3X = M + 94,    C3W = 32;
      const C4X = M + 126,   C4W = 96;
      const C5X = M + 222,   C5W = 36;

      const hasAnySubProduct = items.some(it =>
        Array.isArray(it.subProductWeights) && it.subProductWeights.length > 0
      );

      // ─── Helper: draw table header row, returns new y ─────────────────────
      const drawTableHeader = (yy) => {
        doc.rect(M, yy, CW, TH).fillColor('#1e3a5f').fill();
        const hY = yy + 5;
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
           .text('#',         C1X + 1, hY, { width: C1W - 2, align: 'center' })
           .text('Product',   C2X + 2, hY, { width: C2W - 4 })
           .text('Qty',       C3X + 1, hY, { width: C3W - 2, align: 'center' });
        if (hasAnySubProduct) {
          doc.text('Weight',    C4X + 2, hY, { width: C4W - 4, align: 'center' })
             .text('Total Wt.', C5X + 2, hY, { width: C5W - 4, align: 'center' });
        } else {
          doc.text('Weight',    C4X + 2, hY, { width: C4W + C5W - 4, align: 'center' });
        }
        const hDivCols = hasAnySubProduct ? [C2X, C3X, C4X, C5X] : [C2X, C3X, C4X];
        hDivCols.forEach(cx =>
          doc.moveTo(cx, yy).lineTo(cx, yy + TH).strokeColor('#2d4f7c').lineWidth(0.4).stroke()
        );
        return yy + TH;
      };

      // ─── Helper: draw col dividers for a data row ─────────────────────────
      const drawColDividers = (top, height, color, skipC5) => {
        doc.strokeColor(color).lineWidth(0.4);
        const cols = skipC5 ? [C2X, C3X, C4X] : [C2X, C3X, C4X, C5X];
        cols.forEach(cx => doc.moveTo(cx, top).lineTo(cx, top + height).stroke());
      };

      // ─── Helper: new page with continuation header ────────────────────────
      const addContinuationPage = () => {
        doc.addPage({ size: [PW, A6_H], margin: M });
        pageBottom = A6_H - M;
        let yy = M;
        doc.fontSize(6).font('Helvetica').fillColor('#94a3b8')
           .text(`${challanData.challanNumber || ''} — continued`, M, yy, { align: 'right', width: CW });
        yy += 10;
        return drawTableHeader(yy);
      };

      y = drawTableHeader(y);

      let totalQty = 0;
      let totalWeight = 0;

      items.forEach((item, index) => {
        const rh     = rowH(item);
        const hasSub = Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0;

        // Page break: only if this row itself won't fit (totals/footer checked separately)
        if (y + rh > pageBottom) {
          y = addContinuationPage();
        }

        const rY = y + 4;
        doc.rect(M, y, CW, rh)
           .fillColor(index % 2 === 0 ? '#f8fafc' : '#ffffff')
           .fill();
        doc.moveTo(M, y + rh).lineTo(M + CW, y + rh).strokeColor('#cbd5e1').lineWidth(0.6).stroke();
        doc.moveTo(M,      y).lineTo(M,      y + rh).strokeColor('#64748b').lineWidth(1.0).stroke();
        doc.moveTo(M + CW, y).lineTo(M + CW, y + rh).strokeColor('#64748b').lineWidth(1.0).stroke();
        drawColDividers(y, rh, '#d1d5db', !hasSub);

        const productLabel = item.subProductName
          ? `${item.productName || 'N/A'} × ${item.subProductName}`
          : (item.productName || 'N/A');

        // Product name in col2
        doc.fontSize(7).font('Helvetica').fillColor('#1e293b')
           .text(String(index + 1), C1X + 1, rY, { width: C1W - 2, align: 'center' })
           .text(productLabel,      C2X + 2, rY, { width: C2W - 4, lineBreak: true })
           .text(`${item.dispatchQuantity || 0} ${item.unit || 'Bags'}`, C3X + 1, rY, { width: C3W - 2, align: 'center' });

        // Weight in col4 (and col5 for sub-product)
        if (hasSub) {
          const bagWeightStr = item.subProductWeights.map(w => formatW(w)).join(', ') + ' kg';
          const totalWt = item.subProductWeights.reduce((s, w) => s + (Number(w) || 0), 0);
          doc.fontSize(7).font('Helvetica').fillColor('#1e293b')
             .text(bagWeightStr,             C4X + 2, rY, { width: C4W - 4, lineBreak: true })
             .text(`${formatW(totalWt)} kg`, C5X + 2, rY, { width: C5W - 4, align: 'center' });
          totalWeight += totalWt;
        } else {
          doc.fontSize(7).font('Helvetica').fillColor('#1e293b')
             .text(`${formatW(item.weight || 0)} kg`, C4X + 2, rY, { width: C4W + C5W - 4 });
          totalWeight += item.weight || 0;
        }

        // Notes: placed below product name lines in col2
        if (item.notes && item.notes.trim()) {
          const productLabel2 = item.subProductName
            ? `${item.productName || ''} × ${item.subProductName}` : (item.productName || '');
          const productLineCount = Math.max(1, Math.ceil(productLabel2.length / C2_CPL));
          const noteY = rY + productLineCount * ROW_LINE_H;
          doc.fontSize(6).font('Helvetica-Oblique').fillColor('#1d4ed8')
             .text(item.notes, C2X + 2, noteY, { width: C2W - 4, lineBreak: true });
        }

        totalQty += item.dispatchQuantity || 0;
        y += rh;
      });

      // ─── Totals row ───────────────────────────────────────────────────────
      // Only break if the totals row itself won't fit
      if (y + TR_H > pageBottom) {
        y = addContinuationPage();
      }
      doc.rect(M, y, CW, TR_H).fillColor('#e8f0fe').fill();
      doc.rect(M, y, CW, TR_H).strokeColor('#64748b').lineWidth(1.0).stroke();
      drawColDividers(y, TR_H, '#64748b', !hasAnySubProduct);
      const tY = y + 4;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a')
         .text('TOTAL',          C2X + 2, tY, { width: C2W - 4 })
         .text(String(totalQty), C3X + 1, tY, { width: C3W - 2, align: 'center' });
      if (hasAnySubProduct) {
        doc.text(`${formatW(totalWeight)} kg`, C5X + 2, tY, { width: C5W - 4, align: 'center' });
      } else {
        doc.text(`${formatW(totalWeight)} kg`, C4X + 2, tY, { width: C4W + C5W - 4 });
      }
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
      // SECTION 5 — SIGNATURE & FOOTER pinned to page bottom (standard ERP)
      // ════════════════════════════════════════════════

      // Footer text pinned at absolute bottom of last page
      const fBot = pageBottom;
      doc.fontSize(5).font('Helvetica').fillColor('#9ca3af')
         .text(`Generated: ${formatDateTime(new Date())}`, M, fBot - 7, { align: 'center', width: CW });
      doc.fontSize(5.5).font('Helvetica').fillColor('#9ca3af')
         .text(company.footerNote, M, fBot - 15, { align: 'center', width: CW });
      doc.moveTo(M, fBot - 19).lineTo(M + CW, fBot - 19).strokeColor('#e2e8f0').lineWidth(0.4).stroke();

      // Signature block pinned just above footer
      const sigY = fBot - 54;
      doc.moveTo(M + CW - 80, sigY + 16).lineTo(M + CW, sigY + 16).strokeColor('#94a3b8').lineWidth(0.4).stroke();
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#1e293b')
         .text(`${company.signatureLabel} ${company.name}`, M, sigY + 18, { align: 'right', width: CW });
      doc.fontSize(5.5).font('Helvetica').fillColor('#9ca3af')
         .text('Authorised Signatory', M, sigY + 26, { align: 'right', width: CW });

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

      // ─── Consolidate products from all challans (preserving individual weight entries) ───
      const productMap = new Map();
      consolidatedData.challans.forEach(challan => {
        challan.items?.forEach(item => {
          const key = `${item.product?._id || item.productCode}__${item.subProduct || ''}`;
          const itemWeights = Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0
            ? item.subProductWeights
            : (item.weight ? [item.weight] : []);
          if (productMap.has(key)) {
            const ex = productMap.get(key);
            ex.dispatchedQty += item.dispatchQuantity || 0;
            ex.weight        += item.weight           || 0;
            ex.weightEntries.push(...itemWeights);
          } else {
            productMap.set(key, {
              productName:  item.productName || item.product?.productName || 'N/A',
              subProduct:   item.subProductName || '',
              dispatchedQty: item.dispatchQuantity || 0,
              unit:         item.unit   || 'Bags',
              weight:       item.weight || 0,
              weightEntries: [...itemWeights],
              notes:        item.notes  || '',
            });
          }
        });
      });
      const allProducts = Array.from(productMap.values());

      // ─── Format weight: omit trailing .00 for whole numbers ───────────────
      const formatW = (n) => {
        const v = Number(n);
        return v % 1 === 0 ? String(v) : v.toFixed(2);
      };

      // ─── Row height: same logic as challan PDF ───────────────────────────────────
      const C2c_CPL = 16;  // chars per line col2 at font 7
      const C4c_CPL = 23;  // chars per line col4 (c4w=96px, font 7pt ≈ 4.2px/char)
      const ROW_LINE_Hc = 7;
      const ROW_PADc    = 6;

      const rowH = (p) => {
        const hasSub = !!p.subProduct;
        const label = hasSub ? `${p.productName} × ${p.subProduct}` : p.productName;
        const productLines = Math.max(1, Math.ceil(label.length / C2c_CPL));
        const noteLines = p.notes && p.notes.trim()
          ? Math.ceil(p.notes.length / C2c_CPL) : 0;
        const col2Lines = productLines + noteLines;
        const wText = hasSub
          ? (p.weightEntries || []).map(w => formatW(w)).join(', ') + ' kg'
          : `${formatW(p.weight || 0)} kg`;
        const col4Lines = Math.max(1, Math.ceil(wText.length / C4c_CPL));
        return Math.max(18, Math.max(col2Lines, col4Lines) * ROW_LINE_Hc + ROW_PADc);
      };

      // ─── Fixed dims + pre-compute exact content height ─────────────────────────
      const THc  = 16;
      const TRHc = 14;
      const termsHc = company.terms.length > 0
        ? 5 + 7 + company.terms.length * 11 + 4 : 0;
      // Footer block: gap(6) + sig(36) + rule+footer(18) = 60
      const FOOTER_Hc = 60;
      const A6_Hc = 420;

      // ─── Create document ─────────────────────────────────────────────────
      const doc = new PDFDocument({
        size: [PW, A6_Hc],
        margin: M,
        bufferPages: true,
        autoFirstPage: true,
      });
      let pageBottomC = A6_Hc - M;
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

      // Track page bottom for multi-page logic (reference via closure)
      let _pageBotC = pageBottomC;

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
      const BOX_H  = 60;
      const divX   = M + Math.floor(CW / 2);
      const leftX  = M + 5;
      const rightX = divX + 5;

      doc.rect(M, y, CW, BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();
      doc.moveTo(divX, y).lineTo(divX, y + BOX_H).strokeColor('#94a3b8').lineWidth(0.5).stroke();

      const boxY = y + 6;
      const customerInfo  = consolidatedData.customerDetails || {};
      const customerAddr  = consolidatedData.customer?.address || {};

      // Left — stacked rows: SO Ref | Order Date | Warehouse
      // Row 1: SO Ref label + value
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('SO Ref.', leftX, boxY);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0369a1')
         .text(consolidatedData.soNumber || 'N/A', leftX, boxY + 7);

      // Row 2: Order Date label + value (inline)
      doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Order Date', leftX, boxY + 19);
      doc.fontSize(6.5).font('Helvetica').fillColor('#111111')
         .text(formatDate(consolidatedData.salesOrder?.orderDate), leftX + 30, boxY + 19);

      // Row 3: Warehouse label + value (inline)
      if (consolidatedData.warehouseLocation) {
        doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Warehouse', leftX, boxY + 30);
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#166534')
           .text(consolidatedData.warehouseLocation, leftX + 36, boxY + 30, { width: (divX - leftX) - 38 });
      }

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
      const c1x = M,       c1w = 12;
      const c2x = M + 12,  c2w = 82;
      const c3x = M + 94,  c3w = 32;
      const c4x = M + 126, c4w = 96;
      const c5x = M + 222, c5w = 36;

      const hasAnySubProduct = allProducts.some(p => !!p.subProduct);

      // ─── Draw table header, returns new y ─────────────────────────────────
      const drawTblHdrC = (yy) => {
        doc.rect(M, yy, CW, THc).fillColor('#1e3a5f').fill();
        const hY = yy + 5;
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
           .text('#',         c1x+1, hY, { width: c1w-2, align: 'center' })
           .text('Product',   c2x+2, hY, { width: c2w-4 })
           .text('Qty',       c3x+1, hY, { width: c3w-2, align: 'center' });
        if (hasAnySubProduct) {
          doc.text('Weight',    c4x+2, hY, { width: c4w-4, align: 'center' })
             .text('Total Wt.', c5x+2, hY, { width: c5w-4, align: 'center' });
        } else {
          doc.text('Weight',    c4x+2, hY, { width: c4w+c5w-4, align: 'center' });
        }
        const hDivs = hasAnySubProduct ? [c2x,c3x,c4x,c5x] : [c2x,c3x,c4x];
        hDivs.forEach(cx =>
          doc.moveTo(cx,yy).lineTo(cx,yy+THc).strokeColor('#2d4f7c').lineWidth(0.4).stroke()
        );
        return yy + THc;
      };

      const addConsolidatedPage = () => {
        doc.addPage({ size: [PW, A6_Hc], margin: M });
        _pageBotC = A6_Hc - M;
        let yy = M;
        doc.fontSize(6).font('Helvetica').fillColor('#94a3b8')
           .text(`${consolidatedData.soNumber || ''} — continued`, M, yy, { align: 'right', width: CW });
        yy += 10;
        return drawTblHdrC(yy);
      };

      y = drawTblHdrC(y);

      let totalQty = 0, totalWeight = 0;

      allProducts.forEach((product, idx) => {
        const rh   = rowH(product);
        const hasSub = !!product.subProduct;

        // Page break: only if this row itself won't fit
        if (y + rh > _pageBotC) {
          y = addConsolidatedPage();
        }

        const fill = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(M, y, CW, rh).fillColor(fill).fill();

        const ry = y + 4;
        const label = hasSub
          ? `${product.productName} × ${product.subProduct}`
          : product.productName;

        doc.fillColor('#1e293b').fontSize(7).font('Helvetica')
           .text((idx+1).toString(), c1x+1, ry, { width: c1w-2, align: 'center' })
           .text(label,             c2x+2, ry, { width: c2w-4, lineBreak: true })
           .text(`${product.dispatchedQty} ${product.unit}`, c3x+1, ry, { width: c3w-2, align: 'center' });

        if (hasSub) {
          const bagStr  = (product.weightEntries||[]).map(w=>formatW(w)).join(', ')+' kg';
          const totalWt = (product.weightEntries||[]).reduce((s,w)=>s+(Number(w)||0),0);
          doc.fillColor('#1e293b').fontSize(7).font('Helvetica')
             .text(bagStr,                   c4x+2, ry, { width: c4w-4, lineBreak: true })
             .text(`${formatW(totalWt)} kg`, c5x+2, ry, { width: c5w-4, align: 'center' });
          totalWeight += totalWt;
        } else {
          doc.fillColor('#1e293b').fontSize(7).font('Helvetica')
             .text(`${formatW(product.weight||0)} kg`, c4x+2, ry, { width: c4w+c5w-4 });
          totalWeight += product.weight||0;
        }

        // Notes below product name
        if (product.notes && product.notes.trim()) {
          const productLineCount = Math.max(1, Math.ceil(label.length / C2c_CPL));
          const noteY = ry + productLineCount * ROW_LINE_Hc;
          doc.fontSize(6).font('Helvetica-Oblique').fillColor('#1d4ed8')
             .text(product.notes, c2x+2, noteY, { width: c2w-4, lineBreak: true });
        }

        doc.moveTo(M, y+rh).lineTo(M+CW, y+rh).strokeColor('#cbd5e1').lineWidth(0.6).stroke();
        doc.moveTo(M, y).lineTo(M, y+rh).strokeColor('#64748b').lineWidth(1.0).stroke();
        doc.moveTo(M+CW, y).lineTo(M+CW, y+rh).strokeColor('#64748b').lineWidth(1.0).stroke();
        const rowDivCols = hasSub ? [c2x,c3x,c4x,c5x] : [c2x,c3x,c4x];
        rowDivCols.forEach(x =>
          doc.moveTo(x, y).lineTo(x, y+rh).strokeColor('#d1d5db').lineWidth(0.4).stroke()
        );

        totalQty += product.dispatchedQty;
        y += rh;
      });

      // ─── Totals row ─────────────────────────────────────────────────────
      if (y + TRHc > _pageBotC) {
        y = addConsolidatedPage();
      }
      doc.rect(M, y, CW, TRHc).fillColor('#e8f0fe').fill();
      doc.rect(M, y, CW, TRHc).strokeColor('#64748b').lineWidth(1.0).stroke();
      const totDivs = hasAnySubProduct ? [c2x,c3x,c4x,c5x] : [c2x,c3x,c4x];
      totDivs.forEach(x =>
        doc.moveTo(x,y).lineTo(x,y+TRHc).strokeColor('#64748b').lineWidth(0.5).stroke()
      );
      const ty = y + 4;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1e293b')
         .text('TOTAL',             c2x+2, ty, { width: c2w-4 })
         .text(totalQty.toString(), c3x+1, ty, { width: c3w-2, align: 'center' });
      if (hasAnySubProduct) {
        doc.text(`${formatW(totalWeight)} kg`, c5x+2, ty, { width: c5w-4, align: 'center' });
      } else {
        doc.text(`${formatW(totalWeight)} kg`, c4x+2, ty, { width: c4w+c5w-4 });
      }
      y += TRHc + 8;

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
      // SECTION 5 — SIGNATURE & FOOTER pinned to page bottom (standard ERP)
      // ════════════════════════════════════════════

      // Footer text pinned at absolute bottom of last page
      const fBotC = _pageBotC;
      doc.fontSize(5).font('Helvetica').fillColor('#94a3b8')
         .text(`Generated: ${formatDateTime(new Date())}`, M, fBotC - 7, { align: 'center', width: CW });
      doc.fontSize(5.5).font('Helvetica').fillColor('#94a3b8')
         .text(company.footerNote, M, fBotC - 15, { align: 'center', width: CW });
      doc.moveTo(M, fBotC - 19).lineTo(M + CW, fBotC - 19).strokeColor('#e2e8f0').lineWidth(0.4).stroke();

      // Signature block pinned just above footer
      const sigYc = fBotC - 54;
      doc.moveTo(M + CW - 80, sigYc + 16).lineTo(M + CW, sigYc + 16).strokeColor('#94a3b8').lineWidth(0.4).stroke();
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#1e293b')
         .text(`${company.signatureLabel} ${company.name}`, M, sigYc + 18, { align: 'right', width: CW });
      doc.fontSize(5.5).font('Helvetica').fillColor('#9ca3af')
         .text('Authorised Signatory', M, sigYc + 26, { align: 'right', width: CW });

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
