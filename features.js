// Enhanced Features - Reviews, Analytics, Notifications
// Add this to server.js after existing routes

const nodemailer = require('nodemailer'); // for email notifications

// ========== REVIEW SYSTEM ==========

const reviewSchema = new mongoose.Schema({
  productId: String,
  userId: String,
  userName: String,
  rating: { type: Number, min: 1, max: 5 },
  title: String,
  comment: String,
  verified: Boolean,
  helpful: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Post Product Review
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
      comment: comment || '',
      verified: true
    });

    await review.save();

    // Update product average rating
    const allReviews = await Review.find({ productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await Product.findByIdAndUpdate(productId, { rating: avgRating.toFixed(1) });

    res.status(201).json({ message: 'Review posted successfully', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Product Reviews
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 });
    
    const stats = {
      total: reviews.length,
      avgRating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      }
    };

    res.status(200).json({ stats, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark Review as Helpful
app.put('/api/reviews/:id/helpful', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    res.status(200).json({ message: 'Marked as helpful', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ANALYTICS SYSTEM ==========

// Get Sales Analytics
app.get('/api/analytics/sales', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await Order.find({ createdAt: { $gte: startDate } });

    const dailySales = {};
    sales.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + order.total;
    });

    const totalRevenue = sales.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

    res.status(200).json({
      period: { days, startDate },
      totalRevenue,
      totalOrders: sales.length,
      avgOrderValue: avgOrderValue.toFixed(2),
      dailySales,
      topPaymentMethods: getPaymentMethodStats(sales)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Product Analytics
app.get('/api/analytics/products', async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find();

    const productStats = products.map(product => {
      const ordersWithProduct = orders.filter(order =>
        order.items.some(item => item.productId === product._id.toString())
      );

      const revenue = ordersWithProduct.reduce((sum, order) => {
        const itemTotal = order.items
          .filter(item => item.productId === product._id.toString())
          .reduce((s, item) => s + (item.price * item.quantity), 0);
        return sum + itemTotal;
      }, 0);

      return {
        productId: product._id,
        name: product.name,
        category: product.category,
        rating: product.rating,
        unitsSold: ordersWithProduct.reduce((sum, order) =>
          sum + order.items
            .filter(item => item.productId === product._id.toString())
            .reduce((s, item) => s + item.quantity, 0), 0),
        revenue,
        views: ordersWithProduct.length
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      totalProducts: products.length,
      topProducts: productStats.slice(0, 10),
      allProducts: productStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Customer Analytics
app.get('/api/analytics/customers', async (req, res) => {
  try {
    const users = await User.find();
    const orders = await Order.find();

    const customerStats = users.map(user => {
      const userOrders = orders.filter(o => o.userId === user._id.toString());
      const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        totalOrders: userOrders.length,
        totalSpent,
        avgOrderValue: userOrders.length > 0 ? totalSpent / userOrders.length : 0,
        lastOrder: userOrders.length > 0 ? userOrders[userOrders.length - 1].createdAt : null,
        joinDate: user.createdAt
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    res.status(200).json({
      totalCustomers: users.length,
      topCustomers: customerStats.slice(0, 10),
      avgCustomerValue: customerStats.length > 0
        ? customerStats.reduce((sum, c) => sum + c.totalSpent, 0) / customerStats.length
        : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== USER PROFILE ENHANCEMENT ==========

// Get User Profile
app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const orders = await Order.find({ userId: req.params.id });

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
      totalItems: orders.reduce((sum, o) =>
        sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
      joinDate: user.createdAt,
      lastOrder: orders.length > 0 ? orders[orders.length - 1].createdAt : null
    };

    res.status(200).json({ user, stats, recentOrders: orders.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update User Profile
app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== NOTIFICATION SYSTEM ==========

const notificationSchema = new mongoose.Schema({
  userId: String,
  type: String, // 'order_status', 'new_product', 'promo', 'review_reply'
  title: String,
  message: String,
  link: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Get User Notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      unread: notifications.filter(n => !n.read).length,
      notifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark Notification as Read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.status(200).json({ notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      link
    });

    await notification.save();
    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== WISHLIST ENHANCEMENT ==========

const wishlistSchema = new mongoose.Schema({
  userId: String,
  products: [String], // Product IDs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// Get User Wishlist
app.get('/api/wishlist/:userId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId });

    if (!wishlist) {
      return res.status(200).json({ products: [] });
    }

    res.status(200).json({ wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to Wishlist
app.post('/api/wishlist/:userId/add', async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId: req.params.userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.params.userId,
        products: [productId]
      });
    } else if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    res.status(200).json({ message: 'Added to wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove from Wishlist
app.delete('/api/wishlist/:userId/remove/:productId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId });

    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        id => id !== req.params.productId
      );
      await wishlist.save();
    }

    res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== HELPER FUNCTIONS ==========

function getPaymentMethodStats(orders) {
  const stats = {
    card: 0,
    transfer: 0,
    ussd: 0,
    cash: 0
  };

  orders.forEach(order => {
    if (stats.hasOwnProperty(order.paymentMethod)) {
      stats[order.paymentMethod]++;
    }
  });

  return stats;
}

// ========== EMAIL NOTIFICATIONS ==========

// Send Order Confirmation Email
async function sendOrderEmail(order, userEmail) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const itemsList = order.items.map(item =>
      `<li>${item.name} x${item.quantity} - ₦${item.price.toLocaleString()}</li>`
    ).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Confirmation - #${order._id}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <h3>Items:</h3>
        <ul>${itemsList}</ul>
        <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
        <p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>
        <p>We will contact you shortly at ${order.phone}</p>
      `
    };

    // Uncomment when email is configured
    // await transporter.sendMail(mailOptions);
    console.log('Email would be sent to:', userEmail);
  } catch (error) {
    console.log('Email sending failed:', error.message);
  }
}

// Export for use
module.exports = {
  Review,
  Notification,
  Wishlist,
  sendOrderEmail
};
