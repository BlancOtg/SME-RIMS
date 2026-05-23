const { validationResult } = require('express-validator');
const Vendor = require('../models/Vendor');

// GET /api/vendors
const list = async (req, res, next) => {
  try {
    const { search, paymentStatus, category, page = 1, limit = 20, sort = 'name' } = req.query;

    const filter = { isActive: true };
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (category)      filter.category      = category;
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { email:   { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [vendors, total] = await Promise.all([
      Vendor.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Vendor.countDocuments(filter),
    ]);

    res.json({ vendors, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendors
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const vendor = await Vendor.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ vendor });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/:id
const getOne = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ vendor });
  } catch (err) {
    next(err);
  }
};

// PUT /api/vendors/:id
const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    Object.assign(vendor, req.body);
    await vendor.save();
    res.json({ vendor });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/vendors/:id/balance  — adjust outstanding payable balance
const updateBalance = async (req, res, next) => {
  try {
    const { balance } = req.body;
    if (balance === undefined || balance < 0)
      return res.status(400).json({ message: 'Balance must be a non-negative number' });

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { balance },
      { new: true, runValidators: true }
    );
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ vendor });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/vendors/:id  — soft delete
const remove = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    vendor.isActive = false;
    await vendor.save();
    res.json({ message: 'Vendor deactivated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getOne, update, updateBalance, remove };
