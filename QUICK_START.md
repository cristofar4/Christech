# CHRISTECH - QUICK START GUIDE

## 🚀 Get Started in 5 Minutes!

### Step 1: Install Node.js
- Download from: https://nodejs.org
- Choose LTS version
- Run installer and follow prompts

### Step 2: Install MongoDB
**Option A: Local Installation**
- Download from: https://www.mongodb.com/try/download/community
- Install and follow setup

**Option B: MongoDB Atlas (Cloud - Recommended)**
- Go to: https://www.mongodb.com/cloud/atlas
- Sign up (free tier available)
- Create cluster
- Get connection string

### Step 3: Set Up Project
```bash
# Open terminal in christech folder
cd c:\Users\THINKPAD E550\Desktop\christech

# Install packages
npm install

# This will download all required libraries (~300MB)
```

### Step 4: Configure .env
Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/christech
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/christech
NODE_ENV=development
```

### Step 5: Start Server
```bash
npm start
# OR for development mode with auto-reload:
npm run dev
```

✅ **Server is running!** Visit: http://localhost:5000/api/health

---

## 🌐 Open Frontend

1. **Open `christech_complete.html` in browser**
   - Double-click the file, OR
   - Right-click → Open with → Browser

2. **Features to test:**
   - Browse products & games
   - Add items to cart
   - Sign in with email
   - Try Google login button
   - Test checkout with different payment methods
   - Mobile view (Inspect → Toggle device toolbar)

---

## 🧪 Test API Endpoints

### Using Postman or Browser Console:

**1. Check Server Status**
```
GET http://localhost:5000/api/health
```

**2. Register User**
```
POST http://localhost:5000/api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**3. Get Products**
```
GET http://localhost:5000/api/products
GET http://localhost:5000/api/products?category=games
```

**4. Create Order**
```
POST http://localhost:5000/api/orders
Body: {
  "userId": "user_id_here",
  "items": [
    {
      "productId": "prod-1",
      "name": "iPhone 15 Pro Max",
      "price": 650000,
      "quantity": 1
    }
  ],
  "total": 650000,
  "paymentMethod": "card",
  "deliveryAddress": "123 Main Street, Owerri",
  "phone": "08012345678"
}
```

---

## 📦 Project Files

| File | Purpose |
|------|---------|
| `christech_complete.html` | **Use this!** Full frontend with all features |
| `server.js` | Backend API server |
| `package.json` | Dependencies list |
| `.env` | Configuration (API keys, database) |
| `.gitignore` | Git ignore rules |
| `admin-routes.js` | Admin API endpoints |
| `README.md` | Full documentation |

---

## 💡 Important Notes

1. **Real Images:** Gaming products use real Unsplash images - will load from internet
2. **Mobile Responsive:** Test on phone - hamburger menu appears on screens <768px
3. **Cart & Wishlist:** Data stored in browser (localStorage in production)
4. **Payments:** UI ready but payment processing needs API keys
5. **Backend:** All data stored in MongoDB

---

## 🔧 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
# Then try again
```

### "MongoDB connection refused"
```bash
# Start MongoDB (Windows PowerShell as Admin):
mongod

# Or use MongoDB Atlas URL in .env instead
```

### "Port 5000 already in use"
```bash
# Change PORT in .env to 5001 (or any other number)
```

### Frontend showing "Cannot GET /"
```
This is normal! The frontend is a static HTML file.
Open christech_complete.html directly in browser, not http://localhost:5000
```

---

## 🎯 Next Steps

1. ✅ Test frontend in browser
2. ✅ Start backend server
3. ✅ Open browser console (F12) and test API
4. ✅ Add products to database
5. ✅ Create test orders
6. ✅ Configure payment gateway (Stripe/Paystack)
7. ✅ Deploy to hosting (Heroku/Vercel)

---

## 📞 Need Help?

Check README.md for complete documentation!

---

**Version:** 1.0.0  
**Last Updated:** May 1, 2026  
**Status:** ✅ Ready to Use
