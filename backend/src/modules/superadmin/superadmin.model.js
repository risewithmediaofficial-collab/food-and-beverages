import mongoose from 'mongoose';

const orgRequestSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  businessEmail: { type: String, required: true },
  phone: { type: String, required: true },
  contactPerson: { type: String, required: true },
  industry: { type: String, default: 'Beverage & Juice Processing' },
  requestType: { type: String, enum: ['Free Demo', 'Paid Plan'], default: 'Free Demo' },
  selectedPlan: {
    type: String,
    enum: [
      'Free Demo (14 Days)',
      'Growth Plan (₹4,999/mo)',
      'Enterprise Unlimited (₹14,999/mo)',
    ],
    default: 'Free Demo (14 Days)',
  },
  paymentStatus: {
    type: String,
    enum: ['Demo Access', 'Offline Payment Verified', 'Pending Verification'],
    default: 'Demo Access',
  },
  modulesRequested: [{ type: String }],
  notes: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  rejectionReason: String,
  reviewedAt: Date,
  reviewedBy: String,
}, { timestamps: true });

const ALL_DEFAULT_MODULES = [
  'dashboard', 'crm', 'leads', 'customers', 'sales', 'purchase', 'suppliers', 'rawmaterial',
  'inventory', 'warehouse', 'planning', 'production', 'batches', 'machine', 'machine_operation',
  'maintenance', 'quality', 'laboratory', 'packaging', 'dispatch', 'compliance', 'employees',
  'rfid_attendance', 'shifts', 'leaves', 'payroll', 'finance', 'expense', 'reports', 'documents',
  'notifications', 'settings', 'org', 'users', 'roles', 'factories', 'departments', 'audit', 'help'
];

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  businessEmail: { type: String, required: true },
  phone: String,
  address: String,
  city: String,
  state: String,
  country: { type: String, default: 'India' },
  planType: {
    type: String,
    enum: ['Free Demo', 'Growth Plan', 'Enterprise Unlimited'],
    default: 'Free Demo',
  },
  status: { type: String, enum: ['Active', 'Suspended', 'Demo Expired'], default: 'Active' },
  maxUsers: { type: Number, default: 20 },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  allowedModules: {
    type: [{ type: String }],
    default: ALL_DEFAULT_MODULES,
  },
  logoUrl: String,
  fssaiLicenseNo: String,
  gstin: String,
}, { timestamps: true });

export const OrgRequest = mongoose.models.OrgRequest || mongoose.model('OrgRequest', orgRequestSchema);
export const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
