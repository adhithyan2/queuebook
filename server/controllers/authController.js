const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendViaProvider, logMessage } = require('../services/notificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const safeRole = ['customer', 'business'].includes(role) ? role : 'customer';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      phone: phone || '',
    });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};

exports.sendPhoneOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim().length < 7) {
      return res.status(400).json({ message: 'Please provide a valid phone number' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    req.user.phone = String(phone).trim();
    req.user.phoneOtp = hashOtp(otp);
    req.user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await req.user.save();

    const channel = process.env.SMS_CHANNEL === 'whatsapp' ? 'whatsapp' : 'sms';
    const body = `QueueBook: Your verification code is ${otp}. It expires in 10 minutes.`;
    const result = await sendViaProvider({ to: req.user.phone, body, channel });
    await logMessage({
      user: req.user._id,
      type: 'otp',
      channel,
      to: req.user.phone,
      content: body,
      status: result.ok ? 'sent' : 'failed',
      provider: result.provider,
      providerMessageId: result.messageId,
      error: result.error,
    });

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    next(error);
  }
};

exports.verifyPhone = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'Please provide the verification code' });
    }

    const expired = !req.user.phoneOtpExpires || new Date() > req.user.phoneOtpExpires;
    const valid = req.user.phoneOtp && req.user.phoneOtp === hashOtp(otp);

    if (expired || !valid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    req.user.phoneVerified = true;
    req.user.phoneOtp = '';
    req.user.phoneOtpExpires = null;
    await req.user.save();

    res.json({ message: 'Phone verified', user: req.user.toJSON() });
  } catch (error) {
    next(error);
  }
};
