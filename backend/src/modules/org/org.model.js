import mongoose from 'mongoose';

const orgProfileSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  enterpriseName: { type: String, default: 'Sunrise Beverages & Juices Private Limited' },
  hqAddress: { type: String, default: 'Plot 42, MIDC Industrial Area, Ambad, Nashik, Maharashtra - 422010' },
  gstin: { type: String, default: '27AABCS1234F1Z9' },
  pan: { type: String, default: 'AABCS1234F' },
  fssaiLicense: { type: String, default: '11521034000189' },
  connectedPlants: { type: String, default: '2 Facilities (Nashik Facility #1, Pune Facility #2)' },
  currency: { type: String, default: 'Indian Rupee (INR - ₹)' },
}, { timestamps: true });

const factorySchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  plantCode: { type: String, required: true },
  name: { type: String, required: true },
  code: { type: String },
  location: String,
  address: String,
  linesCount: { type: Number, default: 1 },
  capacityPerDay: { type: String, default: '50,000 Liters' },
  plantManager: String,
  status: { type: String, default: 'Operating' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const departmentSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  deptCode: { type: String, required: true },
  name: { type: String, required: true },
  code: String,
  costCenter: String,
  headName: String,
  staffCount: { type: Number, default: 5 },
  budget: { type: Number, default: 1000000 },
  status: { type: String, default: 'Active' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const warehouseSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  name: { type: String, required: true },
  type: { type: String, default: 'raw_materials' },
  racks: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  timestamp: { type: String, default: () => new Date().toISOString().replace('T', ' ').substring(0, 19) },
  user: { type: String, required: true },
  ipAddress: { type: String, default: '192.168.1.1' },
  action: { type: String, required: true },
  module: { type: String, required: true },
  details: { type: String, required: true },
  severity: { type: String, default: 'INFO' },
}, { timestamps: true });

export const OrgProfile = mongoose.models.OrgProfile || mongoose.model('OrgProfile', orgProfileSchema);
export const Factory = mongoose.models.Factory || mongoose.model('Factory', factorySchema);
export const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);
export const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
