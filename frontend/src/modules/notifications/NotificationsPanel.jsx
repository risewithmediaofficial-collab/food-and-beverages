import { useState } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:bell-outline" className="text-orange-500 text-lg" /> Real-Time Notifications & System Alerts
          </h2>
          <p className="text-xs text-slate-400">Automated event alerts: low stock, machine breakdowns, QC failures, batch completions & approvals</p>
        </div>
        <ExportDataToolbar data={notifications} filename="system_notifications" title="System Notifications & Alerts" />
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:bell-off-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Active Notifications</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">You have no unread system alerts, low stock warnings, or pending approval notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl border ${
                  n.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200' : n.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  <Icon icon={n.type === 'warning' ? 'mdi:alert-outline' : n.type === 'success' ? 'mdi:check-circle-outline' : 'mdi:information-outline'} className="text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">{n.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
