const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
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

    website:   { type: String, trim: true, default: '' },
    taxId:     { type: String, trim: true, default: '' },

    category: {
      type: String,
      enum: [
        'supplies', 'services', 'utilities', 'logistics',
        'technology', 'professional', 'financial', 'other',
      ],
      default: 'other',
    },

    paymentTerms: { type: String, trim: true, default: 'Net 30' },
    currency:     { type: String, default: 'NGN', uppercase: true, trim: true },

    // Payment status — updated by the accountant or derived from receipt history
    paymentStatus: {
      type: String,
      enum: ['Good', 'Late', 'Dispute'],
      default: 'Good',
    },

    isActive: { type: Boolean, default: true },

    // Current outstanding payable balance
    balance: { type: Number, default: 0 },

    // Bank details for making payments
    bankDetails: {
      bankName:      { type: String, default: '' },
      accountName:   { type: String, default: '' },
      accountNumber: { type: String, default: '' },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:     { type: String, trim: true, default: '' },
    tags:      [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

vendorSchema.index({ name: 1 });
vendorSchema.index({ email: 1 });
vendorSchema.index({ paymentStatus: 1 });
vendorSchema.index({ isActive: 1 });
vendorSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
