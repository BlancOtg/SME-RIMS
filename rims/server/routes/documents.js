const router = require('express').Router();
const { list, upload, getOne, download, updateMeta, remove } = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const multerUpload = require('../middleware/upload');

router.use(protect);

router.get('/',    list);
router.post('/',   restrictTo('admin', 'accountant'), multerUpload.single('file'), upload);
router.get('/:id', getOne);
router.get('/:id/download', download);
router.patch('/:id', restrictTo('admin', 'accountant'), updateMeta);
router.delete('/:id', restrictTo('admin', 'accountant'), remove);

module.exports = router;
