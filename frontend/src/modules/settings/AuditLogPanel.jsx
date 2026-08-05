import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function AuditLogPanel({ user, triggerError }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/org/audit-logs');
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:shield-search-outline" className="text-orange-500 text-lg" /> System Security & Audit Activity Trail
          </h2>
          <p className="text-xs text-slate-400">Tamper-evident system access audit trail logging every user login, data modification, and approval</p>
        </div>

        <ExportDataToolbar data={logs} filename="system_audit_logs" title="System Audit Logs" />
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:shield-search-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Security Audit Logs Recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no audit events or security log records logged in the system database yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop / Tablet: Table view */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User & IP Address</th>
                    <th className="p-4">Module</th>
                    <th className="p-4">Action Event</th>
                    <th className="p-4">Activity Details</th>
                    <th className="p-4">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-600">{l.timestamp || new Date(l.createdAt).toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-900">
                        <div>{l.user}</div>
                        <span className="text-[10px] font-mono text-slate-400">{l.ipAddress || '127.0.0.1'}</span>
                      </td>
                      <td className="p-4 font-bold text-orange-600">{l.module}</td>
                      <td className="p-4 font-mono text-slate-800 font-bold">{l.action}</td>
                      <td className="p-4 text-slate-700">{l.details}</td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          {l.severity || 'INFO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Card/list view */}
          <div className="block md:hidden space-y-3">
            {logs.map((l) => (
              <div key={l._id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500 font-mono">{l.timestamp || new Date(l.createdAt).toLocaleString()}</div>
                    <div className="font-bold text-sm text-slate-900 mt-2">{l.action}</div>
                    <div className="text-xs text-slate-500 mt-1">{l.module} • {l.user}</div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">{l.severity || 'INFO'}</div>
                    <div className="text-[11px] text-slate-400 mt-2 font-mono">{l.ipAddress || '127.0.0.1'}</div>
                  </div>
                </div>
                {l.details && <div className="text-sm text-slate-700 mt-3">{l.details}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
