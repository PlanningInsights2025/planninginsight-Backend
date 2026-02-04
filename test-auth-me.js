// Quick test to check what /auth/me returns
const testAuthMe = async () => {
  try {
    // You need to replace this with a real token from localStorage
    const token = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';
    
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📥 /auth/me response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n🔍 Does it include role?', data.role || data.data?.role ? 'YES ✅' : 'NO ❌');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Get token from browser console:
console.log('🔐 To test this:');
console.log('1. Open your browser console on the website');
console.log('2. Run: localStorage.getItem("authToken")');
console.log('3. Copy the token');
console.log('4. Run: TEST_TOKEN="your-token" node test-auth-me.js');
console.log('\nOR just check the response in browser Network tab when you visit profile page');

testAuthMe();
