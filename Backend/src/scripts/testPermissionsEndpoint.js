const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');

async function testApi() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/garment_erp';
  await mongoose.connect(mongoUri);
  
  const user = await User.findOne({});
  if (!user) {
    console.log('No user found in DB');
    process.exit(1);
  }

  console.log('Found User in DB:', user.name, user.email, 'Role:', user.role);

  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
  const token = jwt.sign({ id: user._id, tenantId: user.tenantId, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

  const req = http.request('http://localhost:5000/api/permissions', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('HTTP Status Code:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Success:', parsed.success);
        console.log('Roles in response:', Object.keys(parsed.data || {}));
        console.log('Worker permissions:', JSON.stringify(parsed.data?.worker || parsed.defaults?.worker));
      } catch (e) {
        console.log('Response body:', data);
      }
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });

  req.end();
}

testApi();
