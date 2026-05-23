const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    // File metadata
    fileName: { type: String, required: true, trim: true },
    fileUrl:  { type: String, default: '' },
    filePath: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },   // bytes
    mimeType: { type: String, default: '' },

    type: {
      type: String,
      enum: ['receipt', 'invoice', 'contract', 'statement', 'other'],
      required: true,
      default: 'other',
    },

    // Links back to the source record (one of these will be set)
    relatedReceipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
    relatedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

    // Vendor/client context for display and search
    entityName: { type: String, trim: true, default: '' },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // OCR / extracted text stored for full-text search
    extractedText: { type: String, default: '' },

    tags:  [{ type: String, trim: true, lowercase: true }],
    notes: { type: String, trim: true, default: '' },

    // SRS §5 — 7-year retention policy
    retainUntil: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 7);
        return d;
      },
    },

    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ type: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ relatedReceipt: 1 });
documentSchema.index({ relatedInvoice: 1 });
documentSchema.index({ isArchived: 1 });
documentSchema.index({ entityName: 'text', extractedText: 'text', tags: 'text', fileName: 'text' });

module.exports = mongoose.model('Document', documentSchema);
