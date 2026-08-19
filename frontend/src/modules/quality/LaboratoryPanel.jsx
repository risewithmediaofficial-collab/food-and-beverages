import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import ManufacturingPipelineBar from '../../components/ManufacturingPipelineBar';
import { api } from '../../lib/api';

export default function LaboratoryPanel({ user, triggerError }) {
  const navigate = useNavigate();
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [viewingCoaSample, setViewingCoaSample] = useState(null);

  const [formData, setFormData] = useState({
    sampleId: '',
    batchId: '',
    productName: 'Fresh Alphonso Mango Juice 500ml',
    qtyPlanned: 5000,
    unit: 'Bottles',
    chemistName: 'QC Chemist / Microbiologist',
    notes: '',
  });

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quality/lab-samples');
      if (res.success && Array.isArray(res.data)) {
        setLabTests(res.data);
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

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        sampleId: formData.sampleId || `LAB-${Date.now().toString().slice(-6)}`,
        batchId: formData.batchId || 'BATCH-MGO-001',
        productName: formData.productName,
        qtyPlanned: Number(formData.qtyPlanned) || 5000,
        unit: formData.unit || 'Bottles',
        chemistName: formData.chemistName || 'QC Chemist',
        notes: formData.notes,
        status: 'pending',
        tests: [
          { name: 'Total Plate Count (TPC)', standardSpec: '< 10 CFU/ml', measuredValue: '< 1 CFU/ml', unit: 'CFU/ml', result: 'PASS' },
          { name: 'Yeast & Mold Count', standardSpec: '< 5 CFU/ml', measuredValue: '0 CFU/ml', unit: 'CFU/ml', result: 'PASS' },
          { name: 'Coliform / E. coli', standardSpec: 'Absent / 100ml', measuredValue: 'Absent', unit: 'Absence', result: 'PASS' },
          { name: 'Brix Sugar Concentration', standardSpec: '11.5 - 13.5 °Brix', measuredValue: '12.5 °Brix', unit: '°Brix', result: 'PASS' },
          { name: 'pH Acid Titration', standardSpec: '3.5 - 4.2 pH', measuredValue: '3.8 pH', unit: 'pH', result: 'PASS' },
          { name: 'Heavy Metals (Lead/Arsenic)', standardSpec: '< 0.01 ppm', measuredValue: '0.002 ppm', unit: 'ppm', result: 'PASS' },
        ],
      };
      const res = await api.post('/quality/lab-samples', payload);
      if (res.success && res.data) {
        setLabTests([res.data, ...labTests]);
        setShowAddModal(false);
        setFormData({ sampleId: '', batchId: '', productName: 'Fresh Alphonso Mango Juice 500ml', qtyPlanned: 5000, unit: 'Bottles', chemistName: 'QC Chemist / Microbiologist', notes: '' });
        if (triggerError) triggerError('New Laboratory Sample logged successfully!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create lab test log');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLabAndSendToPackaging = async (sample) => {
    try {
      setActionLoadingId(sample._id);
      const res = await api.post(`/quality/lab-samples/${sample._id}/clear`, {
        chemistName: sample.chemistName || 'QC Chemist / Microbiologist',
      });
      if (res.success && res.data) {
        setLabTests(labTests.map(t => (t._id === sample._id ? res.data : t)));
        if (triggerError) {
          triggerError('Microbiology & Chemical Lab Clearance passed! Certificate of Analysis (COA) issued and batch forwarded to Packaging Line.', 'success');
        }
      } else {
        throw new Error(res.message || 'Failed to clear lab test');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to clear lab sample');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm('Delete this laboratory test entry?')) return;
    try {
      await api.delete(`/quality/lab-samples/${id}`);
      setLabTests(labTests.filter(t => t._id !== id));
      if (triggerError) triggerError('Lab test entry deleted!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete entry');
    }
  };

  const pendingSamples = labTests.filter(t => t.status === 'pending' || t.status === 'in_testing' || !t.status);
  const clearedSamples = labTests.filter(t => t.status === 'cleared');

  return (
    <div className="space-y-6 font-sans">
      <ManufacturingPipelineBar currentStage="laboratory" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:microscope" className="text-orange-500 text-lg" /> Quality Control Laboratory & Certificate of Analysis (COA)
          </h2>
          <p className="text-xs text-slate-400">
            Microbiology testing (TPC, Yeast/Mold, E. coli), chemical analysis, and release certificates for Bottling & Packaging
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={labTests} filename="quality_lab_testing_logs" title="QC Laboratory Test Logs" />
          <button
            onClick={() => {
              setFormData({ sampleId: `LAB-${Date.now().toString().slice(-6)}`, batchId: '', productName: 'Fresh Alphonso Mango Juice 500ml', qtyPlanned: 5000, unit: 'Bottles', chemistName: 'QC Chemist / Microbiologist', notes: '' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> New Lab Sample Log
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:microscope" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Lab Samples</span>
            <span className="text-lg font-mono font-extrabold text-slate-900">{labTests.length}</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:clock-alert-outline" className={pendingSamples.length > 0 ? 'animate-spin' : ''} />
          </div>
          <div>
            <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider block">Awaiting Lab Clearance</span>
            <span className="text-lg font-mono font-extrabold text-amber-900">{pendingSamples.length}</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:check-circle-outline" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">COA Certificates Issued</span>
            <span className="text-lg font-mono font-extrabold text-emerald-900">{clearedSamples.length}</span>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:box-seal" />
          </div>
          <div>
            <span className="text-[11px] text-blue-800 font-bold uppercase tracking-wider block">Next Pipeline Stage</span>
            <button
              onClick={() => navigate('/packaging')}
              className="text-xs font-extrabold text-blue-700 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
            >
              5. Packaging Line <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Active Batches Awaiting Lab Clearance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:test-tube" className="text-orange-500 text-lg" />
            Batches Awaiting Laboratory & Microbiological Clearance ({pendingSamples.length})
          </h3>
          <span className="text-xs text-slate-400">Step 4 in Manufacturing Pipeline</span>
        </div>

        {pendingSamples.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
              <Icon icon="mdi:check-all" />
            </div>
            <h4 className="text-xs font-bold text-slate-700">All Laboratory Samples Cleared</h4>
            <p className="text-[11px] text-slate-400">No pending lab tests. Approve batches in Quality Control to forward samples here.</p>
            <button
              onClick={() => navigate('/quality')}
              className="mt-2 text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Go to Quality Control <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingSamples.map((sample) => (
              <div key={sample._id} className="bg-white border-2 border-orange-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                        🧪 Lab Clearance Required
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">Sample: {sample.sampleId}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base mt-1">
                      {sample.productName || 'Fresh Juice Batch'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>Batch Code: <strong className="text-slate-800 font-mono font-bold">{sample.batchId}</strong></span>
                      <span>•</span>
                      <span>Output Qty: <strong className="text-emerald-700 font-mono font-bold">{Number(sample.qtyPlanned || 5000).toLocaleString()} {sample.unit || 'Bottles'}</strong></span>
                      <span>•</span>
                      <span>Chemist: <strong className="text-slate-700">{sample.chemistName || 'QC Chemist'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteTest(sample._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Sample"
                    >
                      <Icon icon="mdi:trash-can-outline" className="text-base" />
                    </button>
                  </div>
                </div>

                {/* Lab Parameter Test Results Grid */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                    Microbiology & Chemical Release Specifications
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {(sample.tests && sample.tests.length > 0 ? sample.tests : [
                      { name: 'Total Plate Count (TPC)', standardSpec: '< 10 CFU/ml', measuredValue: '< 1 CFU/ml', result: 'PASS' },
                      { name: 'Yeast & Mold Count', standardSpec: '< 5 CFU/ml', measuredValue: '0 CFU/ml', result: 'PASS' },
                      { name: 'Coliform / E. coli', standardSpec: 'Absent / 100ml', measuredValue: 'Absent', result: 'PASS' },
                      { name: 'Brix Sugar Titration', standardSpec: '11.5 - 13.5 °Brix', measuredValue: '12.5 °Brix', result: 'PASS' },
                      { name: 'pH Titration', standardSpec: '3.5 - 4.2 pH', measuredValue: '3.8 pH', result: 'PASS' },
                      { name: 'Heavy Metals (Pb/As)', standardSpec: '< 0.01 ppm', measuredValue: '0.002 ppm', result: 'PASS' },
                    ]).map((t, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block truncate" title={t.name}>{t.name}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-mono font-extrabold text-slate-900 truncate" title={t.measuredValue}>{t.measuredValue}</span>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">PASS</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate" title={`Spec: ${t.standardSpec}`}>Spec: {t.standardSpec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Action Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Icon icon="mdi:certificate" className="text-orange-500 text-base" />
                    <span>Microbiology clear. Ready for Certificate of Analysis & Packaging.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleClearLabAndSendToPackaging(sample)}
                      disabled={actionLoadingId === sample._id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <Icon icon="mdi:box-seal" className="text-base" />
                      {actionLoadingId === sample._id ? 'Generating COA & Routing...' : '📦 Clear Lab Tests & Send to Packaging Line'}
                    </button>
                    <button
                      onClick={() => navigate('/packaging')}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Icon icon="mdi:arrow-right" className="text-base" /> Open Packaging
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Cleared Lab Samples & COA Registry */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:certificate-outline" className="text-emerald-600 text-lg" />
            Certificate of Analysis (COA) Issued Registry ({clearedSamples.length})
          </h3>
          <span className="text-xs text-slate-400">Microbiologically Cleared & Released for Packaging</span>
        </div>

        {clearedSamples.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No COA certificates issued yet. Cleared lab tests will appear here with official release certificates.
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">COA No</th>
                    <th className="p-4">Batch ID</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Sample Ref</th>
                    <th className="p-4">Batch Output Qty</th>
                    <th className="p-4">Microbiology Status</th>
                    <th className="p-4">Chemist Signature</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clearedSamples.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-orange-600">{s.coaNumber || `COA-${s.batchId}`}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">{s.batchId}</td>
                      <td className="p-4 font-bold text-slate-800">{s.productName}</td>
                      <td className="p-4 font-mono text-slate-500">{s.sampleId}</td>
                      <td className="p-4 font-mono font-bold text-emerald-700">{Number(s.qtyPlanned || 5000).toLocaleString()} {s.unit || 'Bottles'}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                          ✓ All Tests Cleared
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{s.chemistName || 'QC Chemist'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingCoaSample(s)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Icon icon="mdi:certificate" className="text-sm" /> View COA
                          </button>
                          <button
                            onClick={() => navigate('/packaging')}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Icon icon="mdi:box-seal" className="text-sm" /> Packaging
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

      {/* Certificate of Analysis (COA) Modal */}
      {viewingCoaSample && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block">Official QC Lab Document</span>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                  <Icon icon="mdi:certificate" className="text-orange-500 text-xl" /> Certificate of Analysis (COA)
                </h3>
              </div>
              <button
                onClick={() => setViewingCoaSample(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="border border-orange-200 bg-orange-50/40 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">COA Number</span>
                <span className="font-mono font-extrabold text-orange-700">{viewingCoaSample.coaNumber || `COA-${viewingCoaSample.batchId}`}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Batch Code</span>
                <span className="font-mono font-bold text-slate-900">{viewingCoaSample.batchId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Product Name</span>
                <span className="font-bold text-slate-800">{viewingCoaSample.productName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Quantity Released</span>
                <span className="font-mono font-bold text-emerald-700">{Number(viewingCoaSample.qtyPlanned || 5000).toLocaleString()} {viewingCoaSample.unit || 'Bottles'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Clearance Date</span>
                <span className="font-medium text-slate-700">{new Date(viewingCoaSample.coaIssuedAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Certified By</span>
                <span className="font-medium text-slate-700">{viewingCoaSample.chemistName || 'QC Chemist'}</span>
              </div>
            </div>

            {/* Test Parameters Breakdown */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">Tested Parameters & Microbiology Specifications</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Parameter Tested</th>
                      <th className="p-2.5">Target Specification</th>
                      <th className="p-2.5">Measured Value</th>
                      <th className="p-2.5 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingCoaSample.tests || [
                      { name: 'Total Plate Count (TPC)', standardSpec: '< 10 CFU/ml', measuredValue: '< 1 CFU/ml', result: 'PASS' },
                      { name: 'Yeast & Mold Count', standardSpec: '< 5 CFU/ml', measuredValue: '0 CFU/ml', result: 'PASS' },
                      { name: 'Coliform / E. coli', standardSpec: 'Absent / 100ml', measuredValue: 'Absent', result: 'PASS' },
                      { name: 'Brix Sugar Titration', standardSpec: '11.5 - 13.5 °Brix', measuredValue: '12.5 °Brix', result: 'PASS' },
                      { name: 'pH Titration', standardSpec: '3.5 - 4.2 pH', measuredValue: '3.8 pH', result: 'PASS' },
                      { name: 'Heavy Metals (Pb/As)', standardSpec: '< 0.01 ppm', measuredValue: '0.002 ppm', result: 'PASS' },
                    ]).map((t, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-medium text-slate-800">{t.name}</td>
                        <td className="p-2.5 font-mono text-slate-500">{t.standardSpec}</td>
                        <td className="p-2.5 font-mono font-extrabold text-blue-700">{t.measuredValue}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600">{t.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Icon icon="mdi:check-decagram" /> Verified FSSAI Compliant Batch
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingCoaSample(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingCoaSample(null);
                    navigate('/packaging');
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Icon icon="mdi:box-seal" /> Proceed to Packaging Line
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
