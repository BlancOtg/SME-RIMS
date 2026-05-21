const router = require('express').Router();

router.get('/', (_req, res) => res.json({ message: 'vendors route' }));

module.exports = router;
