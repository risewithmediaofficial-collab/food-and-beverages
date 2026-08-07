import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import useMountAnimation from '../../lib/useMountAnimation';

export default function SettingsPanel() {
  const mountCls = useMountAnimation();
  return (
    <div className={`space-y-6 font-sans transition duration-300 ease-out ${mountCls}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:cog-outline" className="text-orange-500 text-lg" /> System Settings &amp; Security RBAC
          </h2>
          <p className="text-xs text-slate-400">Application settings, role-based access control, factories, and departments</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Manage configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/org" className="block bg-orange-50/50 hover:bg-orange-50 hover:shadow-md p-5 rounded-2xl border border-orange-200 transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:domain" className="text-orange-600 text-xl" />
              <div>
                <div className="text-sm font-bold text-slate-900">Organization & GST Setup</div>
                <div className="text-xs text-slate-500 mt-0.5">Company GSTIN, FSSAI & Tax info</div>
              </div>
            </div>
          </Link>

          <Link to="/users" className="block bg-white hover:shadow-md p-5 rounded-2xl border border-slate-100 transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:account-group" className="text-orange-500 text-xl" />
              <div>
                <div className="text-sm font-semibold text-slate-900">User Management</div>
                <div className="text-xs text-slate-500">Create and manage user accounts</div>
              </div>
            </div>
          </Link>

          <Link to="/roles" className="block bg-white hover:shadow-md p-5 rounded-2xl border border-slate-100 transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:shield-lock-outline" className="text-orange-500 text-xl" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Roles & Permissions</div>
                <div className="text-xs text-slate-500">Define roles and module access</div>
              </div>
            </div>
          </Link>

          <Link to="/factories" className="block bg-white hover:shadow-md p-5 rounded-2xl border border-slate-100 transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:factory" className="text-orange-500 text-xl" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Factories</div>
                <div className="text-xs text-slate-500">Manage manufacturing plants</div>
              </div>
            </div>
          </Link>

          <Link to="/departments" className="block bg-white hover:shadow-md p-5 rounded-2xl border border-slate-100 transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:office-building" className="text-orange-500 text-xl" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Departments</div>
                <div className="text-xs text-slate-500">Organizational departments & cost centers</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
