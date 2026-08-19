import mongoose from 'mongoose';

const packagingMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  consumedQty: { type: Number, required: true },
  unit: { type: String, default: 'Pcs' },
  unitCost: { type: Number, default: 1.5 },
  totalCost: { type: Number, default: 0 },
});

const packagingBatchSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  packagingNo: { type: String, required: true },
  batchId: { type: String, required: true },
  orderNo: String,
  productName: { type: String, required: true },
  qtyPlanned: { type: Number, default: 1000 },
  unit: { type: String, default: 'Bottles' },
  bottlesPacked: { type: Number, default: 0 },
  cartonsPacked: { type: Number, default: 0 },
  packagingLine: { type: String, default: 'Bottling & Packaging Line #1' },
  materials: [packagingMaterialSchema],
  totalPackagingCost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'in_packaging', 'completed'],
    default: 'pending',
  },
  operatorName: { type: String, default: 'Packaging Supervisor' },
  packagedAt: Date,
  labSampleId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabSample' },
  productionOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

packagingBatchSchema.index({ orgId: 1, packagingNo: 1 });
packagingBatchSchema.index({ orgId: 1, batchId: 1 });

export const PackagingBatch = mongoose.models.PackagingBatch || mongoose.model('PackagingBatch', packagingBatchSchema);
