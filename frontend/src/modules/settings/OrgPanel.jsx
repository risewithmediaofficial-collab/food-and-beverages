import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function OrgPanel({ user, triggerError }) {
  const [profile, setProfile] = useState({
    enterpriseName: 'Sunrise Beverages & Juices Private Limited',
    hqAddress: 'Plot 42, MIDC Industrial Area, Ambad, Nashik, Maharashtra - 422010',
    gstin: '27AABCS1234F1Z9',
    pan: 'AABCS1234F',
    fssaiLicense: '11521034000189',
    connectedPlants: '2 Facilities (Nashik Facility #1, Pune Facility #2)',
    currency: 'Indian Rupee (INR - ₹)',
  });
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/org/profile');
      if (res.success && res.data) {
        setProfile(res.data);
        setEditForm(res.data);
      }
    } catch (err) {
      console.warn('Failed to load org profile from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/org/profile', editForm);
      if (res.success && res.data) {
        setProfile(res.data);
        setShowEditModal(false);
        if (triggerError) triggerError('Enterprise profile updated successfully!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update enterprise profile');
    } finally {
      setLoading(false);
    }
  };

  const orgDetails = [
    { field: 'Enterprise Name', value: profile.enterpriseName },
    { field: 'Corporate HQ Address', value: profile.hqAddress },
    { field: 'GSTIN Registration', value: profile.gstin },
    { field: 'PAN Number', value: profile.pan },
    { field: 'FSSAI License No.', value: profile.fssaiLicense },
    { field: 'Connected Manufacturing Plants', value: profile.connectedPlants },
    { field: 'Operating Currency', value: profile.currency },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:domain" className="text-orange-500 text-lg" /> Corporate Organization & Legal Entity Setup
          </h2>
          <p className="text-xs text-slate-400">Enterprise entity registration, FSSAI food safety licenses, GSTIN tax registration & multi-plant hierarchy</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={orgDetails} filename="organization_legal_setup" title="Corporate Organization Setup" />
          <button
            onClick={() => { setEditForm({ ...profile }); setShowEditModal(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:square-edit-outline" className="text-base" /> Edit Enterprise Profile
          </button>
        </div>
      </div>

      {showEditModal && (
        <form onSubmit={handleSave} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Icon icon="mdi:domain" className="text-orange-500 text-base" /> Update Corporate Organization & Legal Info
              </h3>
              <p className="text-xs text-slate-500">Edit legal entity parameters, tax registration, and license credentials</p>
            </div>
            <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Enterprise Legal Name *</label>
              <input
                type="text"
                required
                value={editForm.enterpriseName || ''}
                onChange={(e) => setEditForm({ ...editForm, enterpriseName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Corporate HQ Address *</label>
              <textarea
                rows={2}
                required
                value={editForm.hqAddress || ''}
                onChange={(e) => setEditForm({ ...editForm, hqAddress: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">GSTIN Tax Registration *</label>
              <input
                type="text"
                required
                value={editForm.gstin || ''}
                onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">PAN Number *</label>
              <input
                type="text"
                required
                value={editForm.pan || ''}
                onChange={(e) => setEditForm({ ...editForm, pan: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">FSSAI License No. *</label>
              <input
                type="text"
                required
                value={editForm.fssaiLicense || ''}
                onChange={(e) => setEditForm({ ...editForm, fssaiLicense: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Operating Currency *</label>
              <input
                type="text"
                required
                value={editForm.currency || ''}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Connected Manufacturing Facilities</label>
              <input
                type="text"
                value={editForm.connectedPlants || ''}
                onChange={(e) => setEditForm({ ...editForm, connectedPlants: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Legal Enterprise Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgDetails.map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/50 transition">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{item.field}</span>
              <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">{item.value || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
