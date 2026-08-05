import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  empId: { type: String, required: true, unique: true },
  rfidCardNo: { type: String, default: '' },
  name: { type: String, required: true },
  username: { type: String },
  password: { type: String, select: false },
  photoUrl: String,
  department: { type: String, required: true },
  designation: { type: String, required: true },
  factory: { type: String, default: 'Nashik Plant #1' },
  shift: { type: String, default: 'Morning Shift' },
  reportingManager: String,
  joiningDate: { type: Date, default: Date.now },
  phone: String,
  email: String,
  emergencyContact: String,
  address: String,
  bloodGroup: String,
  qualification: String,
  basicSalary: { type: Number, default: 25000 },
  status: { type: String, enum: ['Active', 'On Leave', 'Resigned', 'Terminated'], default: 'Active' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const rfidAttendanceLogSchema = new mongoose.Schema({
  empId: { type: String, required: true },
  empName: String,
  rfidCardNo: { type: String },
  punchDate: { type: Date, default: Date.now },
  punchTime: String,
  punchType: { type: String, enum: ['IN', 'OUT'], required: true },
  deviceName: { type: String, default: 'ZKTeco-Main-Gate' },
  deviceIp: { type: String, default: '192.168.1.150' },
  factory: { type: String, default: 'Nashik Plant #1' },
  shift: { type: String, default: 'Morning Shift' },
  workingHoursMin: { type: Number, default: 0 },
  lateMin: { type: Number, default: 0 },
  earlyExitMin: { type: Number, default: 0 },
  status: { type: String, enum: ['Present', 'Late', 'Half Day', 'Early Exit', 'Absent', 'On Leave'], default: 'Present' },
}, { timestamps: true });

const rfidDeviceSchema = new mongoose.Schema({
  deviceName: { type: String, required: true },
  deviceIp: { type: String, required: true },
  port: { type: Number, default: 4370 },
  brand: { type: String, enum: ['ZKTeco', 'eSSL', 'Realtime', 'BioMax', 'Matrix', 'Anviz'], default: 'ZKTeco' },
  communicationType: { type: String, enum: ['TCP/IP', 'USB', 'Cloud API'], default: 'Cloud API' },
  syncIntervalMin: { type: Number, default: 5 },
  lastSyncAt: Date,
  onlineStatus: { type: String, enum: ['Online', 'Offline', 'Connecting'], default: 'Online' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const shiftSchema = new mongoose.Schema({
  shiftName: { type: String, required: true },
  startTime: { type: String, default: '08:00 AM' },
  endTime: { type: String, default: '05:00 PM' },
  graceTimeMin: { type: Number, default: 15 },
  breakTimeMin: { type: Number, default: 60 },
  workingHours: { type: Number, default: 8 },
}, { timestamps: true });

export const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export const RFIDAttendanceLog = mongoose.models.RFIDAttendanceLog || mongoose.model('RFIDAttendanceLog', rfidAttendanceLogSchema);
export const RFIDDevice = mongoose.models.RFIDDevice || mongoose.model('RFIDDevice', rfidDeviceSchema);
export const Shift = mongoose.models.Shift || mongoose.model('Shift', shiftSchema);
