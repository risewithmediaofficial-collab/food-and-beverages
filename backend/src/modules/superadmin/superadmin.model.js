import mongoose from 'mongoose';

const orgRequestSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  businessEmail: { type: String, required: true },
  phone: { type: String, required: true },
  contactPerson: { type: String, required: true },
  industry: { type: String, default: 'Beverage & Juice Processing' },
  requestType: { type: String, default: 'Free Demo' },
  selectedPlan: { type: String, default: 'Free Demo (14 Days)' },
  paymentStatus: { type: String, default: 'Demo Access' },
  address: String,
  city: String,
  state: String,
  country: { type: String, default: 'India' },
  gstin: String,
  pan: String,
  companySize: { type: String, default: '1-50' },
  website: String,
  modulesRequested: [{ type: String }],
  notes: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  rejectionReason: String,
  reviewedAt: Date,
  reviewedBy: String,
}, { timestamps: true });

export const ALL_DEFAULT_MODULES = [
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
    default: 'Growth Plan',
  },
  status: { type: String, enum: ['Active', 'Suspended', 'Demo Expired'], default: 'Active' },
  maxUsers: { type: Number, default: 25 },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  allowedModules: {
    type: [{ type: String }],
    default: ALL_DEFAULT_MODULES,
  },
  logoUrl: String,
  fssaiLicenseNo: String,
  gstin: String,
  pan: String,
}, { timestamps: true });

export const OrgRequest = mongoose.models.OrgRequest || mongoose.model('OrgRequest', orgRequestSchema);
export const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
