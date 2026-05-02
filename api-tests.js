// ===== CHRISTECH API TESTING SCRIPT =====
// Use this with Postman or Node.js to test all endpoints
// Run: node api-tests.js

const BASE_URL = 'http://localhost:5000';
let authToken = null;
let userId = null;
let productId = null;
let orderId = null;

// Test Data
const testUser = {
  username: 'testuser_' + Date.now(),
  email: 'test_' + Date.now() + '@example.com',
  password: 'TestPassword123!',
  phone: '+234801234567'
};

const testProduct = {
  name: 'PlayStation 5',
  category: 'gaming',
  price: 75000,
  image: 'https://images.unsplash.com/photo-1606841837239-c5a1a8e9b9e9',
  description: 'Next-gen gaming console'
};

// ===== API HELPERS =====

async function apiCall(endpoint, method = 'GET', body = null, useAuth = false) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (useAuth && authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`\n✓ ${method} ${endpoint}`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error(`✗ ${method} ${endpoint}`);
    console.error('Error:', error.message);
    return null;
  }
}

// ===== TEST SUITE =====

async function runTests() {
  console.log(`
╔════════════════════════════════════════════╗
║     ChrisTech API Testing Suite             ║
║     Base URL: ${BASE_URL}        ║
╚════════════════════════════════════════════╝
  `);

  // Test 1: Register User
  console.log('\n📝 TEST 1: Register User');
  const registerRes = await apiCall('/api/auth/register', 'POST', testUser);
  if (registerRes && registerRes.token) {
    authToken = registerRes.token;
    userId = registerRes.user.id;
    console.log('✅ User registered successfully');
  }

  // Test 2: Login User
  console.log('\n🔐 TEST 2: Login User');
  const loginRes = await apiCall('/api/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  if (loginRes && loginRes.token) {
    authToken = loginRes.token;
    console.log('✅ Login successful');
  }

  // Test 3: Get All Products
  console.log('\n📦 TEST 3: Get All Products');
  const productsRes = await apiCall('/api/products', 'GET');
  if (productsRes && Array.isArray(productsRes)) {
    console.log(`✅ Found ${productsRes.length} products`);
    if (productsRes.length > 0) {
      productId = productsRes[0]._id;
    }
  }

  // Test 4: Create Product (Admin)
  console.log('\n🛍️ TEST 4: Create Product');
  const createProdRes = await apiCall('/api/products', 'POST', testProduct, true);
  if (createProdRes && createProdRes.product) {
    productId = createProdRes.product._id;
    console.log('✅ Product created successfully');
  }

  // Test 5: Get Single Product
  console.log('\n🔍 TEST 5: Get Single Product');
  if (productId) {
    await apiCall(`/api/products/${productId}`, 'GET');
  }

  // Test 6: Post Review
  console.log('\n⭐ TEST 6: Post Product Review');
  if (productId) {
    const reviewRes = await apiCall('/api/reviews', 'POST', {
      productId: productId,
      userId: userId,
      userName: testUser.username,
      rating: 5,
      title: 'Excellent product!',
      comment: 'Very satisfied with the quality and fast delivery'
    });
    if (reviewRes && reviewRes.review) {
      console.log('✅ Review posted successfully');
    }
  }

  // Test 7: Get Product Reviews
  console.log('\n📋 TEST 7: Get Product Reviews');
  if (productId) {
    await apiCall(`/api/products/${productId}/reviews`, 'GET');
  }

  // Test 8: Create Order
  console.log('\n🛒 TEST 8: Create Order');
  if (productId && userId) {
    const orderRes = await apiCall('/api/orders', 'POST', {
      userId: userId,
      items: [
        {
          productId: productId,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1
        }
      ],
      total: testProduct.price,
      paymentMethod: 'Card',
      address: '123 Main Street, Lagos, Nigeria'
    });
    if (orderRes && orderRes.order) {
      orderId = orderRes.order._id;
      console.log('✅ Order created (check your email for confirmation)');
    }
  }

  // Test 9: Get User Orders
  console.log('\n📨 TEST 9: Get User Orders');
  if (userId) {
    await apiCall(`/api/orders/${userId}`, 'GET');
  }

  // Test 10: Update Order Status
  console.log('\n📦 TEST 10: Update Order Status');
  if (orderId) {
    const updateRes = await apiCall(`/api/orders/${orderId}/status`, 'PUT', {
      status: 'processing'
    });
    if (updateRes) {
      console.log('✅ Order status updated (check your email for notification)');
    }
  }

  // Test 11: Track Analytics Event
  console.log('\n📊 TEST 11: Track Analytics Event');
  await apiCall('/api/analytics', 'POST', {
    userId: userId,
    event: 'purchase',
    productId: productId
  });

  // Test 12: Get Analytics Dashboard
  console.log('\n📈 TEST 12: Get Analytics Dashboard');
  await apiCall('/api/analytics/dashboard', 'GET');

  // Test 13: Get User Profile
  console.log('\n👤 TEST 13: Get User Profile');
  if (userId) {
    await apiCall(`/api/users/${userId}`, 'GET', null, true);
  }

  // Test 14: Update User Profile
  console.log('\n✏️ TEST 14: Update User Profile');
  if (userId) {
    await apiCall(`/api/users/${userId}/profile`, 'PUT', {
      phone: '+2347012345678',
      address: '456 Updated Street, Abuja, Nigeria'
    }, true);
  }

  // Test 15: Admin Dashboard
  console.log('\n🔑 TEST 15: Admin Dashboard');
  await apiCall('/api/admin/dashboard', 'GET');

  console.log(`
╔════════════════════════════════════════════╗
║     All Tests Completed!                    ║
║     Check results above for any failures    ║
╚════════════════════════════════════════════╝
  `);
}

// ===== MANUAL TEST EXAMPLES =====

// Uncomment and run individual tests:

// Test single endpoint:
// apiCall('/api/products', 'GET').then(data => console.log(data));

// Test with authentication:
// apiCall('/api/users/USER_ID', 'GET', null, true).then(data => console.log(data));

// ===== RUN ALL TESTS =====
if (require.main === module) {
  runTests().catch(err => console.error('Test suite error:', err));
}

module.exports = { apiCall, testUser, testProduct };
