import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  category: { type: String, enum: ['washer', 'extractor', 'pasteurizer', 'homogenizer', 'chiller', 'filler', 'capper', 'labeler', 'packager'], required: true },
  capacityUnitsPerHour: { type: Number, default: 1000 },
  currentStatus: {
    type: String,
    enum: ['running', 'idle', 'maintenance', 'breakdown', 'offline'],
    default: 'idle',
  },
  startedAt: Date,
  stoppedAt: Date,
  lastRunDurationMinutes: { type: Number, default: 0 },
  totalRunMinutes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const machineEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['start', 'cleaning', 'running', 'breakdown', 'restart', 'stop', 'idle', 'maintenance'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  note: String,
});

const machineLogSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  date: { type: Date, default: Date.now },
  shiftId: String,
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productionOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder' },
  events: [machineEventSchema],
  computed: {
    runtimeMin: { type: Number, default: 0 },
    idleMin: { type: Number, default: 0 },
    breakdownMin: { type: Number, default: 0 },
    cleaningMin: { type: Number, default: 0 },
    maintenanceMin: { type: Number, default: 0 },
    energyKwh: { type: Number, default: 0 },
    waterLtr: { type: Number, default: 0 },
    qtyProduced: { type: Number, default: 0 },
    targetQty: { type: Number, default: 0 },
    efficiencyPct: { type: Number, default: 0 },
    oee: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const maintenanceTicketSchema = new mongoose.Schema({
  ticketRef: { type: String, required: true },
  machineName: { type: String, required: true },
  machineCode: String,
  maintenanceType: { type: String, default: 'Preventive Maintenance' },
  workDescription: String,
  assignedTechnician: String,
  cost: { type: Number, default: 0 },
  status: { type: String, default: 'In Progress' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Machine = mongoose.models.Machine || mongoose.model('Machine', machineSchema);
export const MachineLog = mongoose.models.MachineLog || mongoose.model('MachineLog', machineLogSchema);
export const MaintenanceTicket = mongoose.models.MaintenanceTicket || mongoose.model('MaintenanceTicket', maintenanceTicketSchema);

