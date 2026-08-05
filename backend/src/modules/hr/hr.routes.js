import express from 'express';
import bcrypt from 'bcryptjs';
import { Employee, RFIDAttendanceLog, RFIDDevice, Shift } from './hr.model.js';
import { User } from '../auth/auth.model.js';
import { resolveRoleAccess } from '../auth/auth.routes.js';

const router = express.Router();

// 1. Employee Master CRUD

// Delete ALL employees (Clear database)
router.delete('/employees/all', async (req, res) => {
  try {
    await Employee.deleteMany({});
    res.json({ success: true, message: 'All employees deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const { empId, name, username, password, email, designation, department, shift, rfidCardNo, phone, basicSalary, status } = req.body;
    const loginPassword = password || `Jf@${Math.floor(100000 + Math.random() * 900000)}`;
    const roleAccess = await resolveRoleAccess(designation || 'Employee');

    const empData = {
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
    };

    const emp = new Employee(empData);
    await emp.save();

    // Create user login account for this employee so they can log in
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
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. RFID Attendance Logs & Punch In/Out API
router.get('/attendance/logs', async (req, res) => {
  try {
    const logs = await RFIDAttendanceLog.find().sort({ punchDate: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/attendance/punch', async (req, res) => {
  try {
    const { empId, rfidCardNo, punchType, deviceName, deviceIp } = req.body;
    let emp = await Employee.findOne({ rfidCardNo });
    if (!emp && empId) emp = await Employee.findOne({ empId });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const punchRecord = new RFIDAttendanceLog({
      empId: emp ? emp.empId : (empId || 'EMP-GUEST'),
      empName: emp ? emp.name : 'Guest Worker',
      rfidCardNo: rfidCardNo || (emp ? emp.rfidCardNo : 'RF-UNKNOWN'),
      punchDate: now,
      punchTime: timeStr,
      punchType: punchType || 'IN',
      deviceName: deviceName || 'ZKTeco-Main-Gate',
      deviceIp: deviceIp || '192.168.1.150',
      status: 'Present',
    });

    await punchRecord.save();
    res.status(201).json({ success: true, data: punchRecord });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. RFID Device Master
router.get('/devices', async (req, res) => {
  try {
    const devices = await RFIDDevice.find({ isActive: true });
    res.json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/devices', async (req, res) => {
  try {
    const device = new RFIDDevice(req.body);
    await device.save();
    res.status(201).json({ success: true, data: device });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/devices/:id', async (req, res) => {
  try {
    const device = await RFIDDevice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, data: device });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/devices/:id', async (req, res) => {
  try {
    await RFIDDevice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Device removed' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
