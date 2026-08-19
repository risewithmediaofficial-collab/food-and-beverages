import express from 'express';
import bcrypt from 'bcryptjs';
import { Employee, RFIDAttendanceLog, RFIDDevice, Shift, Leave, Payroll } from './hr.model.js';
import { User } from '../auth/auth.model.js';
import { resolveRoleAccess } from '../auth/auth.routes.js';
import { getTenantQuery, attachTenantOrgId } from '../../common/utils/tenantScope.js';

const router = express.Router();

// 1. Employee Master CRUD

// Delete ALL employees for organization
router.delete('/employees/all', async (req, res) => {
  try {
    await Employee.deleteMany(getTenantQuery(req, {}));
    res.json({ success: true, message: 'All employees deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find(getTenantQuery(req, { isActive: true })).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const { empId, name, username, password, email, designation, department, shift, rfidCardNo, phone, basicSalary, status } = req.body;
    const loginPassword = password || `Jf@${Math.floor(100000 + Math.random() * 900000)}`;
    const roleAccess = await resolveRoleAccess(designation || 'Employee', req.orgId || req.user?.orgId || null);

    const empData = attachTenantOrgId(req, {
      empId: empId || `EMP-${Date.now().toString().slice(-4)}`,
      name,
      username: username || email || name.toLowerCase().replace(/\s+/g, '') + '@juice-erp.com',
      email: email || username || name.toLowerCase().replace(/\s+/g, '') + '@juice-erp.com',
      designation: roleAccess.roleName,
      department: department || 'Plant Operations',
      shift: shift || 'Morning Shift',
      rfidCardNo: rfidCardNo || `RF-${Math.floor(100000 + Math.random() * 900000)}`,
      phone: phone || '',
      basicSalary: basicSalary || 25000,
      status: status || 'Active',
    });

    const emp = new Employee(empData);
    await emp.save();

    try {
      const userEmail = empData.username.includes('@') ? empData.username : `${empData.username}@juice-erp.com`;
      const existingUser = await User.findOne({ email: userEmail });
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(loginPassword, 10);
        await User.create({
          email: userEmail,
          passwordHash,
          name: empData.name,
          department: empData.department,
          roleId: roleAccess.roleId,
          roleName: roleAccess.roleName,
          role: roleAccess.roleName,
          permissions: roleAccess.permissions,
          empId: empData.empId,
          orgId: req.orgId || req.user?.orgId || null,
          status: 'Active',
          isActive: true,
        });
      }
    } catch (userErr) {
      console.warn('[HR Warning] Could not auto-create User login account:', userErr.message);
    }

    const safeEmployee = emp.toObject();
    delete safeEmployee.password;
    res.status(201).json({ success: true, data: safeEmployee });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const { name, username, email, designation, department, shift, phone, basicSalary, status, rfidCardNo, password } = req.body;
    let roleAccess = null;
    if (designation) {
      roleAccess = await resolveRoleAccess(designation, req.orgId || req.user?.orgId || null);
    }

    const updateFields = {
      ...(name && { name }),
      ...(username && { username }),
      ...(email && { email }),
      ...(designation && { designation: roleAccess ? roleAccess.roleName : designation }),
      ...(department && { department }),
      ...(shift && { shift }),
      ...(phone !== undefined && { phone }),
      ...(basicSalary !== undefined && { basicSalary: Number(basicSalary) }),
      ...(status && { status }),
      ...(rfidCardNo !== undefined && { rfidCardNo }),
    };

    const updated = await Employee.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), updateFields, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Sync with User login account if present
    try {
      const userQuery = { $or: [{ empId: updated.empId }, { email: updated.email }, { email: updated.username }] };
      const userUpdate = {
        ...(name && { name }),
        ...(department && { department }),
        ...(status && { status, isActive: status === 'Active' }),
        ...(roleAccess && {
          roleId: roleAccess.roleId,
          roleName: roleAccess.roleName,
          role: roleAccess.roleName,
          permissions: roleAccess.permissions,
        }),
      };
      if (password && password.trim()) {
        userUpdate.passwordHash = await bcrypt.hash(password.trim(), 10);
      }
      await User.findOneAndUpdate(userQuery, userUpdate);
    } catch (userErr) {
      console.warn('[HR Warning] Could not sync User account on employee update:', userErr.message);
    }

    const safeEmployee = updated.toObject();
    delete safeEmployee.password;
    res.json({ success: true, data: safeEmployee, message: 'Employee updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    await Employee.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. RFID Attendance Logs & Punch In/Out API
router.get('/attendance/logs', async (req, res) => {
  try {
    const logs = await RFIDAttendanceLog.find(getTenantQuery(req, {})).sort({ punchDate: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/attendance/punch', async (req, res) => {
  try {
    const { empId, rfidCardNo, punchType, deviceName, deviceIp } = req.body;
    let emp = await Employee.findOne(getTenantQuery(req, { rfidCardNo }));
    if (!emp && empId) emp = await Employee.findOne(getTenantQuery(req, { empId }));

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const punchRecord = new RFIDAttendanceLog(attachTenantOrgId(req, {
      empId: emp ? emp.empId : (empId || 'EMP-GUEST'),
      empName: emp ? emp.name : 'Guest Worker',
      rfidCardNo: rfidCardNo || (emp ? emp.rfidCardNo : 'RF-UNKNOWN'),
      punchDate: now,
      punchTime: timeStr,
      punchType: punchType || 'IN',
      deviceName: deviceName || 'ZKTeco-Main-Gate',
      deviceIp: deviceIp || '192.168.1.150',
      status: 'Present',
    }));

    await punchRecord.save();
    res.status(201).json({ success: true, data: punchRecord });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. RFID Device Master
router.get('/devices', async (req, res) => {
  try {
    const devices = await RFIDDevice.find(getTenantQuery(req, { isActive: true }));
    res.json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/devices', async (req, res) => {
  try {
    const device = new RFIDDevice(attachTenantOrgId(req, req.body));
    await device.save();
    res.status(201).json({ success: true, data: device });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/devices/:id', async (req, res) => {
  try {
    const device = await RFIDDevice.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, data: device });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/devices/:id', async (req, res) => {
  try {
    await RFIDDevice.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    res.json({ success: true, message: 'Device removed' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. Shift Management CRUD
router.get('/shifts', async (req, res) => {
  try {
    const shifts = await Shift.find(getTenantQuery(req, {})).sort({ createdAt: -1 });
    res.json({ success: true, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/shifts', async (req, res) => {
  try {
    const shift = new Shift(attachTenantOrgId(req, req.body));
    await shift.save();
    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/shifts/:id', async (req, res) => {
  try {
    const shift = await Shift.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });
    res.json({ success: true, data: shift });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/shifts/:id', async (req, res) => {
  try {
    await Shift.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    res.json({ success: true, message: 'Shift deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Leave Management CRUD
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await Leave.find(getTenantQuery(req, {})).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/leaves', async (req, res) => {
  try {
    const count = await Leave.countDocuments(getTenantQuery(req, {}));
    const leave = new Leave(attachTenantOrgId(req, {
      leaveRef: `LEV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`,
      ...req.body,
      status: 'Pending',
      approvedBy: 'Pending Review',
    }));
    await leave.save();
    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/leaves/:id', async (req, res) => {
  try {
    const leave = await Leave.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/leaves/:id', async (req, res) => {
  try {
    await Leave.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    res.json({ success: true, message: 'Leave deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. Payroll CRUD
router.get('/payroll', async (req, res) => {
  try {
    const payroll = await Payroll.find(getTenantQuery(req, {})).sort({ createdAt: -1 });
    res.json({ success: true, data: payroll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/payroll', async (req, res) => {
  try {
    const { basicPay = 0, hra = 0, overtimePay = 0, pfDeduction = 0, esiDeduction = 0, lateDeduction = 0 } = req.body;
    const netSalary = Number(basicPay) + Number(hra) + Number(overtimePay) - (Number(pfDeduction) + Number(esiDeduction) + Number(lateDeduction));
    const slipId = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payroll = new Payroll(attachTenantOrgId(req, { slipId, ...req.body, netSalary }));
    await payroll.save();
    res.status(201).json({ success: true, data: payroll });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/payroll/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });
    res.json({ success: true, data: payroll });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/payroll/:id', async (req, res) => {
  try {
    await Payroll.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    res.json({ success: true, message: 'Payroll record deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
