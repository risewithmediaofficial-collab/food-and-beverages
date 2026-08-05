import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  name: { type: String, required: true },
  contactPerson: String,
  phone: String,
  email: String,
  rating: { type: Number, default: 5 },
  materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const poItemSchema = new mongoose.Schema({
  rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const purchaseOrderSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  poNo: { type: String, required: true, unique: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [poItemSchema],
  totalAmount: { type: Number, required: true },
  expectedDeliveryDate: Date,
  status: {
    type: String,
    enum: ['draft', 'sent', 'partially_received', 'received', 'cancelled'],
    default: 'draft',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const grnItemSchema = new mongoose.Schema({
  rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  qtyOrdered: Number,
  qtyReceived: { type: Number, required: true },
  batchNo: String,
  mfgDate: Date,
  expiryDate: Date,
});

const grnSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  grnNo: { type: String, required: true, unique: true },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [grnItemSchema],
  qcStatus: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
  receivedDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
export const GRN = mongoose.models.GRN || mongoose.model('GRN', grnSchema);
