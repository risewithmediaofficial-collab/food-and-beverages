import { useState } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../lib/api';

const PLANS = [
  {
    id: 'Free Demo (14 Days)',
    type: 'Free Demo',
    title: '14-Day Free Demo',
    price: 'Free',
    badge: '14 Days Access',
    color: 'border-blue-200 bg-blue-50/50 text-blue-700',
    icon: 'mdi:gift-outline',
    features: ['Up to 5 Users', 'Inventory & Warehouse Master', 'Production & Batch Tracking', 'Full Demo Access'],
  },
  {
    id: 'Growth Plan (₹4,999/mo)',
    type: 'Paid Plan',
    title: 'Growth / Pro Plan',
    price: '₹4,999 / mo',
    badge: 'Most Popular',
    color: 'border-orange-500 bg-orange-50/70 text-orange-800 shadow-md',
    icon: 'mdi:rocket-launch-outline',
    features: ['Up to 25 Users', 'Multi-Warehouse & RFID', 'Full CRM, Sales & Invoicing', 'Standard Support'],
  },
  {
    id: 'Enterprise Unlimited (₹14,999/mo)',
    type: 'Paid Plan',
    title: 'Enterprise Unlimited',
    price: '₹14,999 / mo',
    badge: 'Full Suite',
    color: 'border-purple-200 bg-purple-50/50 text-purple-700',
    icon: 'mdi:crown-outline',
    features: ['Unlimited Users & Plants', 'Multi-Facility & AI Analytics', 'Dedicated Account Manager', '24/7 Priority Support'],
  },
];

export default function PlanRequestModal({ initialPlanId, onClose, onSuccess }) {
  const startingPlan = PLANS.find((plan) => plan.id === initialPlanId) || PLANS[0];
  const [selectedPlan, setSelectedPlan] = useState(startingPlan);
  const [formData, setFormData] = useState({
    companyName: '',
    businessEmail: '',
    phone: '',
    contactPerson: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    gstin: '',
    pan: '',
    companySize: '1-50',
    website: '',
    industry: 'Beverage & Juice Processing',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/public/request-access', {
        ...formData,
        requestType: selectedPlan.type,
        selectedPlan: selectedPlan.id,
      });

      if (onSuccess) {
        onSuccess(res.message || 'Request submitted successfully!');
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full inline-flex">
              SaaS Multi-Tenant Onboarding
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-3 sm:mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <Icon icon="mdi:domain" className="text-orange-500 text-2xl" />
              <span>Request Juice ERP Access / Free Demo</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-2 max-w-2xl">Select a plan and submit your company details for Super Admin approval.</p>
          </div>
          <button onClick={onClose} className="self-start text-slate-400 hover:text-slate-600 text-xl font-bold p-1">✕</button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="text-base shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Plan Cards Selection */}
        <div>
          <label className="text-xs font-extrabold text-slate-700 block mb-2">1. Choose Request Type / Plan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all min-h-[220px] ${
                  selectedPlan.id === plan.id ? `${plan.color} ring-2 ring-orange-400` : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon icon={plan.icon} className="text-xl" />
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/80 border border-current">
                    {plan.badge}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 mt-2">{plan.title}</h4>
                <div className="text-base font-extrabold font-mono mt-0.5 text-slate-800">{plan.price}</div>
                <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Icon icon="mdi:check-circle" className="text-emerald-500 text-xs shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-xs font-extrabold text-slate-700 block">2. Organization & Contact Information</label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Company / Organization Name *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. FreshPure Juices Pvt Ltd"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Business Email Address *</label>
              <input
                type="email"
                required
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                placeholder="e.g. contact@freshpure.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Rajesh Mehta (General Manager)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Industry / Facility Type</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Fruit Juice Processing, Cold Press Bottling, Dairy & Beverages"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Company Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Plot / Street / Area"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Nashik"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Maharashtra"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="27ABCDE1234F1Z5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">PAN</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                placeholder="ABCDE1234F"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Company Size</label>
              <select
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              >
                <option value="1-50">1-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <Icon icon="mdi:information-outline" className="text-base text-amber-600 shrink-0" />
            <span>Note: Submitted requests are reviewed by Super Admin. Upon approval, your default Admin account & login credentials will be activated.</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Submitting Request...' : 'Submit Request for Approval'}
              <Icon icon="mdi:arrow-right" className="text-base" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
