const express = require('express');
const { createAppointment, getAppointments, getAppointment, cancelAppointment, rescheduleAppointment, checkInAppointment } = require('../controllers/appointmentController');
const { getAppointmentPayment, payAppointment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.get('/:id/payment', protect, getAppointmentPayment);
router.post('/:id/payment', protect, payAppointment);
router.put('/:id/checkin', protect, checkInAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);

module.exports = router;
