const router = require('express').Router();

router.get('/', (_req, res) => res.json({ message: 'clients route' }));

module.exports = router;
