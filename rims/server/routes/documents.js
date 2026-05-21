const router = require('express').Router();

router.get('/', (_req, res) => res.json({ message: 'documents route' }));

module.exports = router;
