import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { User, Role } from './auth.model.js';
import { Organization } from '../superadmin/superadmin.model.js';
import { canTenantLogin } from '../superadmin/superadmin.helpers.js';

const router = express.Router();

export const DEPARTMENT_PRESETS = [
  { email: 'admin@juice-erp.com', name: 'Vikram Sharma', dept: 'Executive', roleName: 'General Manager', empId: 'EMP-101', plant: 'Nashik Facility #1' },
  { email: 'sales@juice-erp.com', name: 'Rohan Gupta', dept: 'Sales & CRM', roleName: 'Sales Lead', empId: 'EMP-102', plant: 'Nashik Facility #1' },
  { email: 'production@juice-erp.com', name: 'Naveen Kumar', dept: 'Plant Operations', roleName: 'Plant Supervisor', empId: 'EMP-103', plant: 'Nashik Facility #1' },
  { email: 'operator@juice-erp.com', name: 'Sunil Rao', dept: 'Machine Operations', roleName: 'Line Operator', empId: 'EMP-104', plant: 'Nashik Facility #1' },
  { email: 'quality@juice-erp.com', name: 'Meera Nair', dept: 'QC Lab', roleName: 'Quality Inspector', empId: 'EMP-105', plant: 'Nashik Facility #1' },
];

export const DEFAULT_ROLES = [
  { name: 'General Manager', roleName: 'General Manager', accessLevel: 'Full System Superadmin', permissions: ['*', 'ALL_MODULES_FULL_ACCESS'], activeUsers: 1, status: 'Active' },
  { name: 'Sales Lead', roleName: 'Sales Lead', accessLevel: 'Sales & CRM Portal', permissions: ['DASHBOARD', 'CRM', 'SALES', 'CUSTOMERS', 'LEADS', 'INVOICES', 'REPORTS'], activeUsers: 2, status: 'Active' },
  { name: 'Plant Supervisor', roleName: 'Plant Supervisor', accessLevel: 'Production & Planning Portal', permissions: ['DASHBOARD', 'PRODUCTION', 'BATCHES', 'RECIPES', 'PLANNING', 'MACHINE', 'QUALITY'], activeUsers: 3, status: 'Active' },
  { name: 'Line Operator', roleName: 'Line Operator', accessLevel: 'Machine Operations Portal', permissions: ['DASHBOARD', 'MACHINE', 'MACHINE_OPERATION', 'PRODUCTION'], activeUsers: 5, status: 'Active' },
  { name: 'Quality Inspector', roleName: 'Quality Inspector', accessLevel: 'QA Lab & Testing Portal', permissions: ['DASHBOARD', 'QUALITY', 'LABORATORY', 'PACKAGING', 'BATCHES'], activeUsers: 2, status: 'Active' },
  { name: 'Accounts Specialist', roleName: 'Accounts Specialist', accessLevel: 'Finance & Billing Portal', permissions: ['DASHBOARD', 'FINANCE', 'SALES', 'INVOICES', 'PAYMENTS', 'REPORTS'], activeUsers: 1, status: 'Active' },
  { name: 'Inventory Manager', roleName: 'Inventory Manager', accessLevel: 'Inventory & Warehouse Portal', permissions: ['DASHBOARD', 'INVENTORY', 'WAREHOUSE', 'PURCHASE', 'SUPPLIERS', 'DISPATCH'], activeUsers: 1, status: 'Active' },
  { name: 'HR Manager', roleName: 'HR Manager', accessLevel: 'HR & Employee Portal', permissions: ['DASHBOARD', 'EMPLOYEES', 'ATTENDANCE', 'SHIFTS', 'LEAVES', 'PAYROLL'], activeUsers: 1, status: 'Active' },
  { name: 'Employee', roleName: 'Employee', accessLevel: 'Employee Self Service Portal', permissions: ['DASHBOARD', 'ATTENDANCE', 'LEAVES'], activeUsers: 1, status: 'Active' },
];

const withMandatoryPermissions = (permissions = []) => {
  const normalized = new Set(
    permissions.map((permission) => String(permission).trim().toUpperCase()).filter(Boolean),
  );
  normalized.add('DASHBOARD');
  normalized.add('ATTENDANCE');
  return Array.from(normalized);
};

const parsePermissions = (permissions) => {
  if (Array.isArray(permissions)) return permissions;
  if (typeof permissions === 'string') {
    return permissions.split(',').map((permission) => permission.trim()).filter(Boolean);
  }
  return [];
};

export const resolveRoleAccess = async (roleName, orgId = null) => {
  const fallbackName = roleName || 'Employee';
  // Prefer org-specific role when orgId provided
  let role = null;
  if (orgId) {
    role = await Role.findOne({
      $or: [{ roleName: fallbackName }, { name: fallbackName }],
      status: 'Active',
      orgId,
    });
  }

  // Fallback to global role
  if (!role) {
    role = await Role.findOne({
      $or: [{ roleName: fallbackName }, { name: fallbackName }],
      status: 'Active',
      $or: [{ orgId: { $exists: false } }, { orgId: null }],
    });
  }

  // If still not found, use default presets (global)
  if (!role) {
    const preset = DEFAULT_ROLES.find(r => r.roleName === fallbackName || r.name === fallbackName);
    role = preset ? await Role.create(preset) : null;
  }

  return {
    roleId: role?._id,
    roleName: role?.roleName || role?.name || fallbackName,
    permissions: withMandatoryPermissions(
      Array.isArray(role?.permissions) && role.permissions.length ? role.permissions : ['DASHBOARD'],
    ),
  };
};

export const ensureDefaultUsers = async () => {
  // Auto-seeding of default users/roles disabled. Manual creation is required by Org Admins.
  // This function is retained as a placeholder but will not modify the database.
  console.log('[Auth] ensureDefaultUsers() called — auto-seeding is disabled. No changes made.');
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail, isActive: true });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    } else {
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    const roleAccess = await resolveRoleAccess(user.roleName || user.role, user.orgId);
    let orgAllowedModules = null;
    let orgName = null;

    if (user.orgId) {
      const userOrg = await Organization.findById(user.orgId);
      if (userOrg) {
        orgAllowedModules = userOrg.allowedModules;
        orgName = userOrg.name;
        if (!canTenantLogin(userOrg, user)) {
          return res.status(403).json({ success: false, message: 'This organization account is suspended or inactive. Please contact the super admin.' });
        }
      }
    }

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      orgId: user.orgId ? user.orgId.toString() : null,
      orgName: orgName || user.plant || 'Organization',
      orgAllowedModules,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      isOrgAdmin: Boolean(user.isOrgAdmin),
      roleName: roleAccess.roleName,
      department: user.department || 'Executive',
      factoryId: user.factoryId,
      role: { name: roleAccess.roleName, permissions: withMandatoryPermissions(user.permissions?.length ? user.permissions : roleAccess.permissions) },
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '8h' });
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });

    res.json({ success: true, accessToken, refreshToken, user: payload });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Account already exists.' });
    }

    // Public self-register uses global Employee role
    const roleAccess = await resolveRoleAccess('Employee');
    const passwordHash = await bcrypt.hash(password, 10);
    const count = await User.countDocuments();
    const newUser = await User.create({
      empId: `EMP-${101 + count}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      roleId: roleAccess.roleId,
      roleName: roleAccess.roleName,
      role: roleAccess.roleName,
      permissions: roleAccess.permissions,
      department: 'Employee Self Service',
      plant: 'Nashik Facility #1',
      status: 'Active',
      isActive: true,
    });

    const safeUser = newUser.toObject();
    delete safeUser.passwordHash;
    res.status(201).json({ success: true, data: safeUser, message: 'Account created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  res.json({ success: true, user: req.user });
});

// Users Management APIs
router.get('/users', async (req, res) => {
  try {
    const query = {};
    // If requester is in an org and not super admin, show users for that org only
    if (req.user && req.user.orgId && !req.user.isSuperAdmin) {
      query.orgId = req.user.orgId;
      query.isSuperAdmin = { $ne: true };
    }
    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, role, department, plant, empId, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required for new user accounts.' });
    }
    // Only org admins or superadmins may create users via this endpoint
    if (!req.user || !(req.user.isOrgAdmin || req.user.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to create users.' });
    }
    const orgId = req.user?.orgId || null;
    const roleAccess = await resolveRoleAccess(role, orgId);
    const passwordHash = await bcrypt.hash(password, 10);
    const count = await User.countDocuments();
    const newUser = await User.create({
      empId: empId || `EMP-${101 + count}`,
      name,
      email,
      passwordHash,
      roleId: roleAccess.roleId,
      roleName: roleAccess.roleName,
      role: roleAccess.roleName,
      permissions: roleAccess.permissions,
      orgId,
      department: department || 'Executive',
      plant: plant || 'Nashik Facility #1',
      status: 'Active',
      isActive: true,
    });
    const safeUser = newUser.toObject();
    delete safeUser.passwordHash;
    res.status(201).json({ success: true, data: safeUser, message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/password/change', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, old password, and new password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, isActive: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found or inactive.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/password/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, isActive: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No active account was found for that email.' });
    }

    res.json({
      success: true,
      message: 'Password reset requested. Please contact your administrator to approve a new password.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.passwordHash;

    if (updates.role || updates.roleName) {
      const roleAccess = await resolveRoleAccess(updates.role || updates.roleName, req.user?.orgId || null);
      updates.roleId = roleAccess.roleId;
      updates.roleName = roleAccess.roleName;
      updates.role = roleAccess.roleName;
      updates.permissions = roleAccess.permissions;
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-passwordHash');
    res.json({ success: true, data: updated, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Roles Management APIs
router.get('/roles', async (req, res) => {
  try {
    const query = {};
    if (req.user && req.user.orgId) {
      query.$or = [{ orgId: req.user.orgId }, { orgId: { $exists: false } }, { orgId: null }];
    }
    const roles = await Role.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/roles', async (req, res) => {
  try {
    const { roleName, accessLevel, permissions, status } = req.body;
    if (!roleName) {
      return res.status(400).json({ success: false, message: 'Role title is required.' });
    }
    // Only org admins or superadmins may create roles
    if (!req.user || !(req.user.isOrgAdmin || req.user.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to create roles.' });
    }
    const newRole = await Role.create({
      name: roleName,
      roleName,
      accessLevel: accessLevel || 'Custom Scope Portal',
      permissions: withMandatoryPermissions(parsePermissions(permissions).length ? parsePermissions(permissions) : ['READ_ONLY']),
      activeUsers: 1,
      status: status || 'Active',
      orgId: req.user?.orgId || null,
    });
    res.status(201).json({ success: true, data: newRole, message: 'Role created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updates, 'permissions')) {
      updates.permissions = withMandatoryPermissions(parsePermissions(updates.permissions));
    }
    // Only org admins or superadmins may update roles
    if (!req.user || !(req.user.isOrgAdmin || req.user.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to update roles.' });
    }
    const updated = await Role.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, data: updated, message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    if (!req.user || !(req.user.isOrgAdmin || req.user.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to delete roles.' });
    }
    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
