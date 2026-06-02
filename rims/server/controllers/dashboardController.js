const Invoice  = require('../models/Invoice');
const Receipt  = require('../models/Receipt');
const Client   = require('../models/Client');
const Document = require('../models/Document');

// GET /api/dashboard
const summary = async (req, res, next) => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    const [
      receivables,
      payables,
      overdueAgg,
      statusDist,
      recentInvoices,
      cashFlow,
      agingBuckets,
      receiptStats,
      docCount,
      needsReviewCount,
    ] = await Promise.all([

      // Total outstanding receivables (unpaid invoice balances)
      Invoice.aggregate([
        { $match: { status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$balance' } } },
      ]),

      // Total payables (sum of all expense receipts)
      Receipt.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Overdue invoices — count + total
      Invoice.aggregate([
        { $match: { status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$balance' }, count: { $sum: 1 } } },
      ]),

      // Invoice status distribution (for pie chart)
      Invoice.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
        { $project: { status: '$_id', count: 1, total: 1, _id: 0 } },
      ]),

      // 5 most recent invoices
      Invoice.find()
        .sort('-createdAt')
        .limit(5)
        .select('invoiceNumber clientSnapshot total balance status dueDate'),

      // Monthly cash flow — last 6 months (receivables vs expenses)
      Invoice.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            receivables: { $sum: '$total' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Aging report — outstanding invoices grouped by days overdue
      Invoice.aggregate([
        { $match: { status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } } },
        {
          $addFields: {
            daysOut: {
              $floor: {
                $divide: [{ $subtract: [now, '$dueDate'] }, 86_400_000],
              },
            },
          },
        },
        {
          $bucket: {
            groupBy: '$daysOut',
            boundaries: [0, 31, 61, 91],
            default: '90+',
            output: { amount: { $sum: '$balance' }, count: { $sum: 1 } },
          },
        },
      ]),

      // Total expense receipts this month
      Receipt.aggregate([
        { $match: { type: 'expense', date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Total document count
      Document.countDocuments({ isArchived: false }),

      // Documents needing OCR review
      Receipt.countDocuments({ 'ocr.status': 'needs_review' }),
    ]);

    res.json({
      kpi: {
        totalReceivables:  receivables[0]?.total  || 0,
        totalPayables:     payables[0]?.total      || 0,
        netCashPosition:   (receivables[0]?.total || 0) - (payables[0]?.total || 0),
        overdueTotal:      overdueAgg[0]?.total    || 0,
        overdueCount:      overdueAgg[0]?.count    || 0,
        monthlyExpenses:   receiptStats[0]?.total  || 0,
        documentCount:     docCount,
        needsReviewCount,
      },
      statusDistribution: statusDist,
      recentInvoices,
      cashFlow,
      agingBuckets,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { summary };
