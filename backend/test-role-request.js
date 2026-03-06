// Quick test script for role request endpoint
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Generate a test token
const testToken = jwt.sign(
  { 
    userId: '507f1f77bcf86cd799439011', // sample user ID
    email: 'test@example.com',
    role: 'user' 
  },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '7d' }
);

console.log('Generated test token:', testToken.substring(0, 50) + '...');

// Test the endpoint
async function testRoleRequest() {
  try {
    const response = await fetch('http://localhost:3000/api/user/role-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestedRole: 'editor'
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRoleRequest();
