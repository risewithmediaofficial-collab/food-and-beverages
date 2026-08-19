import mongoose from 'mongoose';

const salesItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  productName: String,
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const quotationSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  quotationNo: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: String,
  items: [salesItemSchema],
  totalAmount: { type: Number, required: true },
  validTill: Date,
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

quotationSchema.index({ orgId: 1, quotationNo: 1 });

const salesOrderSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  orderNo: { type: String, required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: String,
  items: [salesItemSchema],
  totalAmount: { type: Number, required: true },
  requiredDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_production', 'dispatched', 'invoiced', 'closed', 'cancelled'],
    default: 'pending',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

salesOrderSchema.index({ orgId: 1, orderNo: 1 });

const salesInvoiceSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  invoiceNo: { type: String, required: true },
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: String,
  items: [salesItemSchema],
  subtotal: Number,
  gstRatePct: { type: Number, default: 18 },
  gstAmount: Number,
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'partially_paid', 'paid', 'overdue'], default: 'unpaid' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

salesInvoiceSchema.index({ orgId: 1, invoiceNo: 1 });

const paymentSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice', required: true },
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['bank_transfer', 'upi', 'cheque', 'cash'], default: 'bank_transfer' },
  referenceNo: String,
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Quotation = mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema);
export const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', salesOrderSchema);
export const SalesInvoice = mongoose.models.SalesInvoice || mongoose.model('SalesInvoice', salesInvoiceSchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
