import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { api } from '../../lib/api';
import PlanRequestModal from '../auth/PlanRequestModal';

export default function SuperAdminLogin({ onSuperAdminLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('superadmin@juice-erp.com');
  const [password, setPassword] = useState('SuperAdmin@2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPlanRequestModal, setShowPlanRequestModal] = useState(false);
  const [defaultPlanId, setDefaultPlanId] = useState('Free Demo (14 Days)');
  const [noticeMessage, setNoticeMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/superadmin/login', { email, password });
      if (res?.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        if (onSuperAdminLoginSuccess) {
          onSuperAdminLoginSuccess(res.user);
        }
        navigate('/superadmin');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Invalid Super Admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans relative">
      {/* Light Ambient Warm Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-orange-500/20 text-white text-2xl font-bold">
            <Icon icon="mdi:shield-account" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Super Admin Portal</h1>
          <p className="text-xs text-slate-500">Master Platform Control & Multi-Tenant Management</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-center gap-2.5">
            <Icon icon="mdi:alert-circle" className="text-lg text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Super Admin Email</label>
            <div className="relative">
              <Icon icon="mdi:email-outline" className="absolute left-3.5 top-3 text-slate-400 text-base" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Password</label>
            <div className="relative">
              <Icon icon="mdi:lock-outline" className="absolute left-3.5 top-3 text-slate-400 text-base" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-2xl text-xs shadow-md shadow-orange-500/25 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access Super Admin Dashboard'}
            <Icon icon="mdi:shield-check" className="text-base" />
          </button>
        </form>

        <div className="pt-4 text-center space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDefaultPlanId('Growth Plan (₹4,999/mo)');
                setShowPlanRequestModal(true);
              }}
              className="w-full h-11 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:domain" className="text-base text-slate-900" />
              Register Company
            </button>
            <button
              type="button"
              onClick={() => {
                setDefaultPlanId('Free Demo (14 Days)');
                setShowPlanRequestModal(true);
              }}
              className="w-full h-11 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:gift-outline" className="text-base text-orange-700" />
              Request Free Demo
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">Submit a company onboarding request and Super Admin will review it for approval.</p>
        </div>
        {noticeMessage && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-xs">
            {noticeMessage}
          </div>
        )}
      </div>

      {showPlanRequestModal && (
        <PlanRequestModal
          initialPlanId={defaultPlanId}
          onClose={() => setShowPlanRequestModal(false)}
          onSuccess={(msg) => {
            setNoticeMessage(msg || 'Your request has been submitted to Super Admin for review.');
            setShowPlanRequestModal(false);
          }}
        />
      )}
    </div>
  );
}
