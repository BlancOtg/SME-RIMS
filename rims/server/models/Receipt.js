const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, unique: true },

    // expense = money paid out; income = payment received (e.g. against an invoice)
    type: {
      type: String,
      enum: ['expense', 'income'],
      required: true,
      default: 'expense',
    },

    // Vendor ref + snapshot (for expense receipts)
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    vendorSnapshot: {
      name:  { type: String, default: '' },
      email: { type: String, default: '' },
    },

    // Optional link to an invoice (for income receipts)
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    amount:    { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    currency:  { type: String, default: 'NGN', uppercase: true, trim: true },

    category: {
      type: String,
      enum: [
        'office_supplies', 'utilities', 'transport', 'meals',
        'software', 'hardware', 'rent', 'salaries',
        'marketing', 'professional_services', 'other',
      ],
      default: 'other',
    },

    date: { type: Date, required: true, default: Date.now },

    description:   { type: String, trim: true, default: '' },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'other'],
      default: 'cash',
    },
    reference: { type: String, trim: true, default: '' },

    // ── OCR pipeline ─────────────────────────────────────────────
    ocr: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'processed', 'needs_review', 'confirmed'],
        default: 'pending',
      },
      confidence:  { type: Number, min: 0, max: 100, default: null },
      processedAt: { type: Date, default: null },
      extractedData: {
        vendor:    { type: String, default: '' },
        date:      { type: String, default: '' },
        amount:    { type: Number, default: null },
        reference: { type: String, default: '' },
        items:     [{ description: String, amount: Number }],
      },
    },

    // ── Uploaded file metadata ────────────────────────────────────
    file: {
      url:      { type: String, default: '' },
      path:     { type: String, default: '' },
      name:     { type: String, default: '' },
      size:     { type: Number, default: 0 },  // bytes
      mimeType: { type: String, default: '' },
    },

    tags:  [{ type: String, trim: true, lowercase: true }],
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ── Indexes ──────────────────────────────────────────────────────
receiptSchema.index({ type: 1 });
receiptSchema.index({ createdBy: 1 });
receiptSchema.index({ vendor: 1 });
receiptSchema.index({ invoice: 1 });
receiptSchema.index({ date: -1 });
receiptSchema.index({ category: 1 });
receiptSchema.index({ 'ocr.status': 1 });

// ── Virtual ───────────────────────────────────────────────────────
receiptSchema.virtual('needsReview').get(function () {
  return this.ocr.status === 'needs_review' ||
    (this.ocr.status === 'processed' && this.ocr.confidence !== null && this.ocr.confidence < 90);
});

// ── Pre-save: number generation + OCR status promotion ───────────
receiptSchema.pre('save', async function () {
  // Auto-generate receipt number on creation
  if (!this.receiptNumber) {
    const year  = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      receiptNumber: { $regex: `^REC-${year}-` },
    });
    this.receiptNumber = `REC-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  // Promote OCR status to needs_review when confidence is below threshold
  if (
    this.ocr.status === 'processed' &&
    this.ocr.confidence !== null &&
    this.ocr.confidence < 90
  ) {
    this.ocr.status = 'needs_review';
  }
});

module.exports = mongoose.model('Receipt', receiptSchema);
