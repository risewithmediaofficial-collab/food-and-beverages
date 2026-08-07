import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true },
  roleName: { type: String },
  accessLevel: { type: String, default: 'Custom Access' },
  permissions: [{ type: String }],
  description: String,
  activeUsers: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
}, { timestamps: true });

roleSchema.index({ orgId: 1, name: 1 }, { unique: true, partialFilterExpression: { orgId: { $exists: true, $ne: null } } });
roleSchema.index({ orgId: 1, roleName: 1 }, { unique: true, partialFilterExpression: { orgId: { $exists: true, $ne: null } } });

const userSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  isSuperAdmin: { type: Boolean, default: false },
  isOrgAdmin: { type: Boolean, default: false },
  empId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  roleName: String,
  role: String,
  permissions: [String],
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  department: String,
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  plant: String,
  shiftId: String,
  status: { type: String, default: 'Active' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);


