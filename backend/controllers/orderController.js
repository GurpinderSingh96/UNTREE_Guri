const Order = require('../models/orderModel');
const Product = require('../models/productModel');

// Conditionally load Stripe to avoid errors if not installed
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.warn('Stripe module not found. Stripe payments will not work.');
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentMethodId,
      orderNotes
    } = req.body;

    console.log('Creating order with payment method:', paymentMethod);
    console.log('Payment method ID:', paymentMethodId);
    console.log('Shipping address:', shippingAddress);

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    // Check stock availability and update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ 
          message: `Product not found: ${item.name}` 
        });
      }
      
      // Check if enough stock is available
      if (product.countInStock < item.qty) {
        return res.status(400).json({ 
          message: `Not enough stock available for ${item.name}. Only ${product.countInStock} items left.` 
        });
      }
      
      // Update product stock
      product.countInStock -= item.qty;
      await product.save();
      console.log(`Stock updated for product ${product._id}: ${product.countInStock} items remaining`);
    }

    // Create order in database
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderNotes
    });

    // If using Stripe and payment method ID is provided
    if (paymentMethod === 'credit_card' && paymentMethodId && stripe) {
      try {
        console.log('Processing Stripe payment...');
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalPrice * 100), // Stripe requires amount in cents
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          description: `Order ${order._id}`,
          metadata: {
            order_id: order._id.toString(),
            customer_id: req.user._id.toString()
          }
        });

        console.log('Payment intent created:', paymentIntent.id);
        console.log('Payment status:', paymentIntent.status);

        // If payment is successful
        if (paymentIntent.status === 'succeeded') {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.paymentResult = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: new Date().toISOString(),
            email_address: req.user.email
          };
        }
      } catch (stripeError) {
        console.error('Stripe payment error:', stripeError);
        
        // If payment fails, restore product stock
        for (const item of orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            product.countInStock += item.qty;
            await product.save();
            console.log(`Restored stock for product ${product._id} due to payment failure`);
          }
        }
        
        res.status(400);
        throw new Error(`Payment failed: ${stripeError.message}`);
      }
    }

    const createdOrder = await order.save();
    console.log('Order created successfully:', createdOrder._id);
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create Stripe payment intent
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createStripePaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    const { amount } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires amount in cents
      currency: 'usd',
      metadata: {
        user_id: req.user._id.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Check if the user is authorized to view this order
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized');
    }

    res.json(order);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'Delivered';

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // If cancelling an order, restore the stock
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      console.log('Cancelling order, restoring stock...');
      
      // Restore stock for each item in the order
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countInStock += item.qty;
          await product.save();
          console.log(`Restored ${item.qty} items to stock for product ${product._id}`);
        }
      }
    }

    order.status = status;

    // If status is Delivered, update isDelivered and deliveredAt
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    console.log('Getting orders for user:', req.user._id);
    console.log('Search query:', req.query.search);
    
    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Add search filter if provided - using a safer approach
    if (search && search.trim() !== '') {
      // Create an array for $or conditions
      const searchConditions = [];
      
      // Search in product names
      searchConditions.push({ 'orderItems.name': { $regex: search, $options: 'i' } });
      
      // Search by price if the search term is a number
      const searchNumber = parseFloat(search);
      if (!isNaN(searchNumber)) {
        searchConditions.push({ 'totalPrice': searchNumber });
      }
      
      // Search by partial order ID (using string operations instead of regex on ObjectId)
      // This converts the _id to string and then checks if it contains the search term
      searchConditions.push({ 
        $expr: { 
          $regexMatch: { 
            input: { $toString: "$_id" }, 
            regex: search, 
            options: "i" 
          } 
        } 
      });
      
      // Search by date if the search term looks like a date
      // Try to parse as date in various formats
      const dateSearch = new Date(search);
      if (!isNaN(dateSearch.getTime())) {
        // Create a date range for the entire day
        const startOfDay = new Date(dateSearch);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateSearch);
        endOfDay.setHours(23, 59, 59, 999);
        
        searchConditions.push({ 
          'createdAt': { 
            $gte: startOfDay, 
            $lte: endOfDay 
          } 
        });
      }
      
      // Add the $or conditions to the filter
      if (searchConditions.length > 0) {
        filter.$or = searchConditions;
      }
    }
    
    console.log('Filter:', JSON.stringify(filter));
    
    // Count total orders matching the filter
    const totalOrders = await Order.countDocuments(filter);
    console.log('Total orders found:', totalOrders);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / pageSize);
    
    // Get orders with pagination
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    
    console.log(`Found ${orders.length} orders for user ${req.user._id}`);
    
    // Return orders with pagination info
    res.json({
      orders,
      page,
      totalPages,
      totalOrders
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const keyword = req.query.keyword || '';
    const status = req.query.status || '';
    
    console.log('Admin getting orders with filters:', { keyword, status });
    
    // Build filter object
    const filter = {};
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add search filter if provided
    if (keyword) {
      // Create an array for $or conditions
      const searchConditions = [];
      
      // Search by order ID (as string)
      searchConditions.push({ 
        $expr: { 
          $regexMatch: { 
            input: { $toString: "$_id" }, 
            regex: keyword, 
            options: "i" 
          } 
        } 
      });
      
      // Search by user name (need to use aggregation or populate)
      // This is a placeholder - we'll handle user search separately
      
      // Search by total price if the keyword is a number
      const numericKeyword = parseFloat(keyword);
      if (!isNaN(numericKeyword)) {
        searchConditions.push({ totalPrice: numericKeyword });
      }
      
      // Search by date if the keyword looks like a date
      const dateKeyword = new Date(keyword);
      if (!isNaN(dateKeyword.getTime())) {
        const startOfDay = new Date(dateKeyword);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateKeyword);
        endOfDay.setHours(23, 59, 59, 999);
        
        searchConditions.push({ 
          createdAt: { 
            $gte: startOfDay, 
            $lte: endOfDay 
          } 
        });
      }
      
      // Add the $or conditions to the filter if we have any
      if (searchConditions.length > 0) {
        filter.$or = searchConditions;
      }
    }
    
    console.log('Order filter:', JSON.stringify(filter));
    
    // Count total orders matching the filter
    const totalOrders = await Order.countDocuments(filter);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / pageSize);
    
    // Get orders with pagination and populate user info
    const orders = await Order.find(filter)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    
    console.log(`Found ${orders.length} orders`);
    
    // Return orders with pagination info
    res.json({
      orders,
      page,
      pages: totalPages,
      totalOrders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Restore stock for each item in the order if the order is not cancelled
    // (cancelled orders should have already had their stock restored)
    if (order.status !== 'Cancelled') {
      console.log('Deleting order, restoring stock...');
      
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countInStock += item.qty;
          await product.save();
          console.log(`Restored ${item.qty} items to stock for product ${product._id}`);
        }
      }
    }
    
    // Delete the order
    await Order.findByIdAndDelete(req.params.id);
    
    return res.json({ message: 'Order removed successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ message: error.message || 'Error deleting order' });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  createStripePaymentIntent,
  deleteOrder
};
