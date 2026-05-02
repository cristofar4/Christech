// ===== CHRISTECH E-COMMERCE SERVER (COMPLETE) =====
// Express.js Backend with all features: Auth, Products, Orders, Reviews, Analytics, Notifications
// Run: npm install && node server-complete.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/christech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✓ MongoDB Connected'))
  .catch(err => console.error('✗ MongoDB Error:', err));

// ===== SCHEMAS =====

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: String,
  googleId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  price: { type: Number, required: true },
  image: String,
  description: String,
  rating: { type: Number, default: 0 },
  reviews_count: { type: Number, default: 0 },
  in_stock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  userName: { type: String, default: 'Anonymous' },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: String,
  comment: String,
  verified: { type: Boolean, default: true },
  helpful: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: { type: String, default: 'pending' }, // pending, processing, shipped, delivered
  paymentMethod: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  event: String, // view, click, add_to_cart, purchase
  productId: mongoose.Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const Order = mongoose.model('Order', orderSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

// ===== EMAIL CONFIG =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// ===== AUTHENTICATION ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      phone: phone || ''
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Send welcome email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to ChrisTech! 🎉',
      html: `<h2>Welcome, ${username}!</h2><p>Your account has been created successfully.</p>`
    }).catch(err => console.log('Email error:', err.message));

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, username, email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// ===== PRODUCT ROUTES =====

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create product (admin)
app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, image, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price required' });
    }

    const product = new Product({
      name,
      category: category || 'General',
      price,
      image: image || '/default-product.jpg',
      description: description || ''
    });

    await product.save();
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product (admin)
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product (admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// ===== REVIEW ROUTES =====

// Post review
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, userId, userName, rating, title, comment } = req.body;

    if (!productId || !rating || !title) {
      return res.status(400).json({ message: 'Product ID, rating, and title required' });
    }

    const review = new Review({
      productId,
      userId,
      userName: userName || 'Anonymous',
      rating: Math.min(5, Math.max(1, rating)),
      title,
      comment: comment || ''
    });

    await review.save();

    // Update product rating
    const allReviews = await Review.find({ productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(avgRating.toFixed(1)),
      reviews_count: allReviews.length
    });

    res.status(201).json({ message: 'Review posted successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post review' });
  }
});

// Get product reviews
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// ===== ORDER ROUTES =====

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, total, paymentMethod, address } = req.body;

    if (!userId || !items || !total) {
      return res.status(400).json({ message: 'User ID, items, and total required' });
    }

    const order = new Order({
      userId,
      items,
      total,
      paymentMethod: paymentMethod || 'Card',
      address
    });

    await order.save();

    // Send order confirmation email
    const user = await User.findById(userId);
    if (user) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '✅ Order Confirmation - ChrisTech',
        html: `<h2>Order #${order._id}</h2><p>Total: ₦${total}</p><p>Thank you for your purchase!</p>`
      }).catch(err => console.log('Email error:', err.message));
    }

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get user orders
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Send status update email
    const user = await User.findById(order.userId);
    if (user) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `📦 Order Status Update: ${status.toUpperCase()}`,
        html: `<h2>Your Order #${order._id} is now ${status}</h2>`
      }).catch(err => console.log('Email error:', err.message));
    }

    res.json({ message: 'Order updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// ===== ANALYTICS ROUTES =====

// Track user event
app.post('/api/analytics', async (req, res) => {
  try {
    const { userId, event, productId } = req.body;

    if (!event) {
      return res.status(400).json({ message: 'Event type required' });
    }

    const analytics = new Analytics({
      userId,
      event,
      productId
    });

    await analytics.save();
    res.status(201).json({ message: 'Event tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to track event' });
  }
});

// Get analytics dashboard (admin)
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.price' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);
    const totalUsers = await User.countDocuments();

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      topProducts,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// ===== USER ROUTES =====

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user profile
app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const { phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { phone, address, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ===== ADMIN ROUTES =====

// Admin dashboard
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const stats = {
      totalOrders: await Order.countDocuments(),
      totalRevenue: (await Order.aggregate([
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]))[0]?.total || 0,
      totalUsers: await User.countDocuments(),
      totalProducts: await Product.countDocuments(),
      totalReviews: await Review.countDocuments(),
      pendingOrders: await Order.countDocuments({ status: 'pending' })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   ChrisTech Server Running!             ║
  ║   🚀 http://localhost:${PORT}           ║
  ║   📊 API: /api/*                        ║
  ║   📈 Analytics: /api/analytics/dashboard║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
