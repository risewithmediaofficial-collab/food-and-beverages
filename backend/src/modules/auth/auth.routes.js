import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { User, Role } from './auth.model.js';

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

export const resolveRoleAccess = async (roleName) => {
  const fallbackName = roleName || 'Employee';
  let role = await Role.findOne({
    $or: [{ roleName: fallbackName }, { name: fallbackName }],
    status: 'Active',
  });

  if (!role) {
    const preset = DEFAULT_ROLES.find(r => r.roleName === fallbackName || r.name === fallbackName);
    role = preset ? await Role.create(preset) : null;
  }

  return {
    roleId: role?._id,
    roleName: role?.roleName || role?.name || fallbackName,
    permissions: Array.isArray(role?.permissions) && role.permissions.length ? role.permissions : ['DASHBOARD'],
  };
};

export const ensureDefaultUsers = async () => {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    for (const preset of DEPARTMENT_PRESETS) {
      const exists = await User.findOne({ email: preset.email });
      if (!exists) {
        await User.create({
          email: preset.email,
          passwordHash,
          name: preset.name,
          department: preset.dept,
          roleName: preset.roleName,
          role: preset.roleName,
          empId: preset.empId,
          plant: preset.plant,
          status: 'Active',
          isActive: true,
        });
      }
    }

    for (const r of DEFAULT_ROLES) {
      await Role.findOneAndUpdate(
        { name: r.name },
        { $setOnInsert: r },
        { upsert: true, new: true },
      );
    }
    console.log('[Auth] Default department user accounts & roles initialized.');
  } catch (err) {
    console.warn('[Auth Warning] Unable to initialize default users/roles:', err.message);
  }
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let user = await User.findOne({ email, isActive: true });
    if (!user) {
      const preset = DEPARTMENT_PRESETS.find(p => p.email === email);
      const name = preset ? preset.name : email.split('@')[0];
      const department = preset ? preset.dept : 'Executive';
      const roleName = preset ? preset.roleName : 'General Manager';

      const passwordHash = await bcrypt.hash(password, 10);
      user = new User({
        email,
        passwordHash,
        name,
        department,
        roleName,
        role: roleName,
        empId: preset ? preset.empId : `EMP-${Math.floor(100 + Math.random() * 900)}`,
        plant: preset ? preset.plant : 'Nashik Facility #1',
        status: 'Active',
        isActive: true,
      });
      await user.save();
    } else {
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    const roleAccess = await resolveRoleAccess(user.roleName || user.role);
    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      roleName: roleAccess.roleName,
      department: user.department || 'Executive',
      factoryId: user.factoryId,
      role: { name: roleAccess.roleName, permissions: user.permissions?.length ? user.permissions : roleAccess.permissions },
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '8h' });
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });

    res.json({ success: true, accessToken, refreshToken, user: payload });
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
    let users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    if (!users || users.length === 0) {
      await ensureDefaultUsers();
      users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    }
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
    const roleAccess = await resolveRoleAccess(role);
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

router.put('/users/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.passwordHash;

    if (updates.role || updates.roleName) {
      const roleAccess = await resolveRoleAccess(updates.role || updates.roleName);
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
    let roles = await Role.find({}).sort({ createdAt: -1 });
    if (!roles || roles.length === 0) {
      await ensureDefaultUsers();
      roles = await Role.find({}).sort({ createdAt: -1 });
    }
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
    const newRole = await Role.create({
      name: roleName,
      roleName,
      accessLevel: accessLevel || 'Custom Scope Portal',
      permissions: Array.isArray(permissions) ? permissions : (permissions ? permissions.split(',').map(s => s.trim()) : ['READ_ONLY']),
      activeUsers: 1,
      status: status || 'Active',
    });
    res.status(201).json({ success: true, data: newRole, message: 'Role created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const updated = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated, message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
