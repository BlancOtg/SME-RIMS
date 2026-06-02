const { validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');

// GET /api/invoices
const list = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { invoiceNumber:        { $regex: search, $options: 'i' } },
        { 'clientSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'firstName lastName'),
      Invoice.countDocuments(filter),
    ]);

    res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/invoices
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const invoice = await Invoice.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ invoice });
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/:id
const getOne = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
};

// PUT /api/invoices/:id  — only drafts are editable
const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status !== 'draft')
      return res.status(409).json({ message: 'Only draft invoices can be edited' });

    Object.assign(invoice, req.body);
    await invoice.save();
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue'];
    if (!valid.includes(status))
      return res.status(400).json({ message: `Status must be one of: ${valid.join(', ')}` });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.status = status;
    if (status === 'sent'   && !invoice.sentAt)   invoice.sentAt   = new Date();
    if (status === 'viewed' && !invoice.viewedAt)  invoice.viewedAt = new Date();
    if (status === 'paid'   && !invoice.paidAt)    invoice.paidAt   = new Date();

    await invoice.save();
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/payment  — record a full or partial payment
const recordPayment = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Payment amount must be a positive number' });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'draft')
      return res.status(409).json({ message: 'Cannot record payment on a draft invoice' });
    if (invoice.status === 'paid')
      return res.status(409).json({ message: 'Invoice is already fully paid' });

    invoice.amountPaid = +(invoice.amountPaid + amount).toFixed(2);
    // Mark as partial if not yet covering the full total; pre-save handles auto-paid promotion
    if (invoice.amountPaid < invoice.total) invoice.status = 'partial';

    await invoice.save();
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/invoices/:id  — only drafts may be deleted
const remove = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status !== 'draft')
      return res.status(409).json({ message: 'Only draft invoices can be deleted' });

    await invoice.deleteOne();
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/sign
const sign = async (req, res, next) => {
  try {
    const { signatureData } = req.body;
    if (!signatureData) return res.status(422).json({ message: 'Signature data is required' });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'draft')
      return res.status(409).json({ message: 'Cannot sign a draft invoice' });

    invoice.signature = {
      data:       signatureData,
      signedBy:   req.user.id,
      signerName: `${req.user.firstName} ${req.user.lastName}`,
      signedAt:   new Date(),
    };

    await invoice.save();
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getOne, update, updateStatus, recordPayment, remove, sign };
