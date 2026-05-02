# ChrisTech API Documentation

## Base URL
```
Development: http://localhost:5000
Production: https://christech-api.herokuapp.com (after deployment)
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📝 Authentication Endpoints

### 1. Register User
Create a new user account.

**Endpoint:**
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+234801234567"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - Email already registered

---

### 2. Login User
Authenticate user and receive JWT token.

**Endpoint:**
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `404` - User not found
- `401` - Invalid password

---

## 🛍️ Product Endpoints

### 3. Get All Products
Retrieve all products in the catalog.

**Endpoint:**
```
GET /api/products
```

**Query Parameters:**
- `category` (optional): Filter by category (e.g., `gaming`, `phones`, `accessories`)
- `sort` (optional): Sort by field (e.g., `price`, `rating`)

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nintendo NES",
    "category": "gaming",
    "price": 15000,
    "image": "https://images.unsplash.com/photo-...",
    "description": "Classic gaming console",
    "rating": 4.5,
    "reviews_count": 12,
    "in_stock": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### 4. Get Single Product
Retrieve details of a specific product.

**Endpoint:**
```
GET /api/products/:id
```

**Parameters:**
- `id` (required): Product ID

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Nintendo NES",
  "category": "gaming",
  "price": 15000,
  "image": "https://images.unsplash.com/photo-...",
  "description": "Classic gaming console",
  "rating": 4.5,
  "reviews_count": 12,
  "in_stock": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `404` - Product not found

---

### 5. Create Product (Admin)
Add a new product to the catalog.

**Endpoint:**
```
POST /api/products
```

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "name": "PlayStation 5",
  "category": "gaming",
  "price": 75000,
  "image": "https://images.unsplash.com/photo-...",
  "description": "Next-gen gaming console"
}
```

**Response (201 Created):**
```json
{
  "message": "Product created",
  "product": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "PlayStation 5",
    "category": "gaming",
    "price": 75000,
    "image": "https://images.unsplash.com/photo-...",
    "description": "Next-gen gaming console",
    "rating": 0,
    "reviews_count": 0,
    "in_stock": true,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Name and price required
- `401` - Unauthorized (invalid/missing token)

---

### 6. Update Product (Admin)
Modify an existing product.

**Endpoint:**
```
PUT /api/products/:id
```

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "price": 70000,
  "in_stock": false
}
```

**Response (200 OK):**
```json
{
  "message": "Product updated",
  "product": { /* Updated product object */ }
}
```

---

### 7. Delete Product (Admin)
Remove a product from the catalog.

**Endpoint:**
```
DELETE /api/products/:id
```

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Product deleted"
}
```

---

## ⭐ Review Endpoints

### 8. Post Product Review
Submit a review and rating for a product.

**Endpoint:**
```
POST /api/reviews
```

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439010",
  "userName": "John Doe",
  "rating": 5,
  "title": "Amazing product!",
  "comment": "Exceeded my expectations. Highly recommended!"
}
```

**Response (201 Created):**
```json
{
  "message": "Review posted successfully",
  "review": {
    "_id": "507f1f77bcf86cd799439013",
    "productId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439010",
    "userName": "John Doe",
    "rating": 5,
    "title": "Amazing product!",
    "comment": "Exceeded my expectations. Highly recommended!",
    "verified": true,
    "helpful": 0,
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Product ID, rating, and title required

---

### 9. Get Product Reviews
Retrieve all reviews for a product.

**Endpoint:**
```
GET /api/products/:id/reviews
```

**Parameters:**
- `id` (required): Product ID

**Query Parameters:**
- `rating` (optional): Filter by star rating (1-5)
- `sort` (optional): Sort by `helpful` or `recent`

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "productId": "507f1f77bcf86cd799439011",
    "userName": "John Doe",
    "rating": 5,
    "title": "Amazing product!",
    "comment": "Exceeded my expectations. Highly recommended!",
    "verified": true,
    "helpful": 23,
    "createdAt": "2024-01-15T12:00:00Z"
  }
]
```

---

## 🛒 Order Endpoints

### 10. Create Order
Place a new order.

**Endpoint:**
```
POST /api/orders
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439010",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "name": "Nintendo NES",
      "price": 15000,
      "quantity": 1
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "name": "Super Mario",
      "price": 8000,
      "quantity": 2
    }
  ],
  "total": 31000,
  "paymentMethod": "Card",
  "address": "123 Main Street, Lagos, Nigeria"
}
```

**Response (201 Created):**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439010",
    "items": [ /* ... */ ],
    "total": 31000,
    "status": "pending",
    "paymentMethod": "Card",
    "address": "123 Main Street, Lagos, Nigeria",
    "createdAt": "2024-01-15T13:00:00Z"
  }
}
```

**Note:** Order confirmation email will be sent automatically.

**Error Responses:**
- `400` - User ID, items, and total required

---

### 11. Get User Orders
Retrieve all orders for a specific user.

**Endpoint:**
```
GET /api/orders/:userId
```

**Parameters:**
- `userId` (required): User ID

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439010",
    "items": [ /* ... */ ],
    "total": 31000,
    "status": "processing",
    "paymentMethod": "Card",
    "address": "123 Main Street, Lagos, Nigeria",
    "createdAt": "2024-01-15T13:00:00Z"
  }
]
```

---

### 12. Update Order Status
Change order status (admin only).

**Endpoint:**
```
PUT /api/orders/:id/status
```

**Parameters:**
- `id` (required): Order ID

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "status": "shipped"
}
```

**Valid Status Values:**
- `pending` - Order received
- `processing` - Being prepared
- `shipped` - On the way
- `delivered` - Successfully delivered

**Response (200 OK):**
```json
{
  "message": "Order updated",
  "order": { /* Updated order object */ }
}
```

**Note:** Status update email will be sent to customer automatically.

---

## 📊 Analytics Endpoints

### 13. Track Event
Record user interaction events for analytics.

**Endpoint:**
```
POST /api/analytics
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439010",
  "event": "add_to_cart",
  "productId": "507f1f77bcf86cd799439011"
}
```

**Valid Event Types:**
- `view` - Product viewed
- `click` - Element clicked
- `add_to_cart` - Item added to cart
- `purchase` - Purchase completed
- `search` - Search performed

**Response (201 Created):**
```json
{
  "message": "Event tracked"
}
```

---

### 14. Get Analytics Dashboard
Retrieve sales analytics and insights (admin only).

**Endpoint:**
```
GET /api/analytics/dashboard
```

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response (200 OK):**
```json
{
  "totalOrders": 145,
  "totalRevenue": 3750000,
  "totalUsers": 89,
  "topProducts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "count": 42,
      "revenue": 630000
    }
  ],
  "recentOrders": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "507f1f77bcf86cd799439010",
      "total": 31000,
      "status": "shipped",
      "createdAt": "2024-01-15T13:00:00Z"
    }
  ]
}
```

---

## 👤 User Endpoints

### 15. Get User Profile
Retrieve user account information.

**Endpoint:**
```
GET /api/users/:id
```

**Parameters:**
- `id` (required): User ID

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439010",
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+234801234567",
  "address": "123 Main Street, Lagos",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-01-15T15:00:00Z"
}
```

**Error Responses:**
- `404` - User not found
- `401` - Unauthorized

---

### 16. Update User Profile
Modify user account information.

**Endpoint:**
```
PUT /api/users/:id/profile
```

**Parameters:**
- `id` (required): User ID

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "phone": "+2347012345678",
  "address": "456 New Street, Abuja, Nigeria"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated",
  "user": {
    "_id": "507f1f77bcf86cd799439010",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+2347012345678",
    "address": "456 New Street, Abuja, Nigeria",
    "updatedAt": "2024-01-15T16:00:00Z"
  }
}
```

---

## 🔑 Admin Endpoints

### 17. Admin Dashboard
Get comprehensive admin analytics (admin only).

**Endpoint:**
```
GET /api/admin/dashboard
```

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response (200 OK):**
```json
{
  "totalOrders": 145,
  "totalRevenue": 3750000,
  "totalUsers": 89,
  "totalProducts": 24,
  "totalReviews": 267,
  "pendingOrders": 12
}
```

---

## 🔴 Error Responses

All error responses follow this format:

```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🔒 Security Best Practices

1. **Store Token Securely**: Keep JWT tokens in secure storage (not localStorage in production)
2. **Use HTTPS**: Always use HTTPS in production
3. **Validate Input**: Client and server should validate all inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **CORS**: Configure CORS properly for your domain
6. **Environment Variables**: Never commit API keys to version control

---

## 📌 Common Implementation Examples

### Example: User Registration & Login Flow

```javascript
// 1. Register
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('token', data.token);
  console.log('Registered!');
});

// 2. Login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('token', data.token);
  console.log('Logged in!');
});

// 3. Use token for authenticated requests
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/users/USER_ID', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log('User profile:', data));
```

### Example: Place Order with Email Notification

```javascript
fetch('http://localhost:5000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USER_ID',
    items: [
      {
        productId: 'PRODUCT_ID',
        name: 'Nintendo NES',
        price: 15000,
        quantity: 1
      }
    ],
    total: 15000,
    paymentMethod: 'Card',
    address: '123 Main Street, Lagos'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Order created:', data.order);
  // Customer automatically receives confirmation email
});
```

---

## 📞 API Support

For issues or questions:
1. Check this documentation
2. Review error responses
3. Check MongoDB connection
4. Verify .env configuration
5. Check server logs: `heroku logs --tail`

**Last Updated**: January 2024  
**Version**: 1.0.0
