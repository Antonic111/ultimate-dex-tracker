const mongoose = require('mongoose');
const User = require('./server/models/User.js');

// Update this with your actual username
const YOUR_USERNAME = 'your-username-here';

async function makeAdmin() {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name');
    console.log('Connected to database');
    
    // Find and update your user
    const user = await User.findOne({ username: YOUR_USERNAME });
    if (user) {
      user.isAdmin = true;
      await user.save();
      console.log(`✅ User "${YOUR_USERNAME}" is now an admin!`);
    } else {
      console.log(`❌ User "${YOUR_USERNAME}" not found`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();
