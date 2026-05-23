const { validationResult } = require('express-validator');
const Client = require('../models/Client');

// GET /api/clients
const list = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20, sort = 'name' } = req.query;

    const filter = { isActive: true };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { email:   { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [clients, total] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Client.countDocuments(filter),
    ]);

    res.json({ clients, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/clients
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const client = await Client.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ client });
  } catch (err) {
    next(err);
  }
};

// GET /api/clients/:id
const getOne = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('userAccount', 'firstName lastName email');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ client });
  } catch (err) {
    next(err);
  }
};

// PUT /api/clients/:id
const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    Object.assign(client, req.body);
    await client.save();
    res.json({ client });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/clients/:id/balance  — sync outstanding receivable balance
const updateBalance = async (req, res, next) => {
  try {
    const { balance } = req.body;
    if (balance === undefined || balance < 0)
      return res.status(400).json({ message: 'Balance must be a non-negative number' });

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { balance },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ client });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/clients/:id  — soft delete
const remove = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.isActive = false;
    await client.save();
    res.json({ message: 'Client deactivated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getOne, update, updateBalance, remove };
