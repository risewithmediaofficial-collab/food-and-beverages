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
    window.print();
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
