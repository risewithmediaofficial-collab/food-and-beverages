import { useState } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';

const initialSignup = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function LoginPanel({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [signup, setSignup] = useState(initialSignup);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupMessage, setSignupMessage] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center px-4 py-8 font-sans text-slate-900">
      <div
        className="w-full bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/70 px-6 py-5 space-y-5"
        style={{ maxWidth: '380px' }}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Icon icon="mdi:fruit-citrus" className="text-2xl" />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-slate-950 leading-tight">Food & Beverages ERP</h1>
              <span className="text-xs text-slate-500 font-semibold block">Operations Portal</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Username / Email</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-950 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-10 px-3 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-950 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center px-1.5 text-slate-500 hover:text-slate-900"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            className="w-full h-10 disabled:opacity-70 text-white text-sm font-bold rounded-lg shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
          >
            {loading ? <Icon icon="mdi:loading" className="animate-spin text-base" /> : <><span>Sign In</span><Icon icon="mdi:arrow-right" className="text-base" /></>}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreateAccount(true);
              setSignupError('');
              setSignupMessage('');
            }}
            className="w-full h-10 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:account-plus-outline" className="text-base" />
            <span>Create New Account</span>
          </button>
        </form>
      </div>

      {showCreateAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateAccount} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon icon="mdi:account-plus-outline" className="text-orange-600 text-lg" />
                Create New Account
              </h2>
              <button type="button" onClick={() => setShowCreateAccount(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close">
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
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
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
