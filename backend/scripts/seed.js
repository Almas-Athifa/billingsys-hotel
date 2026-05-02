const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food-billing-system';
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await User.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: password,
      role: 'Admin'
    });

    await admin.save();
    console.log('Admin user seeded');
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
