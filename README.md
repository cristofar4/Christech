# 🛍️ Christech - Premium Tech & Gaming E-Commerce Store

**Complete e-commerce platform for selling premium phones, accessories, and retro gaming consoles.**

---

## ✨ Features

### 🎯 Frontend Features
- ✅ **Responsive Design** - Mobile-first design with hamburger menu
- ✅ **Real Gaming Images** - Using Unsplash for authentic gaming console images
- ✅ **Product Categories** - Phones, Accessories, Power Banks, Gaming Consoles
- ✅ **Shopping Cart** - Add/remove products with real-time updates
- ✅ **Wishlist** - Save favorite products
- ✅ **User Authentication** - Email & Google Login
- ✅ **Smooth Animations** - Modern UI/UX with CSS animations
- ✅ **Multiple Payment Methods**:
  - 💳 Credit/Debit Card
  - 🏦 Bank Transfer
  - 📱 USSD
  - 🚚 Cash on Delivery

### 🖥️ Backend Features
- ✅ **Node.js + Express** - Fast and scalable backend
- ✅ **MongoDB** - NoSQL database for products, orders, and users
- ✅ **RESTful API** - Standard REST endpoints
- ✅ **User Authentication** - Secure login/registration
- ✅ **Order Management** - Track and manage orders
- ✅ **Payment Integration** - Ready for Stripe/Paystack integration
- ✅ **Product Management** - Admin can add/edit products

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14+) - [Download](https://nodejs.org)
- **MongoDB** - [Local Installation](https://www.mongodb.com/try/download/community) OR [MongoDB Atlas (Cloud)](https://www.mongodb.com/cloud/atlas)
- **Git** (optional)

### Installation

1. **Clone/Download the project**
```bash
# If you have git
git clone https://github.com/yourusername/christech.git
cd christech

# Or just download and extract the folder
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create/edit `.env` file with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/christech
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

4. **Start MongoDB** (if using local installation)
```bash
# Windows
mongod

# Mac/Linux
brew services start mongodb-community
```

5. **Start the server**
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

✅ Server running at: `http://localhost:5000`

---

## 📁 Project Structure

```
christech/
│
├── christech_complete.html      # Frontend (all-in-one HTML file)
├── index_backup.html            # Backup of original file
├── index_enhanced.html          # Enhanced version
│
├── server.js                    # Express server & routes
├── package.json                 # Node.js dependencies
├── .env                         # Environment variables
│
├── public/                      # Static files (optional)
│   └── uploads/                 # Product/proof images
│
└── README.md                    # This file
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login user
```

### Products
```
GET    /api/products           Get all products
GET    /api/products?category=phones  Get products by category
GET    /api/products/:id       Get single product
POST   /api/products           Add new product (Admin)
```

### Orders
```
POST   /api/orders             Create order
GET    /api/orders/:userId     Get user orders
PUT    /api/orders/:id         Update order status
```

### Payments
```
POST   /api/payments/stripe    Process Stripe payment
POST   /api/payments/bank-transfer  Register bank transfer
```

### Health Check
```
GET    /api/health             Check server status
```

---

## 💳 Payment Methods Setup

### 1. **Stripe Integration** (Credit/Debit Card)
```bash
1. Go to https://stripe.com
2. Sign up and get API keys
3. Add to .env:
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
```

### 2. **Paystack Integration** (Alternative)
```bash
1. Go to https://paystack.com
2. Create account and get API keys
3. Add to .env:
   PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYSTACK_SECRET_KEY=sk_test_...
```

### 3. **Bank Transfer**
- Configure bank details in `.env`
- Users upload proof image
- Admin verifies manually

### 4. **USSD** (Nigerian Mobile)
- Dial: *899*1*1# (configurable in `.env`)
- Users complete transaction on phone
- Admin receives notification

### 5. **Cash on Delivery**
- No extra setup needed
- Driver collects payment during delivery

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file to GitHub
   - Use `.gitignore` to exclude `.env`
   - Keep API keys private

2. **Database**
   - Use strong MongoDB password
   - Enable authentication
   - Regular backups

3. **Frontend**
   - Always validate user input
   - Use HTTPS in production
   - Sanitize data before sending to backend

4. **Production Deployment**
   - Set `NODE_ENV=production`
   - Use reverse proxy (Nginx)
   - Enable CORS properly
   - Use SSL/TLS certificates

---

## 📊 Database Schema

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String,
  phone: String,
  address: String,
  createdAt: Date
}
```

### Product
```javascript
{
  _id: ObjectId,
  name: String,
  price: Number,
  category: String,
  image: String (URL),
  rating: Number,
  description: String,
  stock: Number,
  createdAt: Date
}
```

### Order
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: String (Pending/Processing/Completed/Cancelled),
  paymentMethod: String,
  deliveryAddress: String,
  phone: String,
  createdAt: Date
}
```

---

## 🎯 Game Products (With Real Images)

The store includes retro gaming consoles with authentic images from Unsplash:

- 🎮 Nintendo Entertainment System (NES)
- 🎮 Super Mario Bros Cartridge
- 🎮 The Legend of Zelda
- 🎮 Sega Genesis
- 🎮 Sonic the Hedgehog
- 🎮 Game Boy Classic

---

## 🚀 Deployment Guide

### Deploy to Heroku

```bash
1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

2. Login:
   heroku login

3. Create app:
   heroku create your-app-name

4. Set environment variables:
   heroku config:set PORT=5000
   heroku config:set MONGODB_URI=your_mongodb_atlas_uri

5. Deploy:
   git push heroku main

6. View logs:
   heroku logs --tail
```

### Deploy to Vercel (Frontend)

```bash
1. Install Vercel CLI:
   npm i -g vercel

2. Deploy:
   vercel

3. Follow the prompts and deploy
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution:
1. Ensure MongoDB is running
2. Check MongoDB URI in .env
3. Use MongoDB Atlas (cloud) if local fails
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000

Solution:
1. Change PORT in .env
2. Or kill process using port: 
   Windows: netstat -ano | findstr :5000
   Mac/Linux: lsof -i :5000
```

### CORS Error
```
Error: Cross-Origin Request Blocked

Solution:
1. Check CORS configuration in server.js
2. Ensure frontend URL matches in .env
3. Add frontend URL to allowed origins
```

---

## 📞 Support & Contact

- **Email**: support@christech.com
- **WhatsApp**: [Link]
- **GitHub Issues**: Report bugs here

---

## 📄 License

MIT License - Feel free to use for personal/commercial projects

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📈 Future Enhancements

- [ ] Admin Dashboard
- [ ] Email notifications
- [ ] SMS notifications (Twilio)
- [ ] Push notifications
- [ ] Order tracking with map
- [ ] Customer reviews & ratings
- [ ] Inventory management
- [ ] Analytics & reports
- [ ] Wishlist sharing
- [ ] Referral program

---

**Made with ❤️ by Christech Team**

Last Updated: May 1, 2026
