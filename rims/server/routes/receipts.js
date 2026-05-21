const router = require('express').Router();

router.get('/', (_req, res) => res.json({ message: 'receipts route' }));

module.exports = router;
