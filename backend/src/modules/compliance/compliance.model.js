import mongoose from 'mongoose';

const complianceSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  licenseName: { type: String, required: true },
  authority: { type: String, required: true },
  licenseNo: { type: String, required: true },
  issueDate: String,
  expiryDate: { type: String, required: true },
  responsiblePerson: String,
  status: { type: String, default: 'Valid' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Compliance = mongoose.models.Compliance || mongoose.model('Compliance', complianceSchema);
