const mongoose = require('mongoose');

// ── Line item sub-schema ─────────────────────────────────────────
const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity:    { type: Number, required: true, min: 0 },
    unitPrice:   { type: Number, required: true, min: 0 },
    amount:      { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Invoice schema ───────────────────────────────────────────────
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },

    // Client reference + snapshot (snapshot keeps display intact if client record changes)
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientSnapshot: {
      name:    { type: String, required: true },
      email:   { type: String, default: '' },
      address: { type: String, default: '' },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // SRS invoice lifecycle
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue'],
      default: 'draft',
    },

    issueDate: { type: Date, default: Date.now },
    dueDate:   { type: Date, required: true },

    items: { type: [lineItemSchema], default: [] },

    // Financials (all auto-calculated in pre-save)
    subtotal:   { type: Number, default: 0 },
    taxRate:    { type: Number, default: 0, min: 0, max: 100 }, // percentage
    taxAmount:  { type: Number, default: 0 },
    discount:   { type: Number, default: 0, min: 0 },
    total:      { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balance:    { type: Number, default: 0 },

    currency:     { type: String, default: 'NGN', uppercase: true, trim: true },
    notes:        { type: String, trim: true, default: '' },
    paymentTerms: { type: String, trim: true, default: '' },

    // Lifecycle timestamps
    sentAt:   { type: Date, default: null },
    viewedAt: { type: Date, default: null },
    paidAt:   { type: Date, default: null },

    // File attachments (stored as paths or object-storage keys)
    attachments: [{ type: String }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ── Indexes ──────────────────────────────────────────────────────
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ dueDate: 1 });

// ── Virtuals ─────────────────────────────────────────────────────
invoiceSchema.virtual('daysOverdue').get(function () {
  if (!['overdue', 'partial'].includes(this.status)) return 0;
  return Math.max(0, Math.floor((Date.now() - this.dueDate) / 86_400_000));
});

// ── Pre-save: number generation + totals + auto-overdue ──────────
invoiceSchema.pre('save', async function () {
  // Generate invoice number once on creation
  if (!this.invoiceNumber) {
    const year  = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      invoiceNumber: { $regex: `^INV-${year}-` },
    });
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  // Recalculate each line item amount
  this.items.forEach(item => {
    item.amount = +(item.quantity * item.unitPrice).toFixed(2);
  });

  // Recalculate invoice totals
  this.subtotal  = +this.items.reduce((s, i) => s + i.amount, 0).toFixed(2);
  this.taxAmount = +(this.subtotal * this.taxRate / 100).toFixed(2);
  this.total     = +(this.subtotal + this.taxAmount - this.discount).toFixed(2);
  this.balance   = +(this.total - this.amountPaid).toFixed(2);

  // Auto-transition to overdue when past due date
  if (['sent', 'viewed', 'partial'].includes(this.status) && this.dueDate < new Date()) {
    this.status = 'overdue';
  }

  // Mark as paid when balance reaches zero
  if (this.amountPaid >= this.total && this.total > 0) {
    this.status  = 'paid';
    this.paidAt  = this.paidAt || new Date();
    this.balance = 0;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
