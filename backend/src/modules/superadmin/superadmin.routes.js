import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { OrgRequest, Organization, ALL_DEFAULT_MODULES } from './superadmin.model.js';
import { User, Role } from '../auth/auth.model.js';
import { DEFAULT_ROLES } from '../auth/auth.routes.js';
import { normalizeCompanyRequestInput } from './superadmin.helpers.js';

const router = express.Router();

const SUPER_ADMIN_EMAIL = 'superadmin@juice-erp.com';

// Ensure Super Admin user and a default Organization exist in DB
export const ensureSuperAdmin = async () => {
  try {
    let superAdmin = await User.findOne({ isSuperAdmin: true });
    if (!superAdmin) {
      const passwordHash = await bcrypt.hash('SuperAdmin@2026', 10);
      superAdmin = await User.create({
        name: 'Master Super Admin',
        email: SUPER_ADMIN_EMAIL,
        passwordHash,
        isSuperAdmin: true,
        isOrgAdmin: false,
        roleName: 'Super Admin',
        role: 'Super Admin',
        department: 'Platform Operations',
        status: 'Active',
        isActive: true,
      });
      console.log('✅ Super Admin account initialized: superadmin@juice-erp.com / SuperAdmin@2026');
    }

    // Check if any Organization exists. If not, auto-seed default Organization & Tenant Admins
    const orgCount = await Organization.countDocuments();
    let defaultOrg = await Organization.findOne({ slug: 'freshpure-juices' });
    if (!defaultOrg && orgCount === 0) {
      defaultOrg = await Organization.create({
        name: 'FreshPure Juices Pvt Ltd',
        slug: 'freshpure-juices',
        businessEmail: 'admin@juice-erp.com',
        phone: '+91 98765 43210',
        address: 'Plot 42, Industrial Growth Estate',
        city: 'Nashik',
        state: 'Maharashtra',
        country: 'India',
        planType: 'Enterprise Unlimited',
        status: 'Active',
        maxUsers: 100,
        allowedModules: ALL_DEFAULT_MODULES,
      });
      console.log('✅ Default Organization created: FreshPure Juices Pvt Ltd');
    }

    if (defaultOrg) {
      // Ensure default roles exist for default organization
      for (const r of DEFAULT_ROLES) {
        await Role.findOneAndUpdate(
          { orgId: defaultOrg._id, name: r.name },
          { $setOnInsert: { ...r, orgId: defaultOrg._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // Ensure default users exist for default organization
      const defaultUsersToSeed = [
        { name: 'Rajesh Mehta', email: 'admin@juice-erp.com', pass: 'Admin@2026', role: 'General Manager', isOrgAdmin: true, dept: 'Executive' },
        { name: 'Ananya Sharma', email: 'sales@juice-erp.com', pass: 'Sales@2026', role: 'Sales Lead', isOrgAdmin: false, dept: 'Sales & CRM' },
        { name: 'Vikram Singh', email: 'production@juice-erp.com', pass: 'Prod@2026', role: 'Plant Supervisor', isOrgAdmin: false, dept: 'Production' },
        { name: 'Sunil Rao', email: 'operator@juice-erp.com', pass: 'Oper@2026', role: 'Line Operator', isOrgAdmin: false, dept: 'Operations' },
        { name: 'Pooja Verma', email: 'quality@juice-erp.com', pass: 'Quality@2026', role: 'Quality Inspector', isOrgAdmin: false, dept: 'Quality Assurance' },
      ];

      for (const u of defaultUsersToSeed) {
        const existing = await User.findOne({ email: u.email });
        if (!existing) {
          const passHash = await bcrypt.hash(u.pass, 10);
          const newUser = await User.create({
            orgId: defaultOrg._id,
            name: u.name,
            email: u.email,
            passwordHash: passHash,
            isSuperAdmin: false,
            isOrgAdmin: u.isOrgAdmin,
            roleName: u.role,
            role: u.role,
            department: u.dept,
            plant: 'Nashik Main Facility #1',
            status: 'Active',
            isActive: true,
            permissions: ['DASHBOARD', 'ORG', 'SETTINGS', 'REPORTS', 'ATTENDANCE', 'PRODUCTION', 'QUALITY', 'SALES', 'CRM', 'INVENTORY'],
          });
          if (u.isOrgAdmin && !defaultOrg.adminUserId) {
            defaultOrg.adminUserId = newUser._id;
            await defaultOrg.save();
          }
        }
      }
    }
  } catch (err) {
    console.warn('[SuperAdmin Warning] Could not initialize Super Admin account/default org:', err.message);
  }
};

// Handler for public registration / demo access requests
const handleRequestAccess = async (req, res) => {
  try {
    const normalizedPayload = normalizeCompanyRequestInput(req.body);

    const newRequest = await OrgRequest.create({
      ...normalizedPayload,
      businessEmail: normalizedPayload.businessEmail,
      notes: normalizedPayload.notes || '',
    });

    res.status(201).json({
      success: true,
      data: newRequest,
      message: 'Your organization request has been submitted successfully! Super Admin will review and approve your account shortly.',
    });
  } catch (err) {
    console.error('[Request Access Error]', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Submission failed. Please try again.' });
  }
};

// 1. PUBLIC ROUTES: Submit Demo or Plan Request (support all path variants)
router.post('/request-access', handleRequestAccess);
router.post('/public/request-access', handleRequestAccess);

// 2. SUPER ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalized = String(email).trim().toLowerCase();
    await ensureSuperAdmin();

    const user = await User.findOne({ email: normalized, isSuperAdmin: true });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin credentials.' });
    }

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isSuperAdmin: true,
      roleName: 'Super Admin',
      department: 'Platform Operations',
      role: { name: 'Super Admin', permissions: ['*'] },
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '12h' });

    res.json({ success: true, accessToken, user: payload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET ALL ORGANIZATION REQUESTS (Pending, Approved, Rejected)
router.get('/requests', async (req, res) => {
  try {
    const requests = await OrgRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. APPROVE ORGANIZATION REQUEST
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const { adminEmail, adminPassword } = req.body || {};
    const orgReq = await OrgRequest.findById(req.params.id);
    if (!orgReq) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (orgReq.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Request is already approved.' });
    }

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
    }

    const normalizedAdminEmail = String(adminEmail).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedAdminEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'That admin email is already registered. Please choose another email.' });
    }

    // Generate unique slug
    const baseSlug = (orgReq.companyName || 'org').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const planType = orgReq.selectedPlan?.includes('Enterprise') ? 'Enterprise Unlimited' : orgReq.selectedPlan?.includes('Growth') ? 'Growth Plan' : 'Free Demo';

    // Create Organization First
    const org = await Organization.create({
      name: orgReq.companyName,
      slug,
      businessEmail: normalizedAdminEmail,
      phone: orgReq.phone || '',
      address: orgReq.address || '',
      city: orgReq.city || '',
      state: orgReq.state || '',
      country: orgReq.country || 'India',
      gstin: orgReq.gstin || '',
      planType,
      status: 'Active',
      maxUsers: planType === 'Enterprise Unlimited' ? 100 : planType === 'Growth Plan' ? 25 : 5,
      allowedModules: ALL_DEFAULT_MODULES,
    });

    // Create Org Admin User Account
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    let orgAdmin;
    try {
      orgAdmin = await User.create({
        orgId: org._id,
        name: orgReq.contactPerson || `${orgReq.companyName} Admin`,
        email: normalizedAdminEmail,
        passwordHash,
        isOrgAdmin: true,
        isSuperAdmin: false,
        roleName: 'General Manager',
        role: 'General Manager',
        department: 'Executive',
        plant: `${orgReq.companyName} Main Facility`,
        status: 'Active',
        isActive: true,
        permissions: ['DASHBOARD', 'ORG', 'SETTINGS', 'REPORTS', 'ATTENDANCE', 'PRODUCTION', 'QUALITY', 'SALES', 'CRM', 'INVENTORY'],
      });

      // Update Org Admin reference
      org.adminUserId = orgAdmin._id;
      await org.save();
    } catch (innerErr) {
      await Organization.findByIdAndDelete(org._id).catch(() => null);
      if (innerErr.code === 11000) {
        return res.status(409).json({ success: false, message: 'That admin email already exists. Please choose another email.' });
      }
      throw innerErr;
    }

    // Create default roles for this Org
    for (const r of DEFAULT_ROLES) {
      await Role.findOneAndUpdate(
        { orgId: org._id, name: r.name },
        { $setOnInsert: { ...r, orgId: org._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Update Request status
    orgReq.status = 'Approved';
    orgReq.reviewedAt = new Date();
    orgReq.reviewedBy = req.user?.email || 'superadmin@juice-erp.com';
    await orgReq.save();

    res.json({
      success: true,
      message: `Organization "${org.name}" approved successfully! Default Admin credentials created.`,
      data: {
        organization: org,
        adminCredentials: {
          email: orgAdmin.email,
          password: adminPassword,
        },
      },
    });
  } catch (err) {
    console.error('[Approve Org Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. REJECT ORGANIZATION REQUEST
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const orgReq = await OrgRequest.findById(req.params.id);
    if (!orgReq) return res.status(404).json({ success: false, message: 'Request not found.' });

    orgReq.status = 'Rejected';
    orgReq.rejectionReason = rejectionReason || 'Information verification failed or invalid request details.';
    orgReq.reviewedAt = new Date();
    orgReq.reviewedBy = req.user?.email || 'superadmin@juice-erp.com';
    await orgReq.save();

    res.json({ success: true, data: orgReq, message: 'Organization request rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. LIST ALL ORGANIZATIONS
router.get('/orgs', async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    // Attach active user count per org
    const orgsWithUserCount = await Promise.all(orgs.map(async (o) => {
      const userCount = await User.countDocuments({ orgId: o._id, isActive: true });
      const adminUser = o.adminUserId ? await User.findById(o.adminUserId).select('email name') : null;
      return {
        ...o.toObject(),
        activeUsersCount: userCount,
        adminEmail: adminUser ? adminUser.email : o.businessEmail,
      };
    }));

    res.json({ success: true, data: orgsWithUserCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE ORGANIZATION MANUALLY
router.post('/orgs', async (req, res) => {
  try {
    const { name, businessEmail, phone, planType, maxUsers, adminName, adminPassword } = req.body;
    if (!name || !businessEmail) {
      return res.status(400).json({ success: false, message: 'Company Name and Business Email are required.' });
    }

    if (!adminPassword) {
      return res.status(400).json({ success: false, message: 'Admin password is required for new organizations.' });
    }

    const normalizedEmail = String(businessEmail).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'That business admin email is already registered. Please choose a different email.' });
    }

    const existingOrg = await Organization.findOne({ businessEmail: normalizedEmail });
    if (existingOrg) {
      return res.status(409).json({ success: false, message: 'An organization already exists with that business email.' });
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    let org = null;
    try {
      org = await Organization.create({
        name,
        slug,
        businessEmail: normalizedEmail,
        phone: phone || '',
        planType: planType || 'Growth Plan',
        status: 'Active',
        maxUsers: maxUsers ? Number(maxUsers) : 25,
        allowedModules: ALL_DEFAULT_MODULES,
      });

      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const orgAdmin = await User.create({
        orgId: org._id,
        name: adminName || `${name} Admin`,
        email: normalizedEmail,
        passwordHash,
        isOrgAdmin: true,
        isSuperAdmin: false,
        roleName: 'General Manager',
        role: 'General Manager',
        department: 'Executive',
        plant: `${name} Main Facility`,
        status: 'Active',
        isActive: true,
        permissions: ['DASHBOARD', 'ORG', 'SETTINGS', 'REPORTS', 'ATTENDANCE', 'PRODUCTION', 'QUALITY', 'SALES', 'CRM', 'INVENTORY'],
      });

      org.adminUserId = orgAdmin._id;
      await org.save();

      for (const r of DEFAULT_ROLES) {
        await Role.findOneAndUpdate(
          { orgId: org._id, name: r.name },
          { $setOnInsert: { ...r, orgId: org._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      return res.status(201).json({
        success: true,
        data: {
          organization: org,
          adminCredentials: { email: orgAdmin.email, password: adminPassword },
        },
        message: 'Organization created successfully',
      });
    } catch (innerErr) {
      if (org) {
        await Organization.findByIdAndDelete(org._id).catch(() => null);
      }
      if (innerErr.code === 11000) {
        return res.status(409).json({ success: false, message: 'That admin email is already registered. Please choose a different email.' });
      }
      throw innerErr;
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE ORGANIZATION DETAILS
router.put('/orgs/:id', async (req, res) => {
  try {
    const { name, planType, maxUsers, status, phone, businessEmail } = req.body;
    const updated = await Organization.findByIdAndUpdate(
      req.params.id,
      { name, planType, maxUsers, status, phone, businessEmail },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Organization not found.' });

    res.json({ success: true, data: updated, message: 'Organization details updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE ORGANIZATION
router.delete('/orgs/:id', async (req, res) => {
  try {
    const orgId = req.params.id;
    await Organization.findByIdAndDelete(orgId);
    await User.deleteMany({ orgId });
    await Role.deleteMany({ orgId });
    res.json({ success: true, message: 'Organization and associated accounts removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESET ORG ADMIN PASSWORD
router.post('/orgs/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    let adminUser = null;
    if (org.adminUserId) {
      adminUser = await User.findById(org.adminUserId);
    }

    if (!adminUser) {
      adminUser = await User.findOne({
        $or: [
          { email: org.businessEmail ? String(org.businessEmail).toLowerCase() : '' },
          { orgId: org._id, isOrgAdmin: true },
          { orgId: org._id, role: 'General Manager' },
          { orgId: org._id },
        ],
      });
    }

    const passwordToSet = newPassword || `Jf@${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(passwordToSet, 10);

    if (!adminUser) {
      const adminEmail = org.businessEmail ? String(org.businessEmail).trim().toLowerCase() : `admin@${org.slug || 'org'}.com`;
      adminUser = await User.create({
        orgId: org._id,
        name: `${org.name} Admin`,
        email: adminEmail,
        passwordHash,
        isOrgAdmin: true,
        isSuperAdmin: false,
        roleName: 'General Manager',
        role: 'General Manager',
        department: 'Executive',
        plant: `${org.name} Main Facility`,
        status: 'Active',
        isActive: true,
        permissions: ['DASHBOARD', 'ORG', 'SETTINGS', 'REPORTS', 'ATTENDANCE'],
      });
    } else {
      adminUser.passwordHash = passwordHash;
      await adminUser.save();
    }

    if (!org.adminUserId || String(org.adminUserId) !== String(adminUser._id)) {
      org.adminUserId = adminUser._id;
      await org.save().catch(() => null);
    }

    res.json({
      success: true,
      data: { email: adminUser.email, newPassword: passwordToSet },
      message: `Password reset successfully for ${adminUser.email}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  }
});

// UPDATE ORGANIZATION PERMISSIONS & ALLOWED MODULES
router.put('/orgs/:id/permissions', async (req, res) => {
  try {
    const { allowedModules } = req.body;
    if (!Array.isArray(allowedModules)) {
      return res.status(400).json({ success: false, message: 'allowedModules must be an array of module IDs.' });
    }

    const updated = await Organization.findByIdAndUpdate(
      req.params.id,
      { allowedModules },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Organization not found.' });

    res.json({
      success: true,
      data: updated,
      message: `Organization permissions updated successfully (${allowedModules.length} modules enabled).`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. TOGGLE ORGANIZATION STATUS (Active / Suspended)
router.put('/orgs/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const org = await Organization.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (org?._id) {
      await User.updateMany({ orgId: org._id }, { isActive: status === 'Active' });
    }
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    res.json({ success: true, data: org, message: `Organization status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. PLATFORM ANALYTICS / STATS
router.get('/stats', async (req, res) => {
  try {
    const totalOrgs = await Organization.countDocuments();
    const activeOrgs = await Organization.countDocuments({ status: 'Active' });
    const pendingRequests = await OrgRequest.countDocuments({ status: 'Pending' });
    const totalUsers = await User.countDocuments({ isSuperAdmin: false });

    res.json({
      success: true,
      data: {
        totalOrgs,
        activeOrgs,
        pendingRequests,
        totalUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
