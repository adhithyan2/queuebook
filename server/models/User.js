const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['customer', 'business', 'admin'], default: 'customer' },
  phone: { type: String, default: '' },
  phoneVerified: { type: Boolean, default: false },
  phoneOtp: { type: String, default: '' },
  phoneOtpExpires: { type: Date, default: null },
  location: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.phoneOtp;
  delete obj.phoneOtpExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
