import { useState } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function DocumentsPanel({ user, triggerError }) {
  const [docs, setDocs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'Regulatory & Compliance',
    fileType: 'PDF',
    expiryDate: '',
    status: 'Valid',
  });

  const handleCreateDoc = (e) => {
    e.preventDefault();
    const created = {
      _id: Date.now().toString(),
      docCode: `DOC-00${docs.length + 1}`,
      title: newDoc.title,
      category: newDoc.category,
      fileType: newDoc.fileType,
      uploadedBy: user?.name || 'Super Admin',
      uploadedAt: new Date().toISOString().split('T')[0],
      expiryDate: newDoc.expiryDate || 'N/A',
      status: newDoc.status,
    };
    setDocs([created, ...docs]);
    setShowAddModal(false);
    setNewDoc({ title: '', category: 'Regulatory & Compliance', fileType: 'PDF', expiryDate: '', status: 'Valid' });
    if (triggerError) triggerError('Document uploaded into archive!', 'success');
  };

  const handleUpdateDoc = (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    setDocs(docs.map(d => (d._id === editingDoc._id ? { ...d, ...newDoc } : d)));
    setEditingDoc(null);
    if (triggerError) triggerError('Document details updated!', 'success');
  };

  const handleDeleteDoc = (id) => {
    if (!window.confirm('Delete this archived document?')) return;
    setDocs(docs.filter(d => d._id !== id));
    if (triggerError) triggerError('Document removed!', 'success');
  };

  const openEditModal = (d) => {
    setEditingDoc(d);
    setNewDoc({
      title: d.title || '',
      category: d.category || 'Regulatory & Compliance',
      fileType: d.fileType || 'PDF',
      expiryDate: d.expiryDate || '',
      status: d.status || 'Valid',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:folder-outline" className="text-orange-500 text-lg" /> Enterprise Document Archive & Compliance Vault
          </h2>
          <p className="text-xs text-slate-400">Centralized repository for FSSAI licenses, ISO certificates, COA test reports, and vendor agreements</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={docs} filename="documents_archive_index" title="Document Archive Index" />
          <button
            onClick={() => {
              setNewDoc({ title: '', category: 'Regulatory & Compliance', fileType: 'PDF', expiryDate: '', status: 'Valid' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:upload-outline" className="text-base" /> Upload Document
          </button>
        </div>
      </div>

      {(showAddModal || editingDoc) && (
        <form onSubmit={editingDoc ? handleUpdateDoc : handleCreateDoc} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:folder-outline" className="text-orange-500 text-base" />
              {editingDoc ? `Edit Document (${editingDoc.docCode})` : 'Upload Enterprise Compliance Document'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingDoc(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Document Title *</label>
              <input
                type="text"
                required
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                placeholder="e.g. FSSAI Food Safety License 2026–27"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Category</label>
              <select
                value={newDoc.category}
                onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Regulatory & Compliance">Regulatory & Compliance</option>
                <option value="Quality Certificates">Quality Certificates (COA)</option>
                <option value="Vendor Documents">Vendor Documents</option>
                <option value="Maintenance Records">Maintenance Records</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">File Type</label>
              <select
                value={newDoc.fileType}
                onChange={(e) => setNewDoc({ ...newDoc, fileType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="XLSX">XLSX</option>
                <option value="PNG">PNG / JPG</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Expiry Date</label>
              <input
                type="date"
                value={newDoc.expiryDate}
                onChange={(e) => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Status</label>
              <select
                value={newDoc.status}
                onChange={(e) => setNewDoc({ ...newDoc, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Valid">Valid</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingDoc(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {editingDoc ? 'Update Document' : 'Save Upload'}
            </button>
          </div>
        </form>
      )}

      {docs.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:folder-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Documents Uploaded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no licenses or quality certificates archived in the vault yet. Click below to upload a document.</p>
          <button
            onClick={() => {
              setNewDoc({ title: '', category: 'Regulatory & Compliance', fileType: 'PDF', expiryDate: '', status: 'Valid' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Upload First Document
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Doc Code</th>
                  <th className="p-4">Document Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">File Type</th>
                  <th className="p-4">Uploaded By</th>
                  <th className="p-4">Upload Date</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{d.docCode}</td>
                    <td className="p-4 font-bold text-slate-900">{d.title}</td>
                    <td className="p-4 text-slate-600 font-semibold">{d.category}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {d.fileType}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{d.uploadedBy}</td>
                    <td className="p-4 font-mono text-slate-500">{d.uploadedAt}</td>
                    <td className="p-4 font-mono text-slate-500">{d.expiryDate}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(d)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteDoc(d._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
