require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  const name = process.argv[2] || 'Admin';
  const email = process.argv[3] || 'admin@queuebook.com';
  const password = process.argv[4] || 'Admin12345';

  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<username>')) {
    console.error('MONGODB_URI not configured in server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`Admin role set on existing user: ${email}`);
    } else {
      await User.create({ name, email, password, role: 'admin', isActive: true });
      console.log(`Admin created: ${email} / ${password}`);
    }
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

createAdmin();
