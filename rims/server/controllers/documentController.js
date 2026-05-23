const path     = require('path');
const fs       = require('fs');
const Document = require('../models/Document');

// GET /api/documents
const list = async (req, res, next) => {
  try {
    const { type, search, archived = 'false', page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = { isArchived: archived === 'true' };
    if (type) filter.type = type;

    if (search) {
      // Use MongoDB text index when available, fall back to regex
      filter.$or = [
        { fileName:      { $regex: search, $options: 'i' } },
        { entityName:    { $regex: search, $options: 'i' } },
        { extractedText: { $regex: search, $options: 'i' } },
        { tags:          { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [documents, total] = await Promise.all([
      Document.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('uploadedBy', 'firstName lastName')
        .populate('relatedReceipt', 'receiptNumber amount date')
        .populate('relatedInvoice', 'invoiceNumber total status'),
      Document.countDocuments(filter),
    ]);

    res.json({ documents, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/documents  — handles the multipart upload (file already on disk via multer)
const upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { type = 'other', relatedReceipt, relatedInvoice, entityName, tags, notes } = req.body;

    const doc = await Document.create({
      fileName:       req.file.originalname,
      filePath:       req.file.path,
      fileUrl:        `/uploads/${req.file.filename}`,
      fileSize:       req.file.size,
      mimeType:       req.file.mimetype,
      type,
      relatedReceipt: relatedReceipt || null,
      relatedInvoice: relatedInvoice || null,
      entityName:     entityName || '',
      tags:           tags ? tags.split(',').map(t => t.trim()) : [],
      notes:          notes || '',
      uploadedBy:     req.user.id,
    });

    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents/:id
const getOne = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('relatedReceipt', 'receiptNumber amount date vendorSnapshot')
      .populate('relatedInvoice', 'invoiceNumber total status clientSnapshot dueDate');
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents/:id/download
const download = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (!doc.filePath || !fs.existsSync(doc.filePath))
      return res.status(404).json({ message: 'File not found on disk' });

    res.download(doc.filePath, doc.fileName);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/documents/:id  — update metadata only (not file)
const updateMeta = async (req, res, next) => {
  try {
    const { type, entityName, tags, notes, isArchived } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (type        !== undefined) doc.type       = type;
    if (entityName  !== undefined) doc.entityName = entityName;
    if (notes       !== undefined) doc.notes      = notes;
    if (isArchived  !== undefined) doc.isArchived = isArchived;
    if (tags        !== undefined) doc.tags       = tags.split(',').map(t => t.trim());

    await doc.save();
    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/documents/:id  — removes DB record and file from disk
const remove = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await doc.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, upload, getOne, download, updateMeta, remove };
