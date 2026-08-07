import { Icon } from '@iconify/react';

export default function ExportDataToolbar({ data = [], filename = 'export_data', title = 'Export Options' }) {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = Object.keys(data[0]).filter(k => !k.startsWith('_')).join(',');
    const rows = data.map(row => {
      return Object.keys(data[0])
        .filter(k => !k.startsWith('_'))
        .map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const EXCLUDE_KEYS = ['_id', '__v', 'createdAt', 'updatedAt', 'isActive', 'isBackendOrder', 'createdBy', 'password'];
    const rawKeys = Object.keys(data[0]);
    let headers = rawKeys.filter(k => !k.startsWith('_') && !EXCLUDE_KEYS.includes(k));
    if (headers.length === 0) headers = rawKeys.filter(k => !k.startsWith('_'));

    const rows = data.map(row => headers.map(key => {
      const val = row[key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    }));

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Unable to open print window. Please allow popups and try again.');
      return;
    }

    const styles = `
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      body {
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #0f172a;
        margin: 12px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .header-area {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        border-b: 2px solid #f97316;
        padding-bottom: 8px;
      }
      h1 {
        font-size: 18px;
        font-weight: 800;
        margin: 0;
        color: #1e293b;
      }
      .meta {
        font-size: 10px;
        color: #64748b;
        font-weight: 600;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        font-size: 10px;
        table-layout: auto;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }
      th {
        background-color: #ea580c !important;
        color: #ffffff !important;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 9px;
        letter-spacing: 0.5px;
      }
      tr:nth-child(even) td {
        background-color: #f8fafc !important;
      }
      @media print {
        body { margin: 0; }
        button { display: none; }
      }
    `;

    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${filename}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="header-area">
            <div>
              <h1>${title}</h1>
              <div class="meta">Exported on: ${formattedDate} | Total Records: ${data.length}</div>
            </div>
            <button onclick="window.print()" style="padding: 6px 14px; background: #ea580c; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Print / Save PDF</button>
          </div>
          <table>
            <thead>
              <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  const exportToDOCX = () => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = Object.keys(data[0]).filter(k => !k.startsWith('_'));
    let docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title></head><body>
    <h2>${title} Report</h2>
    <table border='1' cellspacing='0' cellpadding='5'><thead><tr>`;

    headers.forEach(h => {
      docContent += `<th style='background-color:#f97316;color:white;'>${h}</th>`;
    });
    docContent += `</tr></thead><tbody>`;

    data.forEach(row => {
      docContent += `<tr>`;
      headers.forEach(h => {
        docContent += `<td>${row[h] || ''}</td>`;
      });
      docContent += `</tr>`;
    });

    docContent += `</tbody></table></body></html>`;

    const blob = new Blob(['\ufeff', docContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Export:</span>

      <button
        onClick={exportToCSV}
        title="Export as CSV"
        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
      >
        <Icon icon="mdi:file-delimited-outline" className="text-emerald-600 text-sm" /> CSV
      </button>

      <button
        onClick={exportToPDF}
        title="Export as PDF"
        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
      >
        <Icon icon="mdi:file-pdf-box" className="text-rose-600 text-sm" /> PDF
      </button>

      <button
        onClick={exportToDOCX}
        title="Export as Word DOCX"
        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
      >
        <Icon icon="mdi:file-word-box" className="text-blue-600 text-sm" /> DOCX
      </button>
    </div>
  );
}
