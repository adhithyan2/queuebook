const express = require('express');
const { createAppointment, getAppointments, getAppointment, cancelAppointment, rescheduleAppointment, checkinAppointment } = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/checkin', protect, checkinAppointment);

module.exports = router;
