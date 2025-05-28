// My Orders page functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('My Orders page loaded');
  
  // Check if user is logged in using authUtils
  const isLoggedIn = window.authUtils && window.authUtils.isLoggedIn();
  if (!isLoggedIn) {
    window.location.href = 'login.html?redirect=my-orders.html';
    return;
  }
  
  // Initialize variables
  let currentPage = 1;
  let totalPages = 1;
  let currentFilter = 'all';
  let currentSearch = '';
  
  // Load orders
  loadOrders(currentPage, currentSearch, currentFilter);
  
  // Set up search and filter functionality
  document.getElementById('order-search-btn').addEventListener('click', function() {
    currentSearch = document.getElementById('order-search').value;
    currentPage = 1; // Reset to first page when searching
    loadOrders(currentPage, currentSearch, currentFilter);
  });
  
  const searchInput = document.getElementById('order-search');
  const searchTips = document.getElementById('search-tips');
  
  searchInput.addEventListener('focus', function() {
    searchTips.classList.remove('d-none');
  });
  
  searchInput.addEventListener('blur', function() {
    setTimeout(() => {
      searchTips.classList.add('d-none');
    }, 200);
  });
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      currentSearch = this.value;
      currentPage = 1; // Reset to first page when searching
      loadOrders(currentPage, currentSearch, currentFilter);
    }
  });
  
  document.getElementById('order-filter').addEventListener('change', function() {
    currentFilter = this.value;
    currentPage = 1; // Reset to first page when filtering
    loadOrders(currentPage, currentSearch, currentFilter);
  });
  
  // Set up reorder functionality
  document.getElementById('reorder-btn').addEventListener('click', function() {
    const orderId = this.getAttribute('data-order-id');
    reorderItems(orderId);
  });
});

// Function to load orders
function loadOrders(page = 1, search = '', filter = 'all') {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    console.error('No authentication token found');
    window.location.href = 'login.html?redirect=my-orders.html';
    return;
  }
  
  const loadingSpinner = document.querySelector('.loading-spinner');
  const ordersContent = document.querySelector('.orders-content');
  const ordersList = document.getElementById('orders-list');
  const emptyOrders = document.querySelector('.empty-orders');
  const pagination = document.getElementById('orders-pagination');
  
  // Show loading spinner
  loadingSpinner.style.display = 'flex';
  ordersContent.classList.add('d-none');
  
  // Build query parameters
  let queryParams = `page=${page}`;
  if (search) {
    queryParams += `&search=${encodeURIComponent(search)}`;
  }
  if (filter !== 'all') {
    queryParams += `&status=${encodeURIComponent(filter)}`;
  }
  
  console.log('Fetching orders with params:', queryParams);
  
  fetch(`/api/orders/myorders?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`Failed to load orders: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Orders data received:', data);
    
    // Hide loading spinner and show content
    loadingSpinner.style.display = 'none';
    ordersContent.classList.remove('d-none');
    
    const orders = data.orders || data;
    const totalOrders = data.totalOrders || orders.length;
    totalPages = data.totalPages || 1;
    
    // Check if there are orders
    if (!orders || orders.length === 0) {
      ordersList.innerHTML = '';
      emptyOrders.classList.remove('d-none');
      pagination.innerHTML = '';
      return;
    }
    
    // Hide empty state and show orders
    emptyOrders.classList.add('d-none');
    
    // Render orders
    ordersList.innerHTML = '';
    orders.forEach(order => {
      try {
        // Check if order has all required properties
        if (!order || !order._id) {
          console.warn('Invalid order object:', order);
          return; // Skip this order
        }
        
        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date';
        const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '';
        
        // Determine status class
        let statusClass = '';
        const status = order.status || 'Pending';
        switch (status) {
          case 'Pending':
            statusClass = 'status-pending';
            break;
          case 'Processing':
            statusClass = 'status-processing';
            break;
          case 'Shipped':
            statusClass = 'status-shipped';
            break;
          case 'Delivered':
            statusClass = 'status-delivered';
            break;
          case 'Cancelled':
            statusClass = 'status-cancelled';
            break;
          default:
            statusClass = 'status-pending';
        }
        
        // Create order HTML
        const orderHTML = `
          <div class="order-item">
            <div class="order-header d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-1">Order #${order._id.substring(0, 8)}</h5>
                <p class="mb-0 text-muted">${orderDate} at ${orderTime}</p>
              </div>
              <span class="order-status ${statusClass}">${status}</span>
            </div>
            <div class="order-body">
              <div class="row">
                <div class="col-md-8">
                  <h6>Items</h6>
                  <div class="order-products">
                    ${order.orderItems && order.orderItems.slice(0, 2).map(item => `
                      <div class="order-product">
                        <img src="${item.image || 'images/product-default.png'}" alt="${item.name || 'Product'}" class="order-product-image">
                        <div class="order-product-details">
                          <h6 class="order-product-name">${item.name || 'Product'}</h6>
                          <p class="mb-0">Qty: ${item.qty || 1}</p>
                          <p class="order-product-price mb-0">$${(item.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    `).join('')}
                    ${order.orderItems && order.orderItems.length > 2 ? `<p class="text-muted mt-2">+ ${order.orderItems.length - 2} more items</p>` : ''}
                  </div>
                </div>
                <div class="col-md-4">
                  <h6>Order Summary</h6>
                  <p class="mb-1"><strong>Items:</strong> $${(order.itemsPrice || 0).toFixed(2)}</p>
                  <p class="mb-1"><strong>Shipping:</strong> $${(order.shippingPrice || 0).toFixed(2)}</p>
                  <p class="mb-1"><strong>Tax:</strong> $${(order.taxPrice || 0).toFixed(2)}</p>
                  <p class="mb-0"><strong>Total:</strong> $${(order.totalPrice || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div class="order-footer d-flex justify-content-between align-items-center">
              <div>
                <span class="me-3"><strong>Payment:</strong> ${order.isPaid ? 'Paid' : 'Not Paid'}</span>
                <span><strong>Delivery:</strong> ${order.isDelivered ? 'Delivered' : 'Not Delivered'}</span>
              </div>
              <button class="btn btn-sm btn-primary view-details-btn" data-order-id="${order._id}" data-bs-toggle="modal" data-bs-target="#orderDetailsModal">
                View Details
              </button>
            </div>
          </div>
        `;
        
        ordersList.innerHTML += orderHTML;
      } catch (error) {
        console.error('Error rendering order:', error, order);
      }
    });
    
    // Set up view details buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
      button.addEventListener('click', function() {
        const orderId = this.getAttribute('data-order-id');
        loadOrderDetails(orderId);
      });
    });
    
    // Generate pagination
    generatePagination(page, totalPages);
  })
  .catch(error => {
    console.error('Error loading orders:', error);
    
    // Hide loading spinner and show content with error
    loadingSpinner.style.display = 'none';
    ordersContent.classList.remove('d-none');
    ordersList.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Failed to load orders. Please try again later. Error: ${error.message}
      </div>
    `;
  });
}

// Function to generate pagination
function generatePagination(currentPage, totalPages) {
  const pagination = document.getElementById('orders-pagination');
  pagination.innerHTML = '';
  
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return;
  }
  
  // Previous button
  const prevDisabled = currentPage === 1 ? 'disabled' : '';
  pagination.innerHTML += `
    <li class="page-item ${prevDisabled}">
      <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
  `;
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    const active = i === currentPage ? 'active' : '';
    pagination.innerHTML += `
      <li class="page-item ${active}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }
  
  // Next button
  const nextDisabled = currentPage === totalPages ? 'disabled' : '';
  pagination.innerHTML += `
    <li class="page-item ${nextDisabled}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>
  `;
  
  // Add event listeners to pagination links
  document.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = parseInt(this.getAttribute('data-page'));
      if (!isNaN(page)) {
        const currentSearch = document.getElementById('order-search').value;
        const currentFilter = document.getElementById('order-filter').value;
        loadOrders(page, currentSearch, currentFilter);
      }
    });
  });
}

// Function to load order details
function loadOrderDetails(orderId) {
  const userToken = localStorage.getItem('userToken');
  const modalContent = document.querySelector('.order-details-content');
  const reorderBtn = document.getElementById('reorder-btn');
  
  // Show loading state
  modalContent.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;
  
  // Set order ID for reorder button
  reorderBtn.setAttribute('data-order-id', orderId);
  
  console.log('Loading order details for:', orderId);
  
  fetch(`/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  })
  .then(response => {
    console.log('Order details response status:', response.status);
    if (!response.ok) {
      throw new Error(`Failed to load order details: ${response.status}`);
    }
    return response.json();
  })
  .then(order => {
    console.log('Order details received:', order);
    
    try {
      // Create order details HTML with proper null checks
      const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date';
      const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '';
      
      // Determine status class
      let statusClass = '';
      const status = order.status || 'Pending';
      switch (status) {
        case 'Pending':
          statusClass = 'status-pending';
          break;
        case 'Processing':
          statusClass = 'status-processing';
          break;
        case 'Shipped':
          statusClass = 'status-shipped';
          break;
        case 'Delivered':
          statusClass = 'status-delivered';
          break;
        case 'Cancelled':
          statusClass = 'status-cancelled';
          break;
        default:
          statusClass = 'status-pending';
      }
      
      // Generate tracking timeline
      let trackingHTML = '';
      if (status === 'Pending') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed and is being processed.</div>
            </div>
          </div>
        `;
      } else if (status === 'Processing') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Processing'}</div>
              <div class="tracking-status">Processing</div>
              <div class="tracking-info">Your order is being processed and prepared for shipping.</div>
            </div>
          </div>
        `;
      } else if (status === 'Shipped') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Processing'}</div>
              <div class="tracking-status">Processing</div>
              <div class="tracking-info">Your order is being processed and prepared for shipping.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 172800000).toLocaleDateString() : 'Shipped'}</div>
              <div class="tracking-status">Shipped</div>
              <div class="tracking-info">Your order has been shipped and is on its way to you.</div>
            </div>
          </div>
        `;
      } else if (status === 'Delivered') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Processing'}</div>
              <div class="tracking-status">Processing</div>
              <div class="tracking-info">Your order is being processed and prepared for shipping.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 172800000).toLocaleDateString() : 'Shipped'}</div>
              <div class="tracking-status">Shipped</div>
              <div class="tracking-info">Your order has been shipped and is on its way to you.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 432000000).toLocaleDateString() : 'Delivered'}</div>
              <div class="tracking-status">Delivered</div>
              <div class="tracking-info">Your order has been delivered. Thank you for shopping with us!</div>
            </div>
          </div>
        `;
      } else if (status === 'Cancelled') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Cancelled'}</div>
              <div class="tracking-status">Cancelled</div>
              <div class="tracking-info">Your order has been cancelled.</div>
            </div>
          </div>
        `;
      }
      
      // Create order details HTML
      modalContent.innerHTML = `
        <div class="row mb-4">
          <div class="col-md-6">
            <h5>Order #${order._id.substring(0, 8)}</h5>
            <p class="mb-1">Placed on ${orderDate} at ${orderTime}</p>
            <span class="order-status ${statusClass}">${status}</span>
          </div>
          <div class="col-md-6 text-md-end">
            <p class="mb-1"><strong>Total:</strong> $${(order.totalPrice || 0).toFixed(2)}</p>
            <p class="mb-0"><strong>Payment:</strong> ${order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Not Paid'}</p>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6">
            <h6>Shipping Address</h6>
            <p class="mb-0">
              ${order.shippingAddress ? order.shippingAddress.address || 'N/A' : 'N/A'}<br>
              ${order.shippingAddress ? `${order.shippingAddress.city || 'N/A'}, ${order.shippingAddress.state || 'N/A'} ${order.shippingAddress.postalCode || 'N/A'}` : 'N/A'}<br>
              ${order.shippingAddress ? order.shippingAddress.country || 'N/A' : 'N/A'}
            </p>
          </div>
          <div class="col-md-6">
            <h6>Payment Method</h6>
            <p class="mb-0">${order.paymentMethod || 'N/A'}</p>
          </div>
        </div>
        
        <h6>Order Items</h6>
        <div class="table-responsive mb-4">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th class="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems && Array.isArray(order.orderItems) ? order.orderItems.map(item => `
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <img src="${item.image || 'images/product-default.png'}" alt="${item.name || 'Product'}" class="me-2" style="width: 50px; height: 50px; object-fit: contain;">
                      <span>${item.name || 'Product'}</span>
                    </div>
                  </td>
                  <td>$${(item.price || 0).toFixed(2)}</td>
                  <td>${item.qty || 1}</td>
                  <td class="text-end">$${((item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center">No items found</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end"><strong>Subtotal:</strong></td>
                <td class="text-end">$${(order.itemsPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Shipping:</strong></td>
                <td class="text-end">$${(order.shippingPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Tax:</strong></td>
                <td class="text-end">$${(order.taxPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Total:</strong></td>
                <td class="text-end"><strong>$${(order.totalPrice || 0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <h6>Order Tracking</h6>
        ${trackingHTML}
        
        ${order.orderNotes ? `
          <h6 class="mt-4">Order Notes</h6>
          <p class="mb-0">${order.orderNotes}</p>
        ` : ''}
      `;
    } catch (error) {
      console.error('Error rendering order details:', error);
      modalContent.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Error rendering order details: ${error.message}
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('Error loading order details:', error);
    modalContent.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Failed to load order details. Please try again later. Error: ${error.message}
      </div>
    `;
  });
}

// Function to reorder items
function reorderItems(orderId) {
  const userToken = localStorage.getItem('userToken');
  
  // Show loading state
  const reorderBtn = document.getElementById('reorder-btn');
  const originalButtonText = reorderBtn.innerHTML;
  reorderBtn.disabled = true;
  reorderBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
  
  fetch(`/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load order');
    }
    return response.json();
  })
  .then(order => {
    // Get current cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Add order items to cart
    if (order.orderItems && Array.isArray(order.orderItems)) {
      order.orderItems.forEach(item => {
        // Check if product already exists in cart
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.product);
        
        if (existingItemIndex !== -1) {
          // Update quantity if product already in cart
          cart[existingItemIndex].quantity += (item.qty || 1);
        } else {
          // Add new item to cart
          cart.push({
            id: item.product || 'unknown',
            name: item.name || 'Product',
            price: item.price || 0,
            image: item.image || 'images/product-default.png',
            quantity: item.qty || 1
          });
        }
      });
    } else {
      console.warn('No order items found or invalid format:', order.orderItems);
    }
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Close modal and redirect to cart
    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    modal.hide();
    
    // Show success message and redirect
    alert('Items added to cart!');
    window.location.href = 'cart.html';
  })
  .catch(error => {
    console.error('Error reordering items:', error);
    
    // Reset button state
    reorderBtn.disabled = false;
    reorderBtn.innerHTML = originalButtonText;
    
    // Show error message
    alert('Failed to add items to cart. Please try again.');
  });
}
// Function to load order details
function loadOrderDetails(orderId) {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    console.error('No authentication token found');
    return;
  }
  
  const modalContent = document.querySelector('.order-details-content');
  const reorderBtn = document.getElementById('reorder-btn');
  
  // Show loading state
  modalContent.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;
  
  // Set order ID for reorder button
  reorderBtn.setAttribute('data-order-id', orderId);
  
  console.log('Loading order details for:', orderId);
  
  fetch(`/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log('Order details response status:', response.status);
    if (!response.ok) {
      throw new Error(`Failed to load order details: ${response.status}`);
    }
    return response.json();
  })
  .then(order => {
    console.log('Order details received:', order);
    
    try {
      // Create order details HTML with proper null checks
      const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date';
      const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '';
      
      // Determine status class
      let statusClass = '';
      const status = order.status || 'Pending';
      switch (status) {
        case 'Pending':
          statusClass = 'status-pending';
          break;
        case 'Processing':
          statusClass = 'status-processing';
          break;
        case 'Shipped':
          statusClass = 'status-shipped';
          break;
        case 'Delivered':
          statusClass = 'status-delivered';
          break;
        case 'Cancelled':
          statusClass = 'status-cancelled';
          break;
        default:
          statusClass = 'status-pending';
      }
      
      // Generate tracking timeline
      let trackingHTML = '';
      if (status === 'Pending') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed and is being processed.</div>
            </div>
          </div>
        `;
      } else if (status === 'Processing') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Processing'}</div>
              <div class="tracking-status">Processing</div>
              <div class="tracking-info">Your order is being processed and prepared for shipping.</div>
            </div>
          </div>
        `;
      } else if (status === 'Shipped') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Processing'}</div>
              <div class="tracking-status">Processing</div>
              <div class="tracking-info">Your order is being processed and prepared for shipping.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 172800000).toLocaleDateString() : 'Shipped'}</div>
              <div class="tracking-status">Shipped</div>
              <div class="tracking-info">Your order has been shipped and is on its way to you.</div>
            </div>
          </div>
        `;
      } else if (status === 'Delivered') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Processing'}</div>
              <div class="tracking-status">Processing</div>
              <div class="tracking-info">Your order is being processed and prepared for shipping.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 172800000).toLocaleDateString() : 'Shipped'}</div>
              <div class="tracking-status">Shipped</div>
              <div class="tracking-info">Your order has been shipped and is on its way to you.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 432000000).toLocaleDateString() : 'Delivered'}</div>
              <div class="tracking-status">Delivered</div>
              <div class="tracking-info">Your order has been delivered. Thank you for shopping with us!</div>
            </div>
          </div>
        `;
      } else if (status === 'Cancelled') {
        trackingHTML = `
          <div class="tracking-timeline">
            <div class="tracking-step">
              <div class="tracking-date">${orderDate}</div>
              <div class="tracking-status">Order Placed</div>
              <div class="tracking-info">Your order has been placed.</div>
            </div>
            <div class="tracking-step">
              <div class="tracking-date">${order.createdAt ? new Date(new Date(order.createdAt).getTime() + 86400000).toLocaleDateString() : 'Cancelled'}</div>
              <div class="tracking-status">Cancelled</div>
              <div class="tracking-info">Your order has been cancelled.</div>
            </div>
          </div>
        `;
      }
      
      // Create order details HTML
      modalContent.innerHTML = `
        <div class="row mb-4">
          <div class="col-md-6">
            <h5>Order #${order._id.substring(0, 8)}</h5>
            <p class="mb-1">Placed on ${orderDate} at ${orderTime}</p>
            <span class="order-status ${statusClass}">${status}</span>
          </div>
          <div class="col-md-6 text-md-end">
            <p class="mb-1"><strong>Total:</strong> $${(order.totalPrice || 0).toFixed(2)}</p>
            <p class="mb-0"><strong>Payment:</strong> ${order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Not Paid'}</p>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6">
            <h6>Shipping Address</h6>
            <p class="mb-0">
              ${order.shippingAddress ? order.shippingAddress.address || 'N/A' : 'N/A'}<br>
              ${order.shippingAddress ? `${order.shippingAddress.city || 'N/A'}, ${order.shippingAddress.state || 'N/A'} ${order.shippingAddress.postalCode || 'N/A'}` : 'N/A'}<br>
              ${order.shippingAddress ? order.shippingAddress.country || 'N/A' : 'N/A'}
            </p>
          </div>
          <div class="col-md-6">
            <h6>Payment Method</h6>
            <p class="mb-0">${order.paymentMethod || 'N/A'}</p>
          </div>
        </div>
        
        <h6>Order Items</h6>
        <div class="table-responsive mb-4">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th class="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems && Array.isArray(order.orderItems) ? order.orderItems.map(item => `
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <img src="${item.image || 'images/product-default.png'}" alt="${item.name || 'Product'}" class="me-2" style="width: 50px; height: 50px; object-fit: contain;">
                      <span>${item.name || 'Product'}</span>
                    </div>
                  </td>
                  <td>$${(item.price || 0).toFixed(2)}</td>
                  <td>${item.qty || 1}</td>
                  <td class="text-end">$${((item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center">No items found</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end"><strong>Subtotal:</strong></td>
                <td class="text-end">$${(order.itemsPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Shipping:</strong></td>
                <td class="text-end">$${(order.shippingPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Tax:</strong></td>
                <td class="text-end">$${(order.taxPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Total:</strong></td>
                <td class="text-end"><strong>$${(order.totalPrice || 0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <h6>Order Tracking</h6>
        ${trackingHTML}
        
        ${order.orderNotes ? `
          <h6 class="mt-4">Order Notes</h6>
          <p class="mb-0">${order.orderNotes}</p>
        ` : ''}
      `;
    } catch (error) {
      console.error('Error rendering order details:', error);
      modalContent.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Error rendering order details: ${error.message}
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('Error loading order details:', error);
    modalContent.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Failed to load order details. Please try again later. Error: ${error.message}
      </div>
    `;
  });
}

// Function to generate pagination
function generatePagination(currentPage, totalPages) {
  const pagination = document.getElementById('orders-pagination');
  pagination.innerHTML = '';
  
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return;
  }
  
  // Previous button
  const prevDisabled = currentPage === 1 ? 'disabled' : '';
  pagination.innerHTML += `
    <li class="page-item ${prevDisabled}">
      <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
  `;
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    const active = i === currentPage ? 'active' : '';
    pagination.innerHTML += `
      <li class="page-item ${active}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }
  
  // Next button
  const nextDisabled = currentPage === totalPages ? 'disabled' : '';
  pagination.innerHTML += `
    <li class="page-item ${nextDisabled}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>
  `;
  
  // Add event listeners to pagination links
  document.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = parseInt(this.getAttribute('data-page'));
      if (!isNaN(page)) {
        const currentSearch = document.getElementById('order-search').value;
        const currentFilter = document.getElementById('order-filter').value;
        loadOrders(page, currentSearch, currentFilter);
      }
    });
  });
}

// Function to reorder items
function reorderItems(orderId) {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    console.error('No authentication token found');
    return;
  }
  
  // Show loading state
  const reorderBtn = document.getElementById('reorder-btn');
  const originalButtonText = reorderBtn.innerHTML;
  reorderBtn.disabled = true;
  reorderBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
  
  fetch(`/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load order');
    }
    return response.json();
  })
  .then(order => {
    // Get current cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Add order items to cart
    if (order.orderItems && Array.isArray(order.orderItems)) {
      order.orderItems.forEach(item => {
        // Check if product already exists in cart
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.product);
        
        if (existingItemIndex !== -1) {
          // Update quantity if product already in cart
          cart[existingItemIndex].quantity += (item.qty || 1);
        } else {
          // Add new item to cart
          cart.push({
            id: item.product || 'unknown',
            name: item.name || 'Product',
            price: item.price || 0,
            image: item.image || 'images/product-default.png',
            quantity: item.qty || 1
          });
        }
      });
    } else {
      console.warn('No order items found or invalid format:', order.orderItems);
    }
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Close modal and redirect to cart
    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    modal.hide();
    
    // Show success message and redirect
    alert('Items added to cart!');
    window.location.href = 'cart.html';
  })
  .catch(error => {
    console.error('Error reordering items:', error);
    
    // Reset button state
    reorderBtn.disabled = false;
    reorderBtn.innerHTML = originalButtonText;
    
    // Show error message
    alert('Failed to add items to cart. Please try again.');
  });
}
