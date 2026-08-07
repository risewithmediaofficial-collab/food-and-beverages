import { useState, useEffect } from 'react';
import { socket } from '../lib/socket';
import { Icon } from '@iconify/react';
import { MODULE_MAP } from '../moduleRoutes';

export default function Header({ activeModule, user, onMenuToggle, isCollapsed }) {
  const [isLive, setIsLive] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [nowStr, setNowStr] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setNowStr(
        now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
        '  ' +
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onConnect = () => setIsLive(true);
    const onDisconnect = () => setIsLive(false);
    const onOnline = () => setIsLive(true);
    const onOffline = () => setIsLive(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
    });

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const moduleInfo = MODULE_MAP[activeModule] || MODULE_MAP['dashboard'];
  const moduleLabel = moduleInfo?.label || 'Executive Dashboard';
  const moduleIcon = moduleInfo?.icon || 'mdi:view-dashboard-outline';
  const plantName = user?.plant || 'Manufacturing Plant';

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-20 font-sans shadow-sm shrink-0 gap-3">
      {/* Left: Menu Toggle + Module Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition shrink-0 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Icon icon={isCollapsed ? "mdi:menu-open" : "mdi:menu"} className="text-lg" />
        </button>


        {/* Module info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon icon={moduleIcon} className="text-orange-500 text-base shrink-0" />
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
              {moduleLabel}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 truncate hidden sm:block">
            {plantName} · {user?.department || 'Executive'}
          </span>
        </div>
      </div>

      {/* Right: Live Status, Date, Notifications, User */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Date/Time — hidden on very small screens */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <Icon icon="mdi:calendar-clock-outline" className="text-orange-500 text-sm" />
          <span className="font-mono">{nowStr}</span>
        </div>

        {/* Socket Live Indicator */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
          isLive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isLive ? 'Live' : 'Offline'}</span>
        </div>

        {/* SaaS Organization Badge / Super Admin Notice */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-800">
          <Icon icon={user?.isSuperAdmin ? "mdi:shield-crown" : "mdi:domain"} className="text-amber-600 text-sm" />
          <span className="truncate max-w-[140px] font-bold">
            {user?.isSuperAdmin ? 'Super Admin Mode' : (user?.orgName || 'Juice ERP Multi-Tenant')}
          </span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition relative cursor-pointer"
          >
            <Icon icon="mdi:bell-outline" className="text-base" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 space-y-3 max-h-80 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                <button onClick={() => setNotifications([])} className="text-[11px] text-orange-600 font-semibold hover:underline cursor-pointer">
                  Clear All
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Icon icon="mdi:bell-sleep-outline" className="text-3xl text-slate-300" />
                  <span className="text-xs text-slate-400">No new notifications</span>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={n.id || i} className={`p-2.5 rounded-xl border text-xs ${
                    n.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-orange-50 text-orange-800 border-orange-100'
                  }`}>
                    {n.text}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <span className="text-xs font-bold text-slate-900 block">{user?.name || 'Admin'}</span>
            <span className="text-[10px] text-orange-600 font-semibold block">{user?.roleName || 'General Manager'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
