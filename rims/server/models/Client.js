const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    contact: { type: String, trim: true, default: '' }, // primary contact person
    email:   { type: String, trim: true, lowercase: true, default: '' },
    phone:   { type: String, trim: true, default: '' },

    address: {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      country: { type: String, default: 'Nigeria' },
    },

    website: { type: String, trim: true, default: '' },
    taxId:   { type: String, trim: true, default: '' },

    // Default payment terms applied when creating invoices for this client
    paymentTerms: { type: String, trim: true, default: 'Net 30' },
    creditLimit:  { type: Number, default: 0, min: 0 },
    currency:     { type: String, default: 'NGN', uppercase: true, trim: true },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },

    isActive: { type: Boolean, default: true },

    // Current outstanding receivable balance (sum of unpaid invoice totals)
    balance: { type: Number, default: 0 },

    // Linked user account — set if the client has a RIMS login
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:     { type: String, trim: true, default: '' },
    tags:      [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ isActive: 1 });
clientSchema.index({ createdBy: 1 });

// Whether this client is over their credit limit
clientSchema.virtual('overCreditLimit').get(function () {
  return this.creditLimit > 0 && this.balance > this.creditLimit;
});

module.exports = mongoose.model('Client', clientSchema);
