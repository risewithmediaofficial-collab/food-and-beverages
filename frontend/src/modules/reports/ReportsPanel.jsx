import { useState } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function ReportsPanel({ user, triggerError }) {
  const [reports, setReports] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    category: 'Finance',
    type: 'PDF / Excel',
  });

  const handleCreateReport = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now().toString(),
      name: newReport.name,
      category: newReport.category,
      type: newReport.type,
      generated: 'Just Now',
    };
    setReports([created, ...reports]);
    setShowAddModal(false);
    setNewReport({ name: '', category: 'Finance', type: 'PDF / Excel' });
    if (triggerError) triggerError('Report entry generated!', 'success');
  };

  const handleDeleteReport = (id) => {
    if (!window.confirm('Delete this report entry?')) return;
    setReports(reports.filter(r => r.id !== id));
    if (triggerError) triggerError('Report removed!', 'success');
  };

  const handleExport = (name, type) => {
    if (triggerError) triggerError(`Exporting ${name} as ${type}...`, 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:file-chart-outline" className="text-orange-500 text-lg" /> Executive Reports & Document Export
          </h2>
          <p className="text-xs text-slate-400">Generate commercial-grade PDF and Excel reports for Sales, Inventory, Production, Machine OEE & Finance</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={reports} filename="executive_reports_export" title="Executive Analytics Reports" />
          <button
            onClick={() => {
              setNewReport({ name: '', category: 'Finance', type: 'PDF / Excel' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Generate New Report
          </button>
        </div>
      </div>

      {showAddModal && (
        <form onSubmit={handleCreateReport} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:file-chart-outline" className="text-orange-500 text-base" /> Generate Executive Analytics Report
            </h3>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Report Title *</label>
              <input
                type="text"
                required
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                placeholder="e.g. Monthly Sales Revenue & GST Tax Summary"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Module Category</label>
              <select
                value={newReport.category}
                onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Finance">Finance & Tax</option>
                <option value="Production">Production & Machine OEE</option>
                <option value="Inventory">Inventory & FEFO</option>
                <option value="Quality">Quality Control (QC)</option>
                <option value="Sales">Sales & CRM</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">Generate Report</button>
          </div>
        </form>
      )}

      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:file-chart-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Reports Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no executive analytics or export reports queued. Click below to generate a report.</p>
          <button
            onClick={() => {
              setNewReport({ name: '', category: 'Finance', type: 'PDF / Excel' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Generate First Report
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Report Name</th>
                  <th className="p-4">Module Category</th>
                  <th className="p-4">Export Formats</th>
                  <th className="p-4">Last Generated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <Icon icon="mdi:file-pdf-box" className="text-rose-500 text-lg" /> {r.name}
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">{r.category}</td>
                    <td className="p-4 font-mono font-bold text-orange-600">{r.type}</td>
                    <td className="p-4 text-slate-400 font-mono">{r.generated}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleExport(r.name, 'PDF')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Icon icon="mdi:download" /> Export PDF
                        </button>
                        <button
                          onClick={() => handleExport(r.name, 'Excel')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Icon icon="mdi:file-excel" /> Export Excel
                        </button>
                        <button onClick={() => handleDeleteReport(r.id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
                          <Icon icon="mdi:trash-can-outline" className="text-base text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
