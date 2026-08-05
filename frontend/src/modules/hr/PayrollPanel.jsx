import { useState } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function PayrollPanel({ user, triggerError }) {
  const [payroll, setPayroll] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPay, setEditingPay] = useState(null);
  const [newSalary, setNewSalary] = useState({
    empId: 'EMP-101',
    empName: '',
    department: 'Plant Operations',
    designation: 'Staff',
    monthYear: 'August 2026',
    basicPay: 35000,
    hra: 10000,
    overtimePay: 0,
    pfDeduction: 1800,
    esiDeduction: 750,
    lateDeduction: 0,
    status: 'Paid',
  });

  const totalPayrollOutflow = payroll.reduce((sum, p) => sum + p.netSalary, 0);

  const handleAddSalary = (e) => {
    e.preventDefault();
    const created = {
      _id: Date.now().toString(),
      slipId: `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      ...newSalary,
      netSalary: Number(newSalary.basicPay) + Number(newSalary.hra) + Number(newSalary.overtimePay) - (Number(newSalary.pfDeduction) + Number(newSalary.esiDeduction) + Number(newSalary.lateDeduction)),
    };
    setPayroll([created, ...payroll]);
    setShowAddModal(false);
    setNewSalary({
      empId: 'EMP-101',
      empName: '',
      department: 'Plant Operations',
      designation: 'Staff',
      monthYear: 'August 2026',
      basicPay: 35000,
      hra: 10000,
      overtimePay: 0,
      pfDeduction: 1800,
      esiDeduction: 750,
      lateDeduction: 0,
      status: 'Paid',
    });
    if (triggerError) triggerError('Payroll entry added!', 'success');
  };

  const handleDeletePayroll = (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    setPayroll(payroll.filter(p => p._id !== id));
    if (triggerError) triggerError('Payroll record removed!', 'success');
  };

  const formatCurrency = (value) => `₹${Number(value).toLocaleString()}`;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:cash-multiple" className="text-orange-500 text-lg" /> Payroll & Salary Disbursement Register
          </h2>
          <p className="text-xs text-slate-400">Automated basic salary, overtime calculations, PF/ESI statutory deductions, and net payslips</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Current Outflow:</span>
            <span className="text-sm font-mono font-extrabold text-orange-600">{formatCurrency(totalPayrollOutflow)}</span>
          </div>

          <ExportDataToolbar data={payroll} filename="payroll_disbursement_register" title="Payroll Salary Register" />
          <button
            onClick={() => {
              setNewSalary({ empId: 'EMP-101', empName: '', department: 'Plant Operations', designation: 'Staff', monthYear: 'August 2026', basicPay: 35000, hra: 10000, overtimePay: 0, pfDeduction: 1800, esiDeduction: 750, lateDeduction: 0, status: 'Paid' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add Salary Entry
          </button>
        </div>
      </div>

      {showAddModal && (
        <form onSubmit={handleAddSalary} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:cash-multiple" className="text-orange-500 text-base" /> Register New Payroll Entry
            </h3>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={newSalary.empId}
                onChange={(e) => setNewSalary({ ...newSalary, empId: e.target.value })}
                placeholder="EMP-101"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Employee Name *</label>
              <input
                type="text"
                required
                value={newSalary.empName}
                onChange={(e) => setNewSalary({ ...newSalary, empName: e.target.value })}
                placeholder="e.g. Vikram Sharma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Department</label>
              <input
                type="text"
                value={newSalary.department}
                onChange={(e) => setNewSalary({ ...newSalary, department: e.target.value })}
                placeholder="Plant Operations"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Designation</label>
              <input
                type="text"
                value={newSalary.designation}
                onChange={(e) => setNewSalary({ ...newSalary, designation: e.target.value })}
                placeholder="Plant Supervisor"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Pay Period *</label>
              <input
                type="text"
                required
                value={newSalary.monthYear}
                onChange={(e) => setNewSalary({ ...newSalary, monthYear: e.target.value })}
                placeholder="August 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Status</label>
              <select
                value={newSalary.status}
                onChange={(e) => setNewSalary({ ...newSalary, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Held">Held</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Basic Pay (₹) *</label>
              <input
                type="number"
                required
                value={newSalary.basicPay}
                onChange={(e) => setNewSalary({ ...newSalary, basicPay: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">HRA (₹) *</label>
              <input
                type="number"
                required
                value={newSalary.hra}
                onChange={(e) => setNewSalary({ ...newSalary, hra: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Overtime Pay (₹)</label>
              <input
                type="number"
                value={newSalary.overtimePay}
                onChange={(e) => setNewSalary({ ...newSalary, overtimePay: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">PF Deduction (₹)</label>
              <input
                type="number"
                value={newSalary.pfDeduction}
                onChange={(e) => setNewSalary({ ...newSalary, pfDeduction: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">ESI Deduction (₹)</label>
              <input
                type="number"
                value={newSalary.esiDeduction}
                onChange={(e) => setNewSalary({ ...newSalary, esiDeduction: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">Save Payroll Entry</button>
          </div>
        </form>
      )}

      {payroll.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:cash-multiple" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Payroll Slips Processed</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no salary disbursement records in the payroll register. Click below to add a salary entry.</p>
          <button
            onClick={() => {
              setNewSalary({ empId: 'EMP-101', empName: '', department: 'Plant Operations', designation: 'Staff', monthYear: 'August 2026', basicPay: 35000, hra: 10000, overtimePay: 0, pfDeduction: 1800, esiDeduction: 750, lateDeduction: 0, status: 'Paid' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add First Salary Entry
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[800px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Payslip Ref</th>
                  <th className="p-4">Employee ID & Name</th>
                  <th className="p-4">Department & Role</th>
                  <th className="p-4">Basic + HRA</th>
                  <th className="p-4">Overtime Pay</th>
                  <th className="p-4">PF / ESI / Deductions</th>
                  <th className="p-4">Net Salary Payable</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payroll.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{p.slipId}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{p.empName}</span>
                      <span className="text-[10px] font-mono text-slate-400 block">{p.empId}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-800 font-semibold block">{p.department}</span>
                      <span className="text-[10px] text-slate-400 block">{p.designation}</span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">
                      ₹{((p.basicPay || 0) + (p.hra || 0)).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-emerald-600 font-bold">+₹{(p.overtimePay || 0).toLocaleString()}</td>
                    <td className="p-4 font-mono text-rose-600">-₹{((p.pfDeduction || 0) + (p.esiDeduction || 0) + (p.lateDeduction || 0)).toLocaleString()}</td>
                    <td className="p-4 font-mono font-extrabold text-orange-600 text-sm">
                      ₹{(p.netSalary || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeletePayroll(p._id)} className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
                        <Icon icon="mdi:trash-can-outline" className="text-base text-rose-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
