import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function MachinePanel() {
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    code: '',
    category: 'washer',
    capacityUnitsPerHour: 1200,
  });

  const [editingMachine, setEditingMachine] = useState(null);

  useEffect(() => {
    fetchMachines();
    socket.on('machine:status-changed', (payload) => {
      // payload: { machineId, status, oee, machineName, startedAt, stoppedAt, lastRunDurationMinutes, totalRunMinutes }
      setMachines((prev) => prev.map((m) => (m._id === payload.machineId ? { ...m, currentStatus: payload.status, oee: payload.oee, startedAt: payload.startedAt, stoppedAt: payload.stoppedAt, lastRunDurationMinutes: payload.lastRunDurationMinutes, totalRunMinutes: payload.totalRunMinutes } : m)));
    });

    return () => {
      socket.off('machine:status-changed');
    };
  }, []);

  const fetchMachines = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/machines');
      if (res.success && res.data.length > 0) {
        setMachines(res.data.map(m => ({ ...m })));
      } else {
        setMachines([]);
      }
    } catch (err) {
      console.warn('Unable to load machine master data from backend.', err);
      setLoadError('Unable to load machine data. Please verify backend connectivity.');
      setMachines([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (mins) => {
    if (!mins || mins <= 0) return '0 mins';
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
    }
    return `${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    setActionError('');

    const machineObj = {
      name: newMachine.name,
      code: newMachine.code || `MCH-${newMachine.category.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      category: newMachine.category,
      capacityUnitsPerHour: Number(newMachine.capacityUnitsPerHour),
      currentStatus: 'idle',
    };

    try {
      const res = await api.post('/machines', machineObj);
      if (res.success && res.data) {
        setMachines([res.data, ...machines]);
        setShowAddModal(false);
        setNewMachine({ name: '', code: '', category: 'washer', capacityUnitsPerHour: 1200 });
      } else {
        throw new Error(res.message || 'Machine save failed');
      }
    } catch (err) {
      console.warn('Unable to save machine', err);
      setActionError('Unable to save machine. Please verify backend connectivity and try again.');
    }
  };

  const handleUpdateMachine = async (e) => {
    e.preventDefault();
    if (!editingMachine) return;
    setActionError('');
    try {
      const res = await api.put(`/machines/${editingMachine._id}`, editingMachine);
      if (res.success) {
        setMachines(machines.map(m => m._id === editingMachine._id ? { ...editingMachine, ...res.data } : m));
        setEditingMachine(null);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setMachines(machines.map(m => m._id === editingMachine._id ? editingMachine : m));
      setEditingMachine(null);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (!window.confirm('Are you sure you want to delete this machine?')) return;
    setActionError('');
    try {
      await api.delete(`/machines/${machineId}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setMachines(machines.filter(m => m._id !== machineId));
  };

  const handleLogEvent = async (machineId, type) => {
    setActionError('');
    const statusMap = { start: 'running', stop: 'idle', breakdown: 'breakdown', cleaning: 'idle' };
    const now = new Date();

    try {
      const res = await api.post(`/machines/${machineId}/event`, { type });
      if (res.success && res.data?.machine) {
        setMachines(machines.map(m => m._id === machineId ? { ...m, ...res.data.machine } : m));
        return;
      }
      throw new Error(res.message || 'Machine event failed');
    } catch (err) {
      setMachines(machines.map(m => {
        if (m._id !== machineId) return m;
        const isStart = type === 'start';
        const startedAt = isStart ? now.toISOString() : m.startedAt;
        const stoppedAt = !isStart ? now.toISOString() : m.stoppedAt;
        let lastRunMin = m.lastRunDurationMinutes || 0;
        let totalRunMin = m.totalRunMinutes || 0;

        if (!isStart && m.startedAt) {
          lastRunMin = Math.max(1, Math.round((now - new Date(m.startedAt)) / (1000 * 60)));
          totalRunMin += lastRunMin;
        }

        return {
          ...m,
          currentStatus: statusMap[type] || 'idle',
          startedAt,
          stoppedAt,
          lastRunDurationMinutes: lastRunMin,
          totalRunMinutes: totalRunMin,
        };
      }));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:robot-industrial" className="text-blue-600 text-lg" /> Machine Master & Shift Runtime Tracking
          </h2>
          <p className="text-xs text-slate-400">Anyone logged in can Start / Stop line equipment. Tracks exact start time, stop time & elapsed run duration.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ExportDataToolbar data={machines} filename="machine_assets_master" title="Machine Master & Shift Runtime Tracking" />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer w-full sm:w-auto"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add New Machine
          </button>
        </div>
      </div>

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddModal && (
        <form onSubmit={handleAddMachine} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:cogs" className="text-blue-600 text-base" /> Add Machine to Line Master
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Machine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pasteurizer Unit #2"
                value={newMachine.name}
                onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Machine Code</label>
              <input
                type="text"
                placeholder="e.g. MCH-PST-04"
                value={newMachine.code}
                onChange={(e) => setNewMachine({ ...newMachine, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Category</label>
              <select
                value={newMachine.category}
                onChange={(e) => setNewMachine({ ...newMachine, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="washer">Washer & Sorting</option>
                <option value="extractor">Juice Extractor</option>
                <option value="pasteurizer">Flash Pasteurizer</option>
                <option value="homogenizer">Homogenizer</option>
                <option value="filler">Bottling & Capping</option>
                <option value="labeler">Labeling Line</option>
                <option value="packager">Case Packager</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Capacity (Units Per Hour)</label>
              <input
                type="number"
                value={newMachine.capacityUnitsPerHour}
                onChange={(e) => setNewMachine({ ...newMachine, capacityUnitsPerHour: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Save Machine Details</button>
          </div>
        </form>
      )}

      {/* Edit Machine Modal */}
      {editingMachine && (
        <form onSubmit={handleUpdateMachine} className="bg-white border border-amber-300 p-5 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:pencil" className="text-amber-600 text-base" /> Edit Machine Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Machine Name</label>
              <input
                type="text"
                required
                value={editingMachine.name || ''}
                onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Machine Code</label>
              <input
                type="text"
                value={editingMachine.code || ''}
                onChange={(e) => setEditingMachine({ ...editingMachine, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Capacity (UPH)</label>
              <input
                type="number"
                value={editingMachine.capacityUnitsPerHour || 1200}
                onChange={(e) => setEditingMachine({ ...editingMachine, capacityUnitsPerHour: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Status</label>
              <select
                value={editingMachine.currentStatus || 'idle'}
                onChange={(e) => setEditingMachine({ ...editingMachine, currentStatus: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="idle">idle</option>
                <option value="running">running</option>
                <option value="breakdown">breakdown</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setEditingMachine(null)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Update Machine</button>
          </div>
        </form>
      )}

      {/* Machine Cards */}
      {loadError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-700">{loadError}</div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading machine master data...</div>
      ) : machines.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No machines registered yet. Click "Add New Machine" to add line equipment.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {machines.map((m) => (
            <div key={m._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600">{m.code}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{m.name}</h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    m.currentStatus === 'running' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : m.currentStatus === 'breakdown' ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-bounce' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {m.currentStatus}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center mt-3">
                  <div className="w-full text-left">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Capacity</span>
                    <span className="text-sm font-mono font-bold text-slate-700">{m.capacityUnitsPerHour} UPH</span>
                  </div>
                </div>

                {/* Shift & Run Timing Details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5 mt-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-semibold">Total Shift Runtime:</span>
                    <strong className="font-mono text-blue-700 font-extrabold">{formatDuration(m.totalRunMinutes)}</strong>
                  </div>

                  {m.startedAt && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Start Time:</span>
                      <span className="font-mono font-bold text-slate-800">{new Date(m.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  )}

                  {m.stoppedAt && m.currentStatus !== 'running' && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Stop Time:</span>
                      <span className="font-mono font-bold text-slate-800">{new Date(m.stoppedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  )}

                  {m.lastRunDurationMinutes > 0 && m.currentStatus !== 'running' && (
                    <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold pt-1 border-t border-slate-200/60">
                      <span>Last Run Duration:</span>
                      <span className="font-mono">{formatDuration(m.lastRunDurationMinutes)}</span>
                    </div>
                  )}

                  {m.currentStatus === 'running' && (
                    <div className="flex justify-between items-center text-[10px] text-emerald-600 font-bold animate-pulse pt-1 border-t border-slate-200/60">
                      <span>Status:</span>
                      <span>🟢 Machine Running...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleLogEvent(m._id, m.currentStatus === 'running' ? 'stop' : 'start')}
                    className={`text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition ${
                      m.currentStatus === 'running'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    <Icon icon={m.currentStatus === 'running' ? 'mdi:pause' : 'mdi:play'} className="text-base" />
                    {m.currentStatus === 'running' ? 'Stop Machine' : 'Start Machine'}
                  </button>

                  <button
                    onClick={() => handleLogEvent(m._id, 'breakdown')}
                    className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Icon icon="mdi:alert-outline" className="text-base" /> Breakdown
                  </button>
                </div>

                <div className="flex justify-end gap-1 pt-1">
                  <button
                    onClick={() => setEditingMachine(m)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Edit Machine"
                  >
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDeleteMachine(m._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Machine"
                  >
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
