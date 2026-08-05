import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function LaboratoryPanel({ user, triggerError }) {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
    sampleId: '',
    batchNo: 'BATCH-MGO-2026',
    parameterName: 'Brix Level (°Brix)',
    targetRange: '12.5 - 14.5 °Brix',
    measuredValue: '13.5 °Brix',
    testResult: 'PASS',
    chemistName: 'Meera Nair',
  });

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quality/checks');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Map QC checks into lab tests format if available
        const mapped = res.data.map((c, idx) => ({
          _id: c._id,
          sampleId: `LAB-2026-90${idx + 1}`,
          batchNo: c.batchId || 'BATCH-MGO-2026',
          parameterName: 'Brix Sugar Titration',
          targetRange: '11.5 - 13.5 °Brix',
          measuredValue: '12.5 °Brix',
          testResult: c.overallResult === 'approved' ? 'PASS' : (c.overallResult === 'rejected' ? 'FAIL' : 'PASS'),
          chemistName: 'QC Chemist',
        }));
        setLabTests(mapped);
      } else {
        setLabTests([]);
      }
    } catch (err) {
      console.warn('Failed to load lab tests:', err);
      setLabTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = (e) => {
    e.preventDefault();
    const created = {
      _id: Date.now().toString(),
      sampleId: formData.sampleId || `LAB-2026-90${labTests.length + 1}`,
      ...formData,
    };
    setLabTests([created, ...labTests]);
    setShowAddModal(false);
    setFormData({ sampleId: '', batchNo: 'BATCH-MGO-2026', parameterName: 'Brix Level (°Brix)', targetRange: '12.5 - 14.5 °Brix', measuredValue: '13.5 °Brix', testResult: 'PASS', chemistName: 'Meera Nair' });
    if (triggerError) triggerError('Lab test report logged successfully!', 'success');
  };

  const handleUpdateTest = (e) => {
    e.preventDefault();
    if (!editingTest) return;
    setLabTests(labTests.map(t => (t._id === editingTest._id ? { ...t, ...formData } : t)));
    setEditingTest(null);
    if (triggerError) triggerError('Lab test log updated!', 'success');
  };

  const handleDeleteTest = (id) => {
    if (!window.confirm('Delete this laboratory test entry?')) return;
    setLabTests(labTests.filter(t => t._id !== id));
    if (triggerError) triggerError('Lab test entry deleted!', 'success');
  };

  const openEditModal = (t) => {
    setEditingTest(t);
    setFormData({
      sampleId: t.sampleId || '',
      batchNo: t.batchNo || '',
      parameterName: t.parameterName || '',
      targetRange: t.targetRange || '',
      measuredValue: t.measuredValue || '',
      testResult: t.testResult || 'PASS',
      chemistName: t.chemistName || 'QC Chemist',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:microscope" className="text-orange-500 text-lg" /> Quality Control Laboratory & Certificate of Analysis (COA)
          </h2>
          <p className="text-xs text-slate-400">Chemical titration tests, Brix refractometer readings, microbiology analysis, and COA certificate logs</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={labTests} filename="quality_lab_testing_logs" title="QC Laboratory Test Logs" />
          <button
            onClick={() => {
              setFormData({ sampleId: `LAB-2026-90${labTests.length + 1}`, batchNo: 'BATCH-MGO-2026', parameterName: 'Brix Level (°Brix)', targetRange: '12.5 - 14.5 °Brix', measuredValue: '13.5 °Brix', testResult: 'PASS', chemistName: 'Meera Nair' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> New Lab Test Log
          </button>
        </div>
      </div>

      {(showAddModal || editingTest) && (
        <form onSubmit={editingTest ? handleUpdateTest : handleCreateTest} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:microscope" className="text-orange-500 text-base" />
              {editingTest ? `Edit Lab Test (${editingTest.sampleId})` : 'Register New Laboratory Test Log'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingTest(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Sample Reference *</label>
              <input
                type="text"
                required
                value={formData.sampleId}
                onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
                placeholder="e.g. LAB-2026-901"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Batch Code *</label>
              <input
                type="text"
                required
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                placeholder="e.g. BATCH-MGO-2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Test Parameter Name *</label>
              <input
                type="text"
                required
                value={formData.parameterName}
                onChange={(e) => setFormData({ ...formData, parameterName: e.target.value })}
                placeholder="e.g. Brix Level (°Brix)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Target Standard Range *</label>
              <input
                type="text"
                required
                value={formData.targetRange}
                onChange={(e) => setFormData({ ...formData, targetRange: e.target.value })}
                placeholder="e.g. 12.5 - 14.5 °Brix"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Measured Value *</label>
              <input
                type="text"
                required
                value={formData.measuredValue}
                onChange={(e) => setFormData({ ...formData, measuredValue: e.target.value })}
                placeholder="e.g. 13.5 °Brix"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Testing Chemist Name</label>
              <input
                type="text"
                value={formData.chemistName}
                onChange={(e) => setFormData({ ...formData, chemistName: e.target.value })}
                placeholder="e.g. Meera Nair"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">QC Result</label>
              <select
                value={formData.testResult}
                onChange={(e) => setFormData({ ...formData, testResult: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="REWORK">REWORK</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingTest(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {editingTest ? 'Update Test Log' : 'Save Test Log'}
            </button>
          </div>
        </form>
      )}

      {labTests.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:microscope" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Laboratory Tests Recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">No chemical titration or microbiological test results exist. Click below to add a laboratory test log.</p>
          <button
            onClick={() => {
              setFormData({ sampleId: 'LAB-2026-901', batchNo: 'BATCH-MGO-2026', parameterName: 'Brix Level (°Brix)', targetRange: '12.5 - 14.5 °Brix', measuredValue: '13.5 °Brix', testResult: 'PASS', chemistName: 'Meera Nair' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Log First Lab Test
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Sample Ref</th>
                  <th className="p-4">Batch Code</th>
                  <th className="p-4">Test Parameter Name</th>
                  <th className="p-4">Target Standard Range</th>
                  <th className="p-4">Measured Value</th>
                  <th className="p-4">QC Result</th>
                  <th className="p-4 font-mono">Chemist Name</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labTests.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{t.sampleId}</td>
                    <td className="p-4 font-mono text-slate-700 font-bold">{t.batchNo}</td>
                    <td className="p-4 font-bold text-slate-900">{t.parameterName}</td>
                    <td className="p-4 font-mono text-slate-500">{t.targetRange}</td>
                    <td className="p-4 font-mono font-extrabold text-blue-700">{t.measuredValue}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        t.testResult === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {t.testResult}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{t.chemistName}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(t)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteTest(t._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
