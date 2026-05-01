// Admin API Routes - Add this to server.js

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check against admin credentials from .env
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      res.status(200).json({
        message: 'Admin login successful',
        admin: { email, role: 'admin' },
        token: 'admin_token_here'
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      total: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Details
app.get('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete User
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Products (Admin View)
app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      total: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Product
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Product
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      total: orders.length,
      orders,
      stats: {
        pending: await Order.countDocuments({ status: 'Pending' }),
        processing: await Order.countDocuments({ status: 'Processing' }),
        completed: await Order.countDocuments({ status: 'Completed' }),
        cancelled: await Order.countDocuments({ status: 'Cancelled' })
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Order Details
app.get('/api/admin/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Order Status
app.put('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Dashboard Stats
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    
    res.status(200).json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add New Product
app.post('/api/admin/products/create', async (req, res) => {
  try {
    const { name, price, category, image, description, stock, rating } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }
    
    const product = new Product({
      name,
      price,
      category,
      image: image || 'https://via.placeholder.com/300x300',
      description: description || '',
      stock: stock || 0,
      rating: rating || 0
    });
    
    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify Bank Transfer Payment
app.post('/api/admin/verify-bank-transfer', async (req, res) => {
  try {
    const { orderId, verified } = req.body;
    
    const newStatus = verified ? 'Processing' : 'Cancelled';
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );
    
    res.status(200).json({
      message: `Payment ${verified ? 'verified' : 'rejected'}`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate Sales Report
app.get('/api/admin/reports/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    
    const sales = await Order.find(query).sort({ createdAt: -1 });
    
    const totalSales = sales.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    res.status(200).json({
      report: {
        period: { startDate, endDate },
        totalSales,
        totalOrders,
        avgOrderValue: avgOrderValue.toFixed(2),
        orders: sales
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export this to use in main server.js
module.exports = {
  // Admin routes are exported as middleware functions if needed
};
