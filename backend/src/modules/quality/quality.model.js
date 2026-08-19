import mongoose from 'mongoose';

const qcParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  unit: String,
  passRange: String,
  result: { type: String, enum: ['pass', 'fail'], default: 'pass' },
});

const qcCheckSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  checkNo: { type: String, required: true },
  refType: {
    type: String,
    enum: ['incoming', 'in_process', 'finished_goods'],
    default: 'finished_goods',
  },
  refId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder' },
  batchId: { type: String, required: true },
  productName: String,
  orderNo: String,
  qtyTested: Number,
  unit: { type: String, default: 'Bottles' },
  parameters: [qcParameterSchema],
  overallResult: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'rework', 'hold'],
    default: 'pending',
  },
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labSampleId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabSample' },
  notes: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

qcCheckSchema.index({ orgId: 1, checkNo: 1 });

const labTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  standardSpec: String,
  measuredValue: String,
  unit: String,
  result: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PASS' },
});

const labSampleSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  sampleId: { type: String, required: true },
  batchId: { type: String, required: true },
  orderNo: String,
  productName: { type: String, default: 'Juice Bottle (500ml)' },
  qtyPlanned: { type: Number, default: 1000 },
  unit: { type: String, default: 'Bottles' },
  chemistName: { type: String, default: 'QC Chemist' },
  tests: [labTestSchema],
  coaNumber: String,
  coaIssuedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'in_testing', 'cleared', 'rejected'],
    default: 'pending',
  },
  notes: String,
  qcCheckId: { type: mongoose.Schema.Types.ObjectId, ref: 'QCCheck' },
  productionOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

labSampleSchema.index({ orgId: 1, sampleId: 1 });
labSampleSchema.index({ orgId: 1, batchId: 1 });

export const QCCheck = mongoose.models.QCCheck || mongoose.model('QCCheck', qcCheckSchema);
export const LabSample = mongoose.models.LabSample || mongoose.model('LabSample', labSampleSchema);
