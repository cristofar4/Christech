const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/christech')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));
// ==================== BREVO EMAIL SETUP ====================
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY
  }
});

// Welcome Email Function
async function sendWelcomeEmail(name, email, method = 'email') {
  const mailOptions = {
    from: `"Christech" <christopherpraise159@gmail.com>`,   // Your email as sender
    to: email,
    subject: `Welcome to Christech, ${name.split(' ')[0]}! 🎉`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto; padding:30px; background:#f9fafb; border-radius:12px;">
        <h2 style="color:#0a2540;">Welcome to Christech!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for joining Christech — Owerri's most trusted premium tech store.</p>
        <p>You signed up using <strong>${method}</strong>.</p>
        
        <p>We're excited to have you! You can now enjoy:</p>
        <ul>
          <li>Fast delivery in Owerri</li>
          <li>Original products with warranty</li>
          <li>Best prices & exclusive deals</li>
        </ul>
        
        <p>Any questions? Chat us on WhatsApp: 
          <a href="https://wa.me/2348102797105" style="color:#0077ff">08102797105</a>
        </p>
        
        <p>Best regards,<br><strong>Christech Team</strong></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (err) {
    console.error('❌ Brevo Email Error:', err.message);
  }
}
// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  method: { type: String, default: 'email' },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  image: String,
  rating: Number,
  description: String,
  stock: Number,
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: Array,
  total: Number,
  status: { type: String, default: 'Pending' },
  paymentMethod: String,
  deliveryAddress: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// ==================== ROUTES ====================

app.use(express.static(path.join(__dirname, 'public')));

// Register Route with Welcome Email
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const user = new User({ name, email, password, phone, method: 'email' });
    await user.save();

    // Send Welcome Email
    await sendWelcomeEmail(name, email, 'email');

    res.json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || user.password !== req.body.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Other Routes
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

app.post('/api/orders', async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.json(order);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Christech Server running on port ${PORT}`);
});