import mongoose from 'mongoose';

const dispatchOrderSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  dispatchNo: { type: String, required: true, unique: true },
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  batchId: { type: String, required: true },
  driverName: String,
  vehicleNo: String,
  destination: String,
  status: {
    type: String,
    enum: ['draft', 'loaded', 'in_transit', 'delivered', 'returned'],
    default: 'draft',
  },
  dispatchedAt: Date,
  deliveredAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const DispatchOrder = mongoose.models.DispatchOrder || mongoose.model('DispatchOrder', dispatchOrderSchema);
export const DispatchRecord = DispatchOrder;
