import mongoose from 'mongoose';

const qcParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  unit: String,
  passRange: String,
  result: { type: String, enum: ['pass', 'fail'], default: 'pass' },
});

const qcCheckSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  checkNo: { type: String, required: true, unique: true },
  refType: {
    type: String,
    enum: ['incoming', 'in_process', 'finished_goods'],
    required: true,
  },
  refId: { type: mongoose.Schema.Types.ObjectId },
  batchId: { type: String, required: true },
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

const labSampleSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  batchId: { type: String, required: true },
  tests: [{
    name: String,
    result: String,
    certificateUrl: String,
    testedAt: { type: Date, default: Date.now },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const QCCheck = mongoose.models.QCCheck || mongoose.model('QCCheck', qcCheckSchema);
export const LabSample = mongoose.models.LabSample || mongoose.model('LabSample', labSampleSchema);
