const express = require('express');
const { register, login, getMe, sendPhoneOtp, verifyPhone } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', protect, sendPhoneOtp);
router.post('/verify-phone', protect, verifyPhone);
router.get('/me', protect, getMe);

module.exports = router;
