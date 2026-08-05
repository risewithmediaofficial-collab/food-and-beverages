import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: { type: String, default: 'India' },
});

const leadSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  name: { type: String, required: true },
  phone: String,
  email: String,
  company: String,
  source: { type: String, default: 'Direct Call' },
  status: {
    type: String,
    enum: ['new', 'followup', 'quoted', 'negotiation', 'won', 'lost'],
    default: 'new',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: [{
    text: String,
    by: String,
    date: { type: Date, default: Date.now },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  name: { type: String, required: true },
  email: String,
  phone: String,
  type: {
    type: String,
    enum: ['dealer', 'distributor', 'retail', 'supermarket', 'hotel', 'restaurant'],
    default: 'distributor',
  },
  creditLimit: { type: Number, default: 100000 },
  outstandingBalance: { type: Number, default: 0 },
  deliveryAddresses: [addressSchema],
  convertedFromLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
