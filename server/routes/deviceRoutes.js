const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const deviceController = require('../controllers/deviceController');

router.use(protect);
router.use(authorize('admin'));

router.get('/', deviceController.getAllowedDevices);
router.post('/', deviceController.createAllowedDevice);
router.put('/:id', deviceController.updateAllowedDevice);
router.delete('/:id', deviceController.deleteAllowedDevice);

module.exports = router;
