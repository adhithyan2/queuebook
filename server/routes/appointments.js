const express = require('express');
const { createAppointment, getAppointments, getAppointment, cancelAppointment } = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;
