import mongoose from 'mongoose';

const ledgerSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  accountName: { type: String, required: true },
  type: { type: String, enum: ['debit', 'credit'], required: true },
  amount: { type: Number, required: true },
  refType: String,
  refId: mongoose.Schema.Types.ObjectId,
  description: String,
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  expenseDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  category: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true, min: 0 },
  paymentMode: { type: String, default: 'Bank Transfer' },
  vendor: { type: String },
  referenceNo: { type: String },
  approvedBy: { type: String },
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Approved' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Ledger = mongoose.models.Ledger || mongoose.model('Ledger', ledgerSchema);
export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
