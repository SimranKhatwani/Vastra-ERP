const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./src/models/userModel');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne();
    
    if (!user) {
      console.log("No user found!");
      process.exit(1);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log("Got token for", user.name);

    // 2. Fetch stats
    const statsRes = await axios.get('http://localhost:5000/api/attendance/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Stats:", statsRes.data);

    // 3. Get Policy
    const policyRes = await axios.get('http://localhost:5000/api/attendance/policy', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Policy:", policyRes.data);

    // 4. Punch In
    const Employee = require('./src/models/employeeModel');
    const emp = await Employee.findOne({ tenantId: user.tenantId });
    
    if (emp) {
      const punchRes = await axios.post('http://localhost:5000/api/attendance/punch-in', {
        employeeId: emp._id,
        location: 'Test',
        device: 'Test',
        ip: '127.0.0.1'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Punch In:", punchRes.data);
    } else {
      console.log("No employee found to punch in.");
    }

  } catch (err) {
    if (err.response) {
      console.error("API Error:", err.response.data);
    } else {
      console.error("Request Error:", err.message);
    }
  } finally {
    mongoose.disconnect();
  }
}

test();
