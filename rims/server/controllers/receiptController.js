const { validationResult } = require('express-validator');
const Receipt = require('../models/Receipt');
const { processReceipt } = require('../services/ocrService');

// GET /api/receipts
const list = async (req, res, next) => {
  try {
    const {
      type, category, search,
      needsReview,
      page = 1, limit = 20, sort = '-date',
    } = req.query;

    const filter = {};
    if (type)     filter.type     = type;
    if (category) filter.category = category;
    if (needsReview === 'true') filter['ocr.status'] = 'needs_review';
    if (search) {
      filter.$or = [
        { receiptNumber:         { $regex: search, $options: 'i' } },
        { description:           { $regex: search, $options: 'i' } },
        { 'vendorSnapshot.name': { $regex: search, $options: 'i' } },
        { reference:             { $regex: search, $options: 'i' } },
        { tags:                  { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'firstName lastName')
        .populate('invoice', 'invoiceNumber'),
      Receipt.countDocuments(filter),
    ]);

    res.json({ receipts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/receipts
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const data = { ...req.body, createdBy: req.user.id };

    if (req.file) {
      data.file = {
        url:      `/uploads/${req.file.filename}`,
        path:     req.file.path,
        name:     req.file.originalname,
        size:     req.file.size,
        mimeType: req.file.mimetype,
      };
    }

    const receipt = await Receipt.create(data);

    // Fire OCR in background — don't block the HTTP response
    if (data.file?.path) {
      processReceipt(receipt._id, data.file).catch(err =>
        console.error(`[OCR] Background task failed for receipt ${receipt._id}:`, err.message)
      );
    }

    res.status(201).json({ receipt });
  } catch (err) {
    next(err);
  }
};

// GET /api/receipts/:id
const getOne = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('invoice', 'invoiceNumber clientSnapshot total');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    res.json({ receipt });
  } catch (err) {
    next(err);
  }
};

// PUT /api/receipts/:id
const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    Object.assign(receipt, req.body);
    await receipt.save();
    res.json({ receipt });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/receipts/:id/ocr  — update OCR extracted data and confirm or flag for review
const updateOcr = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    const { confidence, extractedData, status } = req.body;

    if (confidence    !== undefined) receipt.ocr.confidence    = confidence;
    if (extractedData !== undefined) receipt.ocr.extractedData = extractedData;
    if (status        !== undefined) receipt.ocr.status        = status;

    if (status === 'processed' || status === undefined) {
      receipt.ocr.processedAt = new Date();
    }

    await receipt.save(); // pre-save handles needs_review promotion
    res.json({ receipt });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/receipts/:id/confirm  — confirm OCR data and apply extracted values
const confirmOcr = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    const { amount, date, reference, vendorName } = req.body;

    if (amount     !== undefined) receipt.amount    = amount;
    if (date       !== undefined) receipt.date       = new Date(date);
    if (reference  !== undefined) receipt.reference  = reference;
    if (vendorName !== undefined) receipt.vendorSnapshot.name = vendorName;

    receipt.ocr.status = 'confirmed';
    await receipt.save();
    res.json({ receipt });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/receipts/:id
const remove = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    await receipt.deleteOne();
    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getOne, update, updateOcr, confirmOcr, remove };
