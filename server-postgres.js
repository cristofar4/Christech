require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== POSTGRESQL CONNECTION =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ===== SUPABASE CLIENT (for Auth / Phone OTP) =====
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  console.log('✅ Supabase client ready');
} else {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — phone OTP disabled');
}

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => console.error('❌ PostgreSQL Error:', err.message));

// ===== INITIALIZE DATABASE TABLES =====
async function initializeDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        phone VARCHAR(20) DEFAULT '',
        address TEXT DEFAULT '',
        method VARCHAR(50) DEFAULT 'email',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100),
        category VARCHAR(100),
        price NUMERIC(12,2) NOT NULL,
        old_price NUMERIC(12,2),
        rating NUMERIC(2,1) DEFAULT 0,
        reviews_count INT DEFAULT 0,
        image TEXT,
        description TEXT,
        tag VARCHAR(50),
        featured BOOLEAN DEFAULT false,
        is_new BOOLEAN DEFAULT false,
        in_stock BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255) DEFAULT 'Anonymous',
        rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        title VARCHAR(255),
        comment TEXT,
        helpful INT DEFAULT 0,
        verified BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        items JSONB NOT NULL,
        total NUMERIC(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_method VARCHAR(50),
        payment_details JSONB,
        address TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_cards (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        card_last4 VARCHAR(4),
        card_name VARCHAR(255),
        card_expiry VARCHAR(5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        event VARCHAR(100) NOT NULL,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255),
        phone VARCHAR(20) DEFAULT '',
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS phone_verifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ All database tables ready');
  } catch (err) {
    console.error('❌ DB Init Error:', err.message);
  }
}

initializeDB();

// ===== EMAIL CONFIG (Brevo) =====
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL || '',
    pass: process.env.BREVO_SMTP_KEY || ''
  }
});

async function sendWelcomeEmail(name, email) {
  try {
    await transporter.sendMail({
      from: `"Christech" <${process.env.BREVO_EMAIL || 'christopherpraise159@gmail.com'}>`,
      to: email,
      subject: `Welcome to Christech, ${name.split(' ')[0]}! 🎉`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#0a2540;">Welcome to Christech!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thank you for joining Christech — Owerri's most trusted premium tech store.</p>
          <ul>
            <li>⚡ Fast delivery in Owerri</li>
            <li>✅ Original products with warranty</li>
            <li>💰 Best prices & exclusive deals</li>
          </ul>
          <p>Questions? Chat us on WhatsApp: <a href="https://wa.me/2348102797105">08102797105</a></p>
          <p>Best regards,<br><strong>Christech Team</strong></p>
        </div>
      `
    });
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (err) {
    console.log('📧 Email skipped (check Brevo config):', err.message);
  }
}

async function sendOrderEmail(email, orderId, total, status, items) {
  try {
    const itemsHtml = Array.isArray(items) && items.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f3f4f6">
            <th style="text-align:left;padding:8px 10px;font-size:13px;color:#6b7280">Item</th>
            <th style="text-align:center;padding:8px 10px;font-size:13px;color:#6b7280">Qty</th>
            <th style="text-align:right;padding:8px 10px;font-size:13px;color:#6b7280">Price</th>
          </tr></thead>
          <tbody>${items.map(it => `
            <tr style="border-bottom:1px solid #e5e7eb">
              <td style="padding:10px;font-size:14px">${it.name || it.title || 'Product'}</td>
              <td style="padding:10px;text-align:center;font-size:14px">${it.qty || it.quantity || 1}</td>
              <td style="padding:10px;text-align:right;font-size:14px">₦${Number((it.price || 0) * (it.qty || it.quantity || 1)).toLocaleString()}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      : '';

    const isNew = status === 'Pending';
    await transporter.sendMail({
      from: `"Christech" <${process.env.BREVO_EMAIL || 'christopherpraise159@gmail.com'}>`,
      to: email,
      subject: isNew ? `✅ Order #${orderId} Confirmed — Christech` : `📦 Order #${orderId} Update: ${status}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f9fafb;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#0a2540,#0077ff);padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h2 style="color:#fff;margin:0;font-size:22px">${isNew ? '✅ Order Confirmed!' : '📦 Order Update'}</h2>
            <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:14px">Order #${orderId}</p>
          </div>
          <p style="font-size:15px">Your order status: <strong style="color:#0a2540">${status}</strong></p>
          ${itemsHtml}
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:16px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:15px;color:#6b7280">Order Total</span>
              <span style="font-size:20px;font-weight:700;color:#0a2540">₦${Number(total).toLocaleString()}</span>
            </div>
          </div>
          <p style="margin-top:20px;font-size:14px;color:#6b7280">Questions? Chat us on WhatsApp: <a href="https://wa.me/2348102797105" style="color:#0077ff">08102797105</a></p>
          <p style="font-size:13px;color:#9ca3af">Thank you for shopping with <strong>Christech</strong> — Owerri's trusted premium tech store.</p>
        </div>
      `
    });
    console.log(`✅ Order email sent to ${email} (Order #${orderId})`);
  } catch (err) {
    console.log('📧 Order email skipped:', err.message);
  }
}

async function sendPasswordResetEmail(email, otp) {
  try {
    await transporter.sendMail({
      from: `"Christech" <${process.env.BREVO_EMAIL || 'christopherpraise159@gmail.com'}>`,
      to: email,
      subject: `${otp} — Reset Your Christech Password`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f9fafb;border-radius:12px;">
          <div style="text-align:center;margin-bottom:20px">
            <h2 style="color:#0a2540;margin:0">Reset Your Password</h2>
          </div>
          <p>We received a request to reset your Christech password.</p>
          <p>Use this one-time code to set a new password:</p>
          <div style="background:#0a2540;color:#fff;font-size:40px;font-weight:900;letter-spacing:14px;text-align:center;padding:24px;border-radius:10px;margin:24px 0;font-family:monospace">${otp}</div>
          <p style="color:#666;font-size:14px;">⏱ This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#666;font-size:14px;">🔒 Never share this code. Christech staff will never ask for it.</p>
          <p style="color:#666;font-size:14px;">If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
          <p style="font-size:13px;color:#999">Christech — Owerri's trusted premium tech store<br>
          <a href="https://wa.me/2348102797105" style="color:#0077ff">WhatsApp: 08102797105</a></p>
        </div>
      `
    });
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (err) {
    console.log('📧 Password reset email error:', err.message);
  }
}

// ===== OTP EMAIL / SMS HELPERS =====

async function sendOTPEmail(name, email, otp) {
  if (!process.env.BREVO_SMTP_KEY) {
    throw new Error('BREVO_SMTP_KEY is not set in your environment variables. Add it to your .env file.');
  }
  await transporter.sendMail({
    from: `"Christech" <${process.env.BREVO_EMAIL || 'christopherpraise159@gmail.com'}>`,
    to: email,
    subject: `${otp} — Your Christech Verification Code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px">
          <h2 style="color:#0a2540;margin:0">Verify Your Email</h2>
        </div>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Use this one-time code to complete your Christech account setup:</p>
        <div style="background:#0a2540;color:#fff;font-size:40px;font-weight:900;letter-spacing:14px;text-align:center;padding:24px;border-radius:10px;margin:24px 0;font-family:monospace">${otp}</div>
        <p style="color:#666;font-size:14px;">⏱ This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#666;font-size:14px;">🔒 Never share this code with anyone. Christech staff will never ask for it.</p>
        <p style="color:#666;font-size:14px;">If you did not create an account, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="font-size:13px;color:#999">Christech — Owerri's trusted premium tech store<br>
        <a href="https://wa.me/2348102797105" style="color:#0077ff">WhatsApp: 08102797105</a></p>
      </div>
    `
  });
  console.log(`✅ OTP email sent to ${email}`);
}

// ===== AUTH ROUTES =====

// Register (sends email OTP — does NOT create account yet)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Remove any previous pending verification for this email
    await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);

    // Store the pending registration + OTP (account is NOT created yet)
    await pool.query(
      `INSERT INTO email_verifications (email, name, password, phone, otp, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, name, hashedPassword, phone || '', otp, expiresAt]
    );

    // Send OTP to the user's email
    try {
      await sendOTPEmail(name, email, otp);
    } catch (emailErr) {
      console.error('❌ Email send failed:', emailErr.message);
      // Clean up the pending record so user can try again
      await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);
      return res.status(500).json({
        message: `Could not send verification email: ${emailErr.message}`
      });
    }

    res.status(200).json({
      message: 'Verification code sent to your email',
      pendingVerification: true
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
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'christech-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Verify email OTP — actually creates the user account
app.post('/api/auth/verify-email-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const result = await pool.query(
      `SELECT * FROM email_verifications WHERE email = $1 AND used = false ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'No pending verification found. Please register again.' });
    }

    const record = result.rows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ message: 'Code has expired. Please register again.' });
    }

    if (record.otp !== code.trim()) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Mark OTP as used
    await pool.query('UPDATE email_verifications SET used = true WHERE id = $1', [record.id]);

    // Create the actual user account now
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password, phone, method)
       VALUES ($1, $2, $3, $4, 'email')
       RETURNING id, name, email, phone`,
      [record.name, record.email, record.password, record.phone]
    );

    const user = userResult.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'christech-secret-key',
      { expiresIn: '7d' }
    );

    await sendWelcomeEmail(record.name, record.email);

    res.status(201).json({
      message: 'Email verified! Account created successfully.',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// Resend email OTP
app.post('/api/auth/resend-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const result = await pool.query(
      `SELECT * FROM email_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'No pending registration found. Please sign up again.' });
    }

    const record = result.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'UPDATE email_verifications SET otp = $1, expires_at = $2, used = false WHERE id = $3',
      [otp, expiresAt, record.id]
    );

    await sendOTPEmail(record.name, email, otp);

    res.json({ message: 'New verification code sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend code', error: error.message });
  }
});

// Google Sign-In — verifies Google ID token and signs user in
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'No credential provided' });

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    // Find existing user or create new one
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (result.rows.length === 0) {
      const newUser = await pool.query(
        `INSERT INTO users (name, email, method) VALUES ($1, $2, 'google') RETURNING id, name, email`,
        [name, email]
      );
      user = newUser.rows[0];
    } else {
      user = result.rows[0];
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'christech-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google sign-in successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone || '', picture: picture || '' }
    });
  } catch (error) {
    res.status(401).json({ message: 'Google sign-in failed. Please try again.', error: error.message });
  }
});

// Send phone OTP via Supabase Auth (SMS)
app.post('/api/auth/send-phone-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    if (!supabase) {
      return res.status(503).json({
        message: 'SMS service not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.'
      });
    }

    // Normalise to international format (+234...)
    const toNumber = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;

    const { error } = await supabase.auth.signInWithOtp({ phone: toNumber });

    if (error) {
      console.log('Supabase phone OTP error:', error.message);
      return res.status(500).json({
        message: 'Could not send SMS. Make sure you have enabled Phone provider in your Supabase dashboard (Authentication → Providers → Phone) and configured an SMS provider like Twilio or Vonage.'
      });
    }

    res.json({ message: 'OTP sent to your phone via SMS' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
});

// Verify phone OTP via Supabase Auth
app.post('/api/auth/verify-phone-otp', async (req, res) => {
  try {
    const { phone, code, userId } = req.body;
    if (!code || !phone) return res.status(400).json({ message: 'Phone and code are required' });

    const toNumber = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;

    const { error } = await supabase.auth.verifyOtp({
      phone: toNumber,
      token: code.trim(),
      type: 'sms'
    });

    if (error) {
      return res.status(400).json({ message: 'Invalid or expired code. Please try again.' });
    }

    // Save verified phone to our users table
    if (userId) {
      await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
    }

    res.json({ message: 'Phone number verified successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// Forgot password — sends OTP to email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No account found with that email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);
    await pool.query(
      'INSERT INTO password_resets (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    await sendPasswordResetEmail(email, otp);

    res.json({ message: 'Password reset code sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send reset code', error: error.message });
  }
});

// Reset password — verifies OTP and sets new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const result = await pool.query(
      `SELECT * FROM password_resets WHERE email = $1 AND used = false ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'No reset request found. Please request a new code.' });
    }

    const record = result.rows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });
    }

    if (record.otp !== code.trim()) {
      return res.status(400).json({ message: 'Invalid code. Please try again.' });
    }

    await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [record.id]);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
});

// ===== PRODUCT ROUTES =====

// Get all products (with optional filters)
app.get('/api/products', async (req, res) => {
  try {
    const { category, featured, is_new } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (featured === 'true') query += ' AND featured = true';
    if (is_new === 'true') query += ' AND is_new = true';
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, brand, category, price, old_price, image, description, tag, featured, is_new } = req.body;
    if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

    const result = await pool.query(
      `INSERT INTO products (name, brand, category, price, old_price, image, description, tag, featured, is_new)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, brand, category, price, old_price || null, image, description, tag, featured || false, is_new || false]
    );

    res.status(201).json({ message: 'Product created', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, brand, category, price, old_price, image, description, tag, featured, is_new, in_stock } = req.body;

    const result = await pool.query(
      `UPDATE products SET name=$1, brand=$2, category=$3, price=$4, old_price=$5,
       image=$6, description=$7, tag=$8, featured=$9, is_new=$10, in_stock=$11
       WHERE id=$12 RETURNING *`,
      [name, brand, category, price, old_price, image, description, tag, featured, is_new, in_stock, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// ===== REVIEW ROUTES =====

// Post review
app.post('/api/reviews', async (req, res) => {
  try {
    const { product_id, user_id, user_name, rating, title, comment } = req.body;
    if (!product_id || !rating) return res.status(400).json({ message: 'product_id and rating are required' });

    const result = await pool.query(
      `INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [product_id, user_id || null, user_name || 'Anonymous', rating, title, comment]
    );

    // Recalculate product average rating
    const avgResult = await pool.query(
      'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = $1',
      [product_id]
    );
    const { avg, count } = avgResult.rows[0];
    await pool.query(
      'UPDATE products SET rating=$1, reviews_count=$2 WHERE id=$3',
      [parseFloat(Number(avg).toFixed(1)), parseInt(count), product_id]
    );

    res.status(201).json({ message: 'Review posted', review: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post review', error: error.message });
  }
});

// Get product reviews
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE product_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// ===== ORDER ROUTES =====

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, items, total, payment_method, payment_details, address, phone } = req.body;
    if (!user_id || !items || !total) return res.status(400).json({ message: 'user_id, items, and total are required' });

    const result = await pool.query(
      `INSERT INTO orders (user_id, items, total, payment_method, payment_details, address, phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [user_id, JSON.stringify(items), total, payment_method || 'Card', JSON.stringify(payment_details || {}), address, phone]
    );

    const order = result.rows[0];

    const userResult = await pool.query('SELECT email FROM users WHERE id=$1', [user_id]);
    if (userResult.rows.length > 0) {
      await sendOrderEmail(userResult.rows[0].email, order.id, total, 'Pending', items);
    }

    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Get orders for a user
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get all orders (admin)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = result.rows[0];
    const userResult = await pool.query('SELECT email FROM users WHERE id=$1', [order.user_id]);
    if (userResult.rows.length > 0) {
      await sendOrderEmail(userResult.rows[0].email, order.id, order.total, status);
    }

    res.json({ message: 'Order updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// ===== USER ROUTES =====

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, address, method, created_at FROM users WHERE id=$1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user profile
app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const { phone, address } = req.body;
    const result = await pool.query(
      'UPDATE users SET phone=$1, address=$2 WHERE id=$3 RETURNING id, name, email, phone, address',
      [phone, address, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ===== ANALYTICS =====

app.post('/api/analytics', async (req, res) => {
  try {
    const { user_id, event, product_id } = req.body;
    if (!event) return res.status(400).json({ message: 'Event type is required' });

    await pool.query(
      'INSERT INTO analytics (user_id, event, product_id) VALUES ($1,$2,$3)',
      [user_id || null, event, product_id || null]
    );

    res.status(201).json({ message: 'Event tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to track event' });
  }
});

// ===== ADMIN DASHBOARD =====

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const [totalOrders, totalRevenue, totalUsers, totalProducts, totalReviews, pendingOrders, recentOrders] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM orders'),
        pool.query('SELECT COALESCE(SUM(total), 0) as revenue FROM orders'),
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query('SELECT COUNT(*) FROM products'),
        pool.query('SELECT COUNT(*) FROM reviews'),
        pool.query("SELECT COUNT(*) FROM orders WHERE status='Pending'"),
        pool.query(`SELECT o.*, u.name as user_name FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    ORDER BY o.created_at DESC LIMIT 10`)
      ]);

    res.json({
      totalOrders: parseInt(totalOrders.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].revenue),
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalReviews: parseInt(totalReviews.rows[0].count),
      pendingOrders: parseInt(pendingOrders.rows[0].count),
      recentOrders: recentOrders.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
});

// ===== STATIC FILES — Must come AFTER all API routes =====
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🚀 Christech Server Running!        ║
  ║   http://localhost:${PORT}            ║
  ║   API: /api/*                         ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;