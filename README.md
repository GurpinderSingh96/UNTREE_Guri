# Furni E-commerce Website

This is a furniture e-commerce website with a Node.js backend connected to MongoDB.

## Project Structure

```
untree.co-furni/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── public/
│   │   └── admin/
│   ├── routes/
│   └── utils/
├── frontend/
    ├── css/
    ├── images/
    ├── js/
    ├── scss/
    └── html files (index.html, shop.html, etc.)
```

## Backend Setup

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Configure MongoDB:
   - Make sure MongoDB is installed and running
   - Update the MongoDB connection string in `.env` file if needed

3. Start the server:
   ```
   npm run dev
   ```

## Features

- Product management (CRUD operations)
- User authentication and authorization
- Shopping cart functionality
- Order processing
- Admin dashboard for managing products, orders, users, and reviews
- RESTful API endpoints

## Admin Dashboard

Access the admin dashboard at `/admin` after starting the server. You'll need to log in with admin credentials.

### Admin Features:
- Dashboard with statistics
- Product management
- Order management
- User management
- Review management

## API Endpoints

### Products
- GET /api/products - Get all products
- GET /api/products/:id - Get a single product
- POST /api/products - Create a product (admin only)
- PUT /api/products/:id - Update a product (admin only)
- DELETE /api/products/:id - Delete a product (admin only)
- POST /api/products/:id/reviews - Add a review to a product
- GET /api/products/featured - Get featured products

### Users
- POST /api/users - Register a new user
- POST /api/users/login - Login user
- GET /api/users/profile - Get user profile (protected)
- PUT /api/users/profile - Update user profile (protected)

### Orders
- POST /api/orders - Create a new order
- GET /api/orders/:id - Get order by ID
- PUT /api/orders/:id/pay - Update order to paid
- GET /api/orders/myorders - Get logged in user orders
- GET /api/orders - Get all orders (admin only)
- PUT /api/orders/:id/deliver - Update order to delivered (admin only)
- PUT /api/orders/:id/status - Update order status (admin only)

### Admin
- GET /api/admin/users - Get all users (admin only)
- DELETE /api/admin/users/:id - Delete user (admin only)
- GET /api/admin/users/:id - Get user by ID (admin only)
- PUT /api/admin/users/:id - Update user (admin only)
- GET /api/admin/dashboard - Get dashboard stats (admin only)
- DELETE /api/admin/products/:id/reviews/:reviewId - Delete review (admin only)
