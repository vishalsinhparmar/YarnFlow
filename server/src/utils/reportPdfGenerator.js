import PDFDocument from 'pdfkit';
import { previewReport } from '../reports/report.service.js';
import { getReportDefinition } from '../reports/report.registry.js';

/**
 * Generate a PDF report from report data
 * Production-ready PDF generation for any report type
 * @param {string} reportKey - Report identifier
 * @param {Object} params - Report parameters (filters, sorts, fields, etc.)
 * @returns {Promise<{buffer: Buffer, filename: string}>}
 */
export const generateReportPDF = async (reportKey, params) => {
  try {
    // Get report definition for title
    const definition = getReportDefinition(reportKey);
    const reportTitle = definition?.name || reportKey;

    // Get report data using the same preview logic
    const reportData = await previewReport(reportKey, params, {});
    
    if (!reportData || !reportData.data) {
      throw new Error('No data available for PDF generation');
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 30,
          bufferPages: true
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const filename = `${reportKey}_${new Date().toISOString().split('T')[0]}.pdf`;
          resolve({ buffer, filename });
        });
        doc.on('error', reject);

        // ─── Header ───────────────────────────────────────────
        doc.fontSize(18).font('Helvetica-Bold').text(reportTitle, { align: 'center' });
        doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
        doc.moveDown(0.8);

        // ─── Table/Data ───────────────────────────────────────
        const rows = reportData.data || [];
        const selectedFields = params.selectedFields || [];

        if (selectedFields.length > 0 && rows.length > 0) {
          // Use selected fields to determine columns
          const columns = selectedFields.map(fieldKey => {
            const field = definition?.fields?.find(f => f.key === fieldKey);
            return {
              key: fieldKey,
              label: field?.label || fieldKey
            };
          });

          // Calculate optimal column widths
          const pageWidth = doc.page.width - 60; // 30px margins on each side
          const minColWidth = 50;
          const maxColWidth = 120;
          
          // Distribute width proportionally
          let totalWidth = 0;
          const colWidths = columns.map(col => {
            const labelLength = col.label.length;
            let width = Math.max(minColWidth, Math.min(maxColWidth, labelLength * 7));
            totalWidth += width;
            return width;
          });

          // Scale to fit page
          const scale = pageWidth / totalWidth;
          const finalColWidths = colWidths.map(w => w * scale);

          // ─── Table Header ───────────────────────────────────
          const headerY = doc.y;
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#1F2937');
          
          let x = 30;
          finalColWidths.forEach((colWidth, idx) => {
            const col = columns[idx];
            doc.text(col.label, x, headerY, {
              width: colWidth,
              height: 20,
              align: 'left',
              valign: 'top',
              ellipsis: true
            });
            x += colWidth;
          });

          doc.moveDown(1.2);

          // ─── Horizontal line ────────────────────────────────────
          doc.strokeColor('#D1D5DB').lineWidth(1);
          doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
          doc.moveDown(0.3);

          // ─── Table Rows ─────────────────────────────────────
          doc.fontSize(7.5).font('Helvetica').fillColor('#111827');
          let rowCount = 0;
          
          rows.forEach((row, idx) => {
            // Check if we need a new page (leave 50px for footer)
            if (doc.y > doc.page.height - 60) {
              doc.addPage();
              doc.moveDown(0.5);
            }

            const rowY = doc.y;
            let maxHeight = 15;

            // Calculate row height
            finalColWidths.forEach((colWidth, colIdx) => {
              const col = columns[colIdx];
              const value = row[col.key] !== undefined ? String(row[col.key]) : '—';
              const height = doc.heightOfString(value, {
                width: colWidth - 4,
                align: 'left'
              });
              maxHeight = Math.max(maxHeight, height + 4);
            });

            // Draw row background (alternating)
            if (idx % 2 === 0) {
              doc.fillColor('#F9FAFB');
              doc.rect(30, rowY, doc.page.width - 60, maxHeight).fill();
            }

            // Draw row content
            doc.fillColor('#111827');
            x = 30;
            finalColWidths.forEach((colWidth, colIdx) => {
              const col = columns[colIdx];
              const value = row[col.key] !== undefined ? String(row[col.key]) : '—';
              doc.text(value, x + 2, rowY + 2, {
                width: colWidth - 4,
                height: maxHeight - 4,
                align: 'left',
                valign: 'top',
                ellipsis: true
              });
              x += colWidth;
            });

            // Draw row border
            doc.strokeColor('#E5E7EB').lineWidth(0.5);
            doc.moveTo(30, rowY + maxHeight).lineTo(doc.page.width - 30, rowY + maxHeight).stroke();

            doc.y = rowY + maxHeight;
            rowCount++;
          });

          // ─── Summary ────────────────────────────────────────
          doc.moveDown(0.5);
          doc.fontSize(8).font('Helvetica').fillColor('#6B7280');
          doc.text(`Total Records: ${rows.length}`, { align: 'right' });
        } else if (rows.length === 0) {
          doc.fontSize(11).text('No data available for the selected criteria.', { align: 'center' });
        }

        // ─── Page numbers ───────────────────────────────────────
        const pages = doc.bufferedPageRange().count;
        for (let i = 0; i < pages; i++) {
          doc.switchToPage(i);
          doc.fontSize(7).fillColor('#9CA3AF').text(
            `Page ${i + 1} of ${pages}`,
            30,
            doc.page.height - 20,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    throw new Error(`PDF generation failed: ${err.message}`);
  }
};
