import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';
import splash from '../../assets/splash.svg';
import PlanRequestModal from './PlanRequestModal';

const initialSignup = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function LoginPanel({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showPlanRequestModal, setShowPlanRequestModal] = useState(false);
  const [signup, setSignup] = useState(initialSignup);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupMessage, setSignupMessage] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      if (res.success && res.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
        return;
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupMessage('');

    if (signup.password !== signup.confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: signup.name.trim(),
        email: signup.email.trim(),
        password: signup.password,
      });

      if (!res.success) {
        throw new Error(res.message || 'Account creation failed.');
      }

      setEmail(signup.email.trim());
      setPassword('');
      setSignup(initialSignup);
      setSignupMessage('Account created. You can sign in now.');
      setShowCreateAccount(false);
    } catch (err) {
      setSignupError(err.message || 'Account creation failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setResetLoading(true);

    try {
      const res = await api.post('/auth/password/request-reset', { email: resetEmail.trim() });
      if (!res.success) throw new Error(res.message || 'Unable to process reset request.');
      setResetMessage(res.message || 'Reset requested. Please contact your administrator.');
      setResetEmail('');
    } catch (err) {
      setResetError(err.message || 'Unable to process reset request.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-outer font-sans text-slate-900">
      <div className="auth-split">
        <div className="auth-illustration">
          <img src={splash} alt="" className="splash-img" />
        </div>

        <div className="auth-card-wrapper">
          <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden auth-card space-y-4">
            <div className="auth-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="brand-badge bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Icon icon="mdi:fruit-citrus" className="text-2xl" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-extrabold text-slate-950 leading-tight">Food & Beverages ERP</h1>
                  <span className="text-sm text-slate-500 font-semibold block mt-0.5">SaaS Organization Portal</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Organization User Email</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="admin@juice-erp.com"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-950 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-950 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center px-1 text-slate-500 hover:text-slate-900"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon icon={showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className="text-lg" />
                  </button>
                </div>
              </div>

              {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2">{error}</div>}
              {signupMessage && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2">{signupMessage}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 disabled:opacity-70 text-white text-sm font-bold rounded-xl btn-primary transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20"
              >
                {loading ? <Icon icon="mdi:loading" className="animate-spin text-base" /> : <><span>Sign In to Organization</span><Icon icon="mdi:arrow-right" className="text-base" /></>}
              </button>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResetError('');
                    setResetMessage('');
                    setShowResetPassword(true);
                  }}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                >
                  Forgot password?
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAccount(true)}
                  className="h-10 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Icon icon="mdi:account-plus-outline" className="text-base text-slate-800" />
                  <span>Register New User</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPlanRequestModal(true)}
                  className="h-10 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Icon icon="mdi:gift-outline" className="text-base" />
                  <span>Request Free Demo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showPlanRequestModal && (
        <PlanRequestModal
          onClose={() => setShowPlanRequestModal(false)}
          onSuccess={(msg) => setSignupMessage(msg)}
        />
      )}

      {showResetPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 modal-backdrop flex items-center justify-center p-4">
          <form onSubmit={handleForgotPassword} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon icon="mdi:key-outline" className="text-orange-600 text-lg" />
                Reset Password
              </h2>
              <button type="button" onClick={() => setShowResetPassword(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <Icon icon="mdi:close" className="text-lg" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Enter your email and request a password reset. Your administrator can help you set a new password.</p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-orange-500"
              />
            </div>

            {resetError && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2">{resetError}</div>}
            {resetMessage && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2">{resetMessage}</div>}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowResetPassword(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800">Cancel</button>
              <button
                type="submit"
                disabled={resetLoading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white text-sm font-bold rounded-xl flex items-center gap-2"
              >
                {resetLoading && <Icon icon="mdi:loading" className="animate-spin text-base" />}
                <span>Request Reset</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {showCreateAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 modal-backdrop flex items-center justify-center p-4">
          <form onSubmit={handleCreateAccount} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon icon="mdi:account-plus-outline" className="text-orange-600 text-lg" />
                Create New Account
              </h2>
              <button type="button" onClick={() => setShowCreateAccount(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <Icon icon="mdi:close" className="text-lg" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={signup.name}
                onChange={(e) => setSignup({ ...signup, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Username / Email</label>
              <input
                type="email"
                required
                value={signup.email}
                onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center px-1.5 text-slate-400 hover:text-slate-700"
                  >
                    <Icon icon={showSignupPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className="text-lg" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm Password</label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={signup.confirmPassword}
                  onChange={(e) => setSignup({ ...signup, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
            </div>

            {signupError && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2">{signupError}</div>}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowCreateAccount(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800">Cancel</button>
              <button
                type="submit"
                disabled={signupLoading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white text-sm font-bold rounded-xl flex items-center gap-2"
              >
                {signupLoading && <Icon icon="mdi:loading" className="animate-spin text-base" />}
                <span>Create Account</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
