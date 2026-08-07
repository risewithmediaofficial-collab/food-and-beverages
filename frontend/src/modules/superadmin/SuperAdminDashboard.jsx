import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../lib/api';

const ALL_SYSTEM_MODULES = [
  { id: 'dashboard', label: 'Executive Dashboard', category: 'General' },
  { id: 'crm', label: 'CRM & Lead Management', category: 'Sales & CRM' },
  { id: 'leads', label: 'Lead Management', category: 'Sales & CRM' },
  { id: 'customers', label: 'Customer Directory', category: 'Sales & CRM' },
  { id: 'sales', label: 'Sales Orders & Invoicing', category: 'Sales & CRM' },
  { id: 'purchase', label: 'Purchase Orders & Suppliers', category: 'Supply Chain' },
  { id: 'suppliers', label: 'Supplier Master', category: 'Supply Chain' },
  { id: 'rawmaterial', label: 'Raw Materials & BOM', category: 'Supply Chain' },
  { id: 'inventory', label: 'Stock & Batch Tracking', category: 'Inventory' },
  { id: 'warehouse', label: 'Multi-Warehouse Master', category: 'Inventory' },
  { id: 'planning', label: 'Production Planning', category: 'Production' },
  { id: 'production', label: 'Plant Production Orders', category: 'Production' },
  { id: 'batches', label: 'Batch Management', category: 'Production' },
  { id: 'machine', label: 'Machine Master & Status', category: 'Operations' },
  { id: 'machine_operation', label: 'Line Operator Console', category: 'Operations' },
  { id: 'maintenance', label: 'Maintenance & Tickets', category: 'Operations' },
  { id: 'quality', label: 'QA Lab & Testing', category: 'Quality' },
  { id: 'laboratory', label: 'Microbiology & Chemistry Lab', category: 'Quality' },
  { id: 'packaging', label: 'Packaging Line Master', category: 'Operations' },
  { id: 'dispatch', label: 'Logistics & Dispatch Gate', category: 'Logistics' },
  { id: 'compliance', label: 'FSSAI & Regulatory Compliance', category: 'Quality' },
  { id: 'employees', label: 'Employee Directory & HR', category: 'HR' },
  { id: 'rfid_attendance', label: 'RFID Attendance Devices', category: 'HR' },
  { id: 'shifts', label: 'Shift Roster & Timings', category: 'HR' },
  { id: 'leaves', label: 'Leave Applications & Approvals', category: 'HR' },
  { id: 'payroll', label: 'Payroll & Salary Register', category: 'HR' },
  { id: 'finance', label: 'General Ledger & Accounts', category: 'Finance' },
  { id: 'expense', label: 'Expense Vouchers', category: 'Finance' },
  { id: 'reports', label: 'Executive BI Reports', category: 'Analytics' },
  { id: 'documents', label: 'Document Library', category: 'Analytics' },
  { id: 'settings', label: 'Organization Settings', category: 'General' },
  { id: 'users', label: 'User Account Management', category: 'General' },
  { id: 'roles', label: 'Role & Permission Builder', category: 'General' },
  { id: 'factories', label: 'Plant & Factory Master', category: 'General' },
  { id: 'departments', label: 'Department Master', category: 'General' },
  { id: 'audit', label: 'Audit Logs & Traceability', category: 'General' },
];

const EMPTY_ORG_FORM = {
  name: '',
  businessEmail: '',
  phone: '',
  planType: 'Growth Plan',
  maxUsers: 25,
  adminName: '',
  adminPassword: '',
};

export default function SuperAdminDashboard({ user, onLogout, onSelectOrgForInspection }) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'orgs'
  const [stats, setStats] = useState({ totalOrgs: 0, activeOrgs: 0, pendingRequests: 0, totalUsers: 0 });
  const [requests, setRequests] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Rejection Modal State
  const [rejectingReq, setRejectingReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Approval / Creation Success Modal State
  const [approvedResult, setApprovedResult] = useState(null);
  const [approvingReq, setApprovingReq] = useState(null);
  const [approvalForm, setApprovalForm] = useState({ adminEmail: '', adminPassword: '' });
  const [showApprovalPassword, setShowApprovalPassword] = useState(false);

  // Create Org Modal State
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState(EMPTY_ORG_FORM);
  const [createOrgError, setCreateOrgError] = useState('');
  const [showNewOrgPassword, setShowNewOrgPassword] = useState(false);

  // Edit Org Modal State
  const [editingOrg, setEditingOrg] = useState(null);
  const [editOrgForm, setEditOrgForm] = useState({ name: '', planType: '', maxUsers: 25, status: 'Active', phone: '', businessEmail: '' });

  // Permissions / Access Control Modal State
  const [permissionsOrg, setPermissionsOrg] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);

  // Reset Password Modal State
  const [resetPassResult, setResetPassResult] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordOrg, setChangePasswordOrg] = useState(null);
  const [changePasswordValue, setChangePasswordValue] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [showChangePasswordValue, setShowChangePasswordValue] = useState(false);

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, reqsRes, orgsRes] = await Promise.all([
        api.get('/superadmin/stats'),
        api.get('/superadmin/requests'),
        api.get('/superadmin/orgs'),
      ]);
      setStats(statsRes?.data || {});
      setRequests(reqsRes?.data || []);
      setOrgs(orgsRes?.data || []);
    } catch (err) {
      console.warn('Super admin fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (req) => {
    setApprovingReq(req);
    setApprovalForm({
      adminEmail: req?.businessEmail || '',
      adminPassword: '',
    });
    setShowApprovalPassword(false);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approvingReq) return;
    setActionLoading(approvingReq._id);
    try {
      const res = await api.post(`/superadmin/requests/${approvingReq._id}/approve`, {
        adminEmail: approvalForm.adminEmail.trim().toLowerCase(),
        adminPassword: approvalForm.adminPassword,
      });
      setApprovedResult(res?.data);
      setApprovingReq(null);
      setApprovalForm({ adminEmail: '', adminPassword: '' });
      fetchSuperAdminData();
    } catch (err) {
      alert(err?.message || 'Failed to approve organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingReq) return;
    setActionLoading(rejectingReq._id);
    try {
      await api.post(`/superadmin/requests/${rejectingReq._id}/reject`, { rejectionReason });
      setRejectingReq(null);
      setRejectionReason('');
      fetchSuperAdminData();
    } catch (err) {
      alert(err?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setCreateOrgError('');
    setActionLoading('create_org');
    try {
      const res = await api.post('/superadmin/orgs', newOrgForm);
      setShowAddOrgModal(false);
      setNewOrgForm(EMPTY_ORG_FORM);
      setApprovedResult(res?.data);
      fetchSuperAdminData();
    } catch (err) {
      setCreateOrgError(err?.message || 'Failed to create organization');
    } finally {
      setActionLoading(null);
    }
  };

  const openChangePasswordModal = (org) => {
    setChangePasswordOrg(org);
    setChangePasswordValue('');
    setChangePasswordError('');
    setShowChangePasswordValue(false);
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!changePasswordOrg) return;
    if (!changePasswordValue || changePasswordValue.trim().length < 6) {
      setChangePasswordError('Please enter a password with at least 6 characters.');
      return;
    }

    setChangePasswordError('');
    setActionLoading(`change_pass_${changePasswordOrg._id}`);
    try {
      const res = await api.post(`/superadmin/orgs/${changePasswordOrg._id}/reset-password`, {
        newPassword: changePasswordValue.trim(),
      });
      setShowChangePasswordModal(false);
      setChangePasswordOrg(null);
      setChangePasswordValue('');
      fetchSuperAdminData();
    } catch (err) {
      setChangePasswordError(err?.message || 'Failed to change password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    if (!editingOrg) return;
    setActionLoading(editingOrg._id);
    try {
      await api.put(`/superadmin/orgs/${editingOrg._id}`, editOrgForm);
      setEditingOrg(null);
      fetchSuperAdminData();
    } catch (err) {
      alert(err?.message || 'Failed to update organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!permissionsOrg) return;
    setActionLoading(`perm_${permissionsOrg._id}`);
    try {
      await api.put(`/superadmin/orgs/${permissionsOrg._id}/permissions`, {
        allowedModules: selectedModules,
      });
      setPermissionsOrg(null);
      fetchSuperAdminData();
    } catch (err) {
      alert(err?.message || 'Failed to save organization permissions');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrg = async (id, orgName) => {
    if (!window.confirm(`⚠️ Are you sure you want to PERMANENTLY DELETE organization "${orgName}"? All its users, data, and settings will be deleted!`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/superadmin/orgs/${id}`);
      fetchSuperAdminData();
    } catch (err) {
      alert(err?.message || 'Failed to delete organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleOrgStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    if (!window.confirm(`Are you sure you want to change organization status to ${newStatus}?`)) return;
    try {
      await api.put(`/superadmin/orgs/${id}/status`, { status: newStatus });
      fetchSuperAdminData();
    } catch (err) {
      alert(err?.message || 'Failed to update org status');
    }
  };

  const openEditOrgModal = (o) => {
    setEditingOrg(o);
    setEditOrgForm({
      name: o.name || '',
      planType: o.planType || 'Growth Plan',
      maxUsers: o.maxUsers || 25,
      status: o.status || 'Active',
      phone: o.phone || '',
      businessEmail: o.businessEmail || '',
    });
  };

  const openPermissionsModal = (o) => {
    setPermissionsOrg(o);
    setSelectedModules(Array.isArray(o.allowedModules) && o.allowedModules.length ? o.allowedModules : ALL_SYSTEM_MODULES.map(m => m.id));
  };

  const toggleModuleSelection = (moduleId) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter(m => m !== moduleId));
    } else {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  const toggleSelectAllModules = () => {
    if (selectedModules.length === ALL_SYSTEM_MODULES.length) {
      setSelectedModules(['dashboard']); // Keep dashboard minimum
    } else {
      setSelectedModules(ALL_SYSTEM_MODULES.map(m => m.id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8 space-y-6">
      {/* Super Admin Top Header (White & Orange Theme) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-orange-500/20">
            <Icon icon="mdi:shield-crown" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">Juice ERP — Super Admin Portal</h1>
              <span className="bg-orange-100 border border-orange-200 text-orange-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Multi-Tenant Master
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Manage SaaS Organizations, Module Access Permissions & Tenant Isolation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddOrgModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:domain-plus" className="text-base" /> Add Organization
          </button>
          <button
            onClick={fetchSuperAdminData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <Icon icon="mdi:refresh" className="text-base text-slate-600" /> Refresh
          </button>
          <button
            onClick={onLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="mdi:logout" className="text-base" /> Logout Super Admin
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block">Total Registered Orgs</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalOrgs || 0}</div>
          <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1 font-bold">
            <Icon icon="mdi:domain" /> Active: {stats.activeOrgs || 0}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block">Pending Approvals</span>
          <div className="text-2xl font-extrabold font-mono text-orange-600">{stats.pendingRequests || 0}</div>
          <span className="text-[10px] text-slate-400">Awaiting Super Admin decision</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block">Total Tenant Users</span>
          <div className="text-2xl font-extrabold font-mono text-blue-600">{stats.totalUsers || 0}</div>
          <span className="text-[10px] text-slate-400">Across all organizations</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block">System Access Security</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">Strict Isolated</div>
          <span className="text-[10px] text-slate-400">Org-level module permission control</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'requests' ? 'border-orange-500 text-orange-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icon icon="mdi:account-clock-outline" className="text-lg" />
          Onboarding Requests
          {stats.pendingRequests > 0 && (
            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-xs">
              {stats.pendingRequests}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orgs')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orgs' ? 'border-orange-500 text-orange-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icon icon="mdi:domain" className="text-lg" />
          All Organizations ({orgs.length})
        </button>
      </div>

      {/* TAB 1: Organization Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs space-y-2 shadow-xs">
              <Icon icon="mdi:check-all" className="text-4xl text-emerald-500 mx-auto" />
              <p className="font-bold text-sm text-slate-800">No Pending Requests</p>
              <p>There are no new organization demo or plan registration requests in queue.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[850px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Company & Industry</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Requested Plan</th>
                      <th className="p-4">Submitted Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Approve / Reject Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 text-sm block">{r.companyName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{r.industry}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-800 block">{r.contactPerson}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{r.businessEmail} • {r.phone}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            r.requestType === 'Free Demo' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {r.selectedPlan}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {r.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openApprovalModal(r)}
                                disabled={actionLoading === r._id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <Icon icon="mdi:check" className="text-sm" />
                                Approve Demo / Plan
                              </button>
                              <button
                                onClick={() => setRejectingReq(r)}
                                disabled={actionLoading === r._id}
                                className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Icon icon="mdi:close" className="text-sm" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold italic">Reviewed by {r.reviewedBy || 'SuperAdmin'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Organizations List */}
      {activeTab === 'orgs' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[950px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Organization Name</th>
                  <th className="p-4">Admin Email</th>
                  <th className="p-4">Plan Type</th>
                  <th className="p-4">Enabled Modules</th>
                  <th className="p-4">Active Users</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Super Admin Control & Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgs.map((o) => {
                  const allowedCount = Array.isArray(o.allowedModules) ? o.allowedModules.length : ALL_SYSTEM_MODULES.length;
                  return (
                    <tr key={o._id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 text-sm block">{o.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">Slug: {o.slug}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-700">{o.adminEmail || o.businessEmail}</td>
                      <td className="p-4">
                        <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          {o.planType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                          {allowedCount} / {ALL_SYSTEM_MODULES.length} Modules
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">{o.activeUsersCount || 0} / {o.maxUsers} Users</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          o.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {onSelectOrgForInspection && (
                            <button
                              onClick={() => onSelectOrgForInspection(o)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Inspect Live Tenant Data"
                            >
                              <Icon icon="mdi:eye-outline" className="text-sm" /> Inspect
                            </button>
                          )}
                          <button
                            onClick={() => openPermissionsModal(o)}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Assign Modules & Permissions"
                          >
                            <Icon icon="mdi:shield-lock-outline" className="text-sm" /> Permissions
                          </button>
                          <button
                            onClick={() => openEditOrgModal(o)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer border border-slate-200"
                            title="Edit Details"
                          >
                            <Icon icon="mdi:pencil-outline" className="text-sm" /> Edit
                          </button>
                          <button
                            onClick={() => openChangePasswordModal(o)}
                            className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer"
                            title="Change Admin Password"
                          >
                            <Icon icon="mdi:key-outline" className="text-sm" /> Change
                          </button>
                          <button
                            onClick={() => handleToggleOrgStatus(o._id, o.status)}
                            className={`font-bold text-[11px] px-2 py-1 rounded-xl cursor-pointer ${
                              o.status === 'Active' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {o.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteOrg(o._id, o.name)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] p-1.5 rounded-xl cursor-pointer shadow-xs"
                            title="Delete Organization"
                          >
                            <Icon icon="mdi:trash-can-outline" className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE PERMISSIONS & ACCESS ASSIGNMENT MODAL */}
      {permissionsOrg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <form onSubmit={handleSavePermissions} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-2xl w-full space-y-5 text-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                  Super Admin Governance
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1 flex items-center gap-2">
                  <Icon icon="mdi:shield-lock-outline" className="text-orange-500 text-xl" />
                  Assign Module Permissions: {permissionsOrg.name}
                </h3>
              </div>
              <button type="button" onClick={() => setPermissionsOrg(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs">
              <span className="text-slate-600 font-semibold">
                Currently Enabled: <strong className="text-orange-600 font-mono">{selectedModules.length}</strong> of {ALL_SYSTEM_MODULES.length} modules
              </span>
              <button
                type="button"
                onClick={toggleSelectAllModules}
                className="text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
              >
                {selectedModules.length === ALL_SYSTEM_MODULES.length ? 'Deselect Non-Core' : 'Select All Modules'}
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {ALL_SYSTEM_MODULES.map((m) => {
                const checked = selectedModules.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      checked ? 'bg-orange-50/60 border-orange-300 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModuleSelection(m.id)}
                        className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="truncate">{m.label}</span>
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-slate-200/60 px-2 py-0.5 rounded text-slate-600 shrink-0">
                      {m.category}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setPermissionsOrg(null)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === `perm_${permissionsOrg._id}`}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Icon icon="mdi:content-save-outline" className="text-base" />
                {actionLoading === `perm_${permissionsOrg._id}` ? 'Saving Permissions...' : 'Save Assigned Permissions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE NEW ORG MODAL */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
          <form onSubmit={handleCreateOrg} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-lg w-full space-y-4 text-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-900">
                <Icon icon="mdi:domain-plus" className="text-orange-500 text-xl" /> Create New Organization
              </h3>
              <button type="button" onClick={() => setShowAddOrgModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-700 font-bold block mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={newOrgForm.name}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                  placeholder="e.g. Apex Fruit Bottling Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Business Admin Email *</label>
                <input
                  type="email"
                  required
                  value={newOrgForm.businessEmail}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, businessEmail: e.target.value })}
                  placeholder="admin@apexfruit.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newOrgForm.phone}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">SaaS Plan</label>
                <select
                  value={newOrgForm.planType}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, planType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
                >
                  <option value="Free Demo">Free Demo (14 Days)</option>
                  <option value="Growth Plan">Growth Plan (₹4,999/mo)</option>
                  <option value="Enterprise Unlimited">Enterprise Unlimited (₹14,999/mo)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Max Active Users Limit</label>
                <input
                  type="number"
                  value={newOrgForm.maxUsers}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, maxUsers: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Org Admin Name</label>
                <input
                  type="text"
                  value={newOrgForm.adminName}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, adminName: e.target.value })}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Admin Password *</label>
                <div className="relative">
                  <input
                    type={showNewOrgPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newOrgForm.adminPassword}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, adminPassword: e.target.value })}
                    placeholder="Enter an admin password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-slate-900 outline-none focus:border-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewOrgPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center px-1.5 text-slate-400 hover:text-slate-700"
                    title={showNewOrgPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon icon={showNewOrgPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            {createOrgError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2">
                {createOrgError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => {
                setShowAddOrgModal(false);
                setCreateOrgError('');
              }} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === 'create_org'}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === 'create_org' ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT ORG MODAL */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdateOrg} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-900">
                <Icon icon="mdi:pencil" className="text-orange-500 text-xl" /> Edit Organization ({editingOrg.name})
              </h3>
              <button type="button" onClick={() => setEditingOrg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editOrgForm.name}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Plan Type</label>
                <select
                  value={editOrgForm.planType}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, planType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
                >
                  <option value="Free Demo">Free Demo</option>
                  <option value="Growth Plan">Growth Plan</option>
                  <option value="Enterprise Unlimited">Enterprise Unlimited</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Max Users Limit</label>
                <input
                  type="number"
                  value={editOrgForm.maxUsers}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, maxUsers: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Status</label>
                <select
                  value={editOrgForm.status}
                  onChange={(e) => setEditOrgForm({ ...editOrgForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Demo Expired">Demo Expired</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setEditingOrg(null)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
                Cancel
              </button>
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-md cursor-pointer">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approval Credentials Modal */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <form onSubmit={handleApprove} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-900">
                <Icon icon="mdi:shield-check-outline" className="text-emerald-500 text-xl" /> Approve {approvingReq.companyName}
              </h3>
              <button type="button" onClick={() => setApprovingReq(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-500">Choose the organization admin email and password before provisioning the tenant.</p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Admin Email *</label>
              <input
                type="email"
                required
                value={approvalForm.adminEmail}
                onChange={(e) => setApprovalForm({ ...approvalForm, adminEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Admin Password *</label>
              <div className="relative">
                <input
                  type={showApprovalPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={approvalForm.adminPassword}
                  onChange={(e) => setApprovalForm({ ...approvalForm, adminPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-slate-900 outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApprovalPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center px-1.5 text-slate-400 hover:text-slate-700"
                >
                  <Icon icon={showApprovalPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className="text-lg" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setApprovingReq(null)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === approvingReq._id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading === approvingReq._id ? 'Approving...' : 'Approve Organization'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <form onSubmit={handleReject} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 text-slate-800 shadow-2xl">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-rose-600">
              <Icon icon="mdi:close-circle-outline" className="text-xl" /> Reject Organization Request
            </h3>
            <p className="text-xs text-slate-500">Provide a reason for rejecting the request for <strong>{rejectingReq.companyName}</strong>.</p>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid business details or unverified contact information."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-rose-500 text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectingReq(null)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
                Cancel
              </button>
              <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-md">
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approval Success Modal */}
      {approvedResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-emerald-200 p-6 rounded-3xl max-w-md w-full space-y-4 text-slate-800 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center text-2xl mx-auto">
              <Icon icon="mdi:check-circle-outline" />
            </div>
            <h3 className="font-extrabold text-base text-center text-slate-900">Organization Approved & Provisioned!</h3>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs font-mono">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Provisioned Admin Credentials:</div>
              <div>Organization: <strong className="text-emerald-700">{approvedResult.organization?.name}</strong></div>
              <div>Login Email: <strong className="text-slate-900">{approvedResult.adminCredentials?.email}</strong></div>
              <div>Chosen Password: <strong className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">{approvedResult.adminCredentials?.password}</strong></div>
            </div>
            <button
              onClick={() => setApprovedResult(null)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Result Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-900">
                <Icon icon="mdi:key-change" className="text-amber-500 text-xl" /> Change Org Admin Password
              </h3>
              <button type="button" onClick={() => setShowChangePasswordModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="text-xs text-slate-500">Enter a new password for the org admin and click save.</div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Password *</label>
              <div className="relative">
                <input
                  type={showChangePasswordValue ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={changePasswordValue}
                  onChange={(e) => setChangePasswordValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-slate-900 outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowChangePasswordValue((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center px-1.5 text-slate-400 hover:text-slate-700"
                >
                  <Icon icon={showChangePasswordValue ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className="text-lg" />
                </button>
              </div>
            </div>

            {changePasswordError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2">
                {changePasswordError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowChangePasswordModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">Cancel</button>
              <button
                type="submit"
                disabled={actionLoading === `change_pass_${changePasswordOrg?._id}`}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === `change_pass_${changePasswordOrg?._id}` ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
