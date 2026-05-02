# ChrisTech E-Commerce Platform - Setup & Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Prerequisites](#prerequisites)
4. [Local Setup](#local-setup)
5. [Testing the Platform](#testing-the-platform)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**ChrisTech** is a complete, full-stack e-commerce platform featuring:
- ✅ Responsive mobile design with hamburger menu
- ✅ Always-visible cart, search, and profile buttons
- ✅ Product catalog with real game images
- ✅ User authentication (Email/Password + Google ready)
- ✅ Shopping cart and wishlist
- ✅ Multiple payment methods
- ✅ Advanced review system with ratings
- ✅ Customer analytics dashboard
- ✅ Email notifications
- ✅ Admin panel with sales analytics

---

## 📁 File Structure

```
christech/
├── christech_complete.html      # Main frontend (production)
├── enhanced-features.html       # Extended UI features
├── server-complete.js           # Complete backend with all features
├── server.js                    # Original backend (backup)
├── admin-routes.js              # Admin API endpoints
├── features.js                  # Feature implementations
├── package.json                 # Node.js dependencies
├── .env                         # Environment configuration
├── .gitignore                   # Git ignore file
├── README.md                    # Full documentation
├── QUICK_START.md              # Quick setup guide
├── index_backup.html            # Backup of original
└── iphone.jpg / iphone2.jpg    # Product images
```

---

## ⚙️ Prerequisites

### Required Software:
1. **Node.js** (v14+): [Download](https://nodejs.org)
   - Includes npm automatically
2. **MongoDB** (Local or Cloud):
   - Local: [MongoDB Community](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (FREE)
3. **Git** (Optional): [Download](https://git-scm.com)
4. **Postman** (Optional): For API testing

### Browser Support:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

---

## 🚀 Local Setup

### Step 1: Install Node.js
1. Download from [nodejs.org](https://nodejs.org)
2. Run installer, follow prompts
3. Verify installation:
```bash
node --version    # Should show v14.0.0 or higher
npm --version     # Should show 6.0.0 or higher
```

### Step 2: Install MongoDB (Local)

**Windows:**
1. Download MSI installer: [MongoDB Community](https://www.mongodb.com/try/download/community)
2. Run installer, select "Install MongoDB Community Server"
3. Choose "Run the MongoDB server as a Windows Service"
4. Complete installation
5. MongoDB runs automatically on `localhost:27017`

**Verify MongoDB is running:**
```bash
# Open PowerShell and try to connect
mongo
# If connected, type: exit
```

**OR Use MongoDB Atlas (Cloud - Recommended):**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env` file with connection string

### Step 3: Install Project Dependencies

```bash
# Open terminal/PowerShell in christech folder
cd c:\Users\THINKPAD E550\Desktop\christech

# Install all npm packages
npm install

# Expected output: "added XX packages"
```

### Step 4: Configure Environment Variables

**Edit `.env` file:**
```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/christech
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/christech

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production

# Email (Gmail Example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment APIs (Optional for now)
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Google OAuth (Optional for now)
GOOGLE_CLIENT_ID=xxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

**For Gmail Password:**
1. Enable 2-factor authentication: [myaccount.google.com/security](https://myaccount.google.com/security)
2. Generate app password: [Security settings](https://myaccount.google.com/apppasswords)
3. Use that password in `.env`

### Step 5: Start the Server

```bash
# Run the complete backend
node server-complete.js

# Expected output:
# ╔════════════════════════════════════════╗
# ║   ChrisTech Server Running!             ║
# ║   🚀 http://localhost:5000              ║
# ║   📊 API: /api/*                        ║
# ║   📈 Analytics: /api/analytics/dashboard║
# ╚════════════════════════════════════════╝
```

### Step 6: Access the Platform

1. **Frontend**: [http://localhost:5000](http://localhost:5000)
2. **Admin Dashboard**: Open browser, look for admin section in UI

---

## 🧪 Testing the Platform

### Test Frontend Features

1. **Browse Products**: Home page shows game category products
2. **Mobile View**: 
   - Press F12 (Developer Tools)
   - Click device toggle (mobile icon)
   - Resize to <768px to see hamburger menu
3. **Add to Cart**: Click "Add to Cart" button
4. **Search**: Use search button in top navigation
5. **Profile**: Click profile icon (top right)

### Test Backend API (Using Postman)

#### 1. Register User
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123!",
  "phone": "+234801234567"
}
```

#### 2. Login
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "Test123!"
}
Response: Token for authentication
```

#### 3. Get All Products
```
GET http://localhost:5000/api/products
Response: Array of all products
```

#### 4. Create Product (Admin)
```
POST http://localhost:5000/api/products
Headers: Add "Authorization: Bearer YOUR_TOKEN"
Body (JSON):
{
  "name": "Nintendo Switch",
  "category": "gaming",
  "price": 35000,
  "image": "https://example.com/switch.jpg",
  "description": "Latest gaming console"
}
```

#### 5. Create Order
```
POST http://localhost:5000/api/orders
Body (JSON):
{
  "userId": "USER_ID_FROM_LOGIN",
  "items": [
    {
      "productId": "PRODUCT_ID",
      "name": "Nintendo NES",
      "price": 15000,
      "quantity": 1
    }
  ],
  "total": 15000,
  "paymentMethod": "Card",
  "address": "123 Main Street, Lagos"
}
Response: Order created with email notification sent
```

#### 6. Post Product Review
```
POST http://localhost:5000/api/reviews
Body (JSON):
{
  "productId": "PRODUCT_ID",
  "userId": "USER_ID",
  "userName": "John Doe",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very satisfied with this purchase"
}
```

#### 7. Get Analytics Dashboard
```
GET http://localhost:5000/api/analytics/dashboard
Response: Sales stats, revenue, top products, recent orders
```

### Test Email Notifications

1. Create an order
2. Check your email for order confirmation
3. Update order status via PUT `/api/orders/:id/status`
4. Check email for status update

---

## 📦 Production Deployment

### Option 1: Deploy Backend to Heroku

**Prerequisites:**
- Heroku account: [heroku.com](https://www.heroku.com)
- Git installed
- MongoDB Atlas account

**Steps:**

1. **Create Heroku Account**
   - Sign up at [heroku.com](https://www.heroku.com)

2. **Install Heroku CLI**
   ```bash
   # Download and install from heroku.com/download
   # Verify:
   heroku --version
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   # Opens browser to authenticate
   ```

4. **Create Heroku App**
   ```bash
   heroku create christech-api
   # Returns: https://christech-api.herokuapp.com
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set PORT=5000
   heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/christech
   heroku config:set JWT_SECRET=your-production-secret-key
   heroku config:set EMAIL_USER=your-email@gmail.com
   heroku config:set EMAIL_PASS=your-app-password
   heroku config:set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial deploy"
   git push heroku main
   # Monitor: heroku logs --tail
   ```

7. **Access Deployed API**
   - API URL: `https://christech-api.herokuapp.com/api/products`

### Option 2: Deploy Frontend to Vercel

**Steps:**

1. **Prepare Frontend**
   - Rename `christech_complete.html` to `index.html`
   - Update API endpoints to point to deployed backend

2. **Create Vercel Account**: [vercel.com](https://vercel.com)

3. **Deploy**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

4. **Configure Environment**
   - Update API URLs in frontend
   - Point to Heroku backend

### Production Checklist

- [ ] MongoDB Atlas cluster created and secured
- [ ] JWT_SECRET changed to strong random string
- [ ] Email credentials configured
- [ ] Stripe/Paystack keys added (if using payments)
- [ ] Google OAuth keys added (if using social login)
- [ ] CORS configured for production domain
- [ ] Database backups enabled
- [ ] Monitoring/logging setup (Heroku logs)
- [ ] SSL certificate enabled (automatic on Heroku/Vercel)
- [ ] Environment variables set on all platforms

---

## 🐛 Troubleshooting

### Issue: "MongoDB Connection Failed"

**Solution:**
```bash
# Check if MongoDB is running (local)
# Windows: Services > MongoDB Server (should be Running)

# OR use MongoDB Atlas connection string
# Update MONGODB_URI in .env
```

### Issue: "Port 5000 Already in Use"

**Solution (PowerShell):**
```bash
# Find process using port 5000
Get-Process | Where-Object {$_.Handles -eq 5000}

# Kill process
Stop-Process -Id XXXX -Force

# OR change PORT in .env file
```

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json

# Reinstall
npm install
```

### Issue: "Email Not Sending"

**Solution:**
1. Verify Gmail app password is used (not regular password)
2. Enable "Less secure apps": [myaccount.google.com/security](https://myaccount.google.com/security)
3. Check `.env` EMAIL_USER and EMAIL_PASS are correct
4. Test with: `node -e "require('nodemailer').createTransport({...}).verify()"`

### Issue: "CORS Errors in Frontend"

**Solution:**
- Ensure `cors()` is enabled in `server-complete.js`
- Check API endpoints in frontend match backend
- If deployed, update API URL in frontend to deployed backend

### Issue: "JWT Token Errors"

**Solution:**
1. Ensure token is included in request headers: `Authorization: Bearer TOKEN`
2. Check JWT_SECRET is the same in `.env` and code
3. Verify token hasn't expired (7 days)

---

## 📞 Support & Resources

- **MongoDB Documentation**: [docs.mongodb.com](https://docs.mongodb.com)
- **Express.js Guide**: [expressjs.com](https://expressjs.com)
- **Heroku Documentation**: [devcenter.heroku.com](https://devcenter.heroku.com)
- **Bootstrap Documentation**: [getbootstrap.com](https://getbootstrap.com)

---

## 🎓 Next Steps

1. **Integrate Payment Gateway**
   - Stripe: [stripe.com/docs](https://stripe.com/docs)
   - Paystack: [paystack.com/docs](https://paystack.com/docs)

2. **Add Google OAuth**
   - Set up credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Implement OAuth flow in frontend

3. **Setup Custom Domain**
   - Buy domain at GoDaddy, Namecheap, etc.
   - Point to Heroku/Vercel

4. **Implement Analytics**
   - Google Analytics
   - Custom dashboard using existing `/api/analytics/dashboard`

5. **Add Mobile App**
   - React Native or Flutter
   - Use same API endpoints

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained by**: ChrisTech Team
