import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';

export default function RfidAttendancePanel() {
  const [activeTab, setActiveTab] = useState('live');
  const [logs, setLogs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [simCardNo, setSimCardNo] = useState('RF-882190');
  const [simPunchType, setSimPunchType] = useState('IN');
  const [punchAlert, setPunchAlert] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const logRes = await api.get('/hr/attendance/logs');
      if (logRes.success && Array.isArray(logRes.data)) {
        setLogs(logRes.data);
      } else {
        setLogs([]);
      }

      const devRes = await api.get('/hr/devices');
      if (devRes.success && Array.isArray(devRes.data)) {
        setDevices(devRes.data);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.warn('Backend load error for RFID attendance:', err);
      setLogs([]);
      setDevices([]);
    }
  };

  const handleSimulatePunch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/hr/attendance/punch', {
        rfidCardNo: simCardNo,
        punchType: simPunchType,
        deviceName: 'ZKTeco Main Gate #1',
      });
      if (res.success && res.data) {
        setLogs([res.data, ...logs]);
        setPunchAlert({ message: `✅ Punch Recorded: ${res.data.empName} (${res.data.punchType} at ${res.data.punchTime})`, type: 'success' });
      }
    } catch (err) {
      setPunchAlert({ message: `❌ Punch failed: ${err.message || 'Could not connect to server'}`, type: 'error' });
    }
  };


  return (
    <div className="space-y-6 font-sans">
      {/* Top Controls & Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:card-account-details-outline" className="text-orange-500 text-lg" /> RFID Attendance & Device Sync Engine
          </h2>
          <p className="text-xs text-slate-400">Real-time RFID card scan, biometric punch logs, hardware device IP status & live attendance screen</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'live' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            📺 Live Punch Screen
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'logs' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            📋 Punch Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'devices' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            📡 Hardware Devices ({devices.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Present Today</span>
          <span className="text-lg font-extrabold text-emerald-600 font-mono">{logs.length}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Absent</span>
          <span className="text-lg font-extrabold text-rose-600 font-mono">0</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Late Coming</span>
          <span className="text-lg font-extrabold text-amber-600 font-mono">0</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">On Leave</span>
          <span className="text-lg font-extrabold text-blue-600 font-mono">0</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Missed Punch</span>
          <span className="text-lg font-extrabold text-purple-600 font-mono">0</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Overtime Active</span>
          <span className="text-lg font-extrabold text-orange-600 font-mono">0</span>
        </div>
      </div>

      {/* RFID Card Scan Simulator Tool */}
      <form onSubmit={handleSimulatePunch} className="bg-orange-50/70 border border-orange-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:credit-card-wireless-outline" className="text-orange-600 text-xl" />
          <div>
            <h3 className="text-xs font-bold text-orange-950">RFID Device Card Scan Simulator</h3>
            <p className="text-[11px] text-orange-700">Simulate an incoming RFID card swipe or fingerprint punch into the ERP pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={simCardNo}
            onChange={(e) => setSimCardNo(e.target.value)}
            className="bg-white border border-orange-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none font-mono"
          >
            <option value="RF-882190">RF-882190 (Employee Card)</option>
            <option value="RF-882192">RF-882192 (Plant Card)</option>
            <option value="RF-882193">RF-882193 (Operator Card)</option>
          </select>

          <select
            value={simPunchType}
            onChange={(e) => setSimPunchType(e.target.value)}
            className="bg-white border border-orange-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
          >
            <option value="IN">IN Punch</option>
            <option value="OUT">OUT Punch</option>
          </select>

          <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer shrink-0">
            Swipe Card 💳
          </button>
        </div>
      </form>

      {punchAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex justify-between items-center">
          <span>{punchAlert.message}</span>
          <button onClick={() => setPunchAlert(null)} className="text-emerald-600 hover:text-emerald-800"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Main View Switcher */}
      {activeTab === 'live' ? (
        logs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
              <Icon icon="mdi:card-account-details-outline" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No RFID Punch Logs Today</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">No punches have been scanned from hardware devices today. Use the simulator bar above to swipe an RFID card.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span> Live RFID Punch Stream
              </h3>
              <span className="text-xs text-slate-400 font-mono">Synced with Hardware Cloud Gateway</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {logs.slice(0, 6).map((log) => (
                <div key={log._id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                        {log.empName ? log.empName.charAt(0) : 'W'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{log.empName}</h4>
                        <span className="text-[10px] font-mono text-slate-400 block">{log.rfidCardNo}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      log.punchType === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {log.punchType}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Punch Time:</span>
                    <span className="font-mono font-extrabold text-slate-900">{log.punchTime}</span>
                  </div>

                  <span className="text-[10px] text-slate-400 block truncate">Location: {log.deviceName}</span>
                </div>
              ))}
            </div>
          </div>
        )
      ) : activeTab === 'logs' ? (
        logs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
              <Icon icon="mdi:card-account-details-outline" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Attendance Logs Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">No card punch records exist in the database.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Employee Name</th>
                    <th className="p-4">RFID Card No</th>
                    <th className="p-4">Punch Time</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Device Source</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-orange-600">{l.empId}</td>
                      <td className="p-4 font-bold text-slate-900">{l.empName}</td>
                      <td className="p-4 font-mono text-slate-600">{l.rfidCardNo}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">{l.punchTime}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          l.punchType === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {l.punchType}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{l.deviceName}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                          {l.status || 'Present'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        devices.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
              <Icon icon="mdi:router-wireless" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Hardware Devices Connected</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">No biometric or RFID hardware devices configured in master setup.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {devices.map((d) => (
              <div key={d._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">{d.brand} Device</span>
                    <h3 className="font-bold text-slate-900 text-sm">{d.deviceName}</h3>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {d.onlineStatus || 'Online'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-mono space-y-1">
                  <div>IP Address: <strong className="text-slate-800">{d.deviceIp}</strong></div>
                  <div>Protocol: <strong className="text-slate-800">{d.communicationType}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
