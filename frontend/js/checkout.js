// Checkout page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in using authUtils
  if (window.authUtils && !window.authUtils.isLoggedIn()) {
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }
  
  // Check if cart is empty
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }
  
  // Initialize Stripe
  const stripe = Stripe('pk_test_51P8hmKRxPyfV4EIzu1DWOBnXlB5qNrs2VoMwztSMpeztaWAqILzGp6voOuqwntJfuQ2poqB7yDjkwA26NCjpoGiF00vYR4E3OS');
  const elements = stripe.elements();
  
  // Create card Element and mount it
  const cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  });
  
  cardElement.mount('#card-element');
  
  // Handle real-time validation errors from the card Element
  cardElement.on('change', function(event) {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  });
  
  // Load user profile data
  loadUserProfile();
  
  // Load order summary with product details
  loadOrderSummary();
  
  // Set up payment method toggle
  document.querySelectorAll('input[name="payment_method"]').forEach(input => {
    input.addEventListener('change', function() {
      const creditCardFields = document.getElementById('credit_card_fields');
      if (this.value === 'credit_card') {
        creditCardFields.style.display = 'block';
      } else {
        creditCardFields.style.display = 'none';
      }
    });
  });
  
  // Set up checkout form submission
  document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    
    if (paymentMethod === 'credit_card') {
      // Handle Stripe payment
      processStripePayment();
    } else {
      // Handle other payment methods
      placeOrder(null);
    }
  });
  
  // Function to process Stripe payment
  function processStripePayment() {
    const submitButton = document.querySelector('button[type="submit"]');
    const errorElement = document.getElementById('card-errors');
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // Get billing details
    const billingDetails = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      address: {
        line1: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postal_code: document.getElementById('postal_code').value,
        country: document.getElementById('country').value,
      }
    };
    
    console.log('Billing details:', billingDetails); // Debug log
    
    // Create payment method
    stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails
    }).then(function(result) {
      if (result.error) {
        // Show error
        console.error('Stripe error:', result.error);
        errorElement.textContent = result.error.message;
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = 'Place Order';
      } else {
        console.log('Payment method created:', result.paymentMethod.id);
        // Send payment method ID to server
        placeOrder(result.paymentMethod.id);
      }
    });
  }
});

// Function to load user profile data
function loadUserProfile() {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    console.error('No authentication token found');
    return;
  }
  
  fetch('/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(user => {
    // Fill in user details
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    
    if (user.address) {
      document.getElementById('address').value = user.address.street || '';
      document.getElementById('city').value = user.address.city || '';
      document.getElementById('state').value = user.address.state || '';
      document.getElementById('postal_code').value = user.address.postalCode || '';
      
      const countrySelect = document.getElementById('country');
      if (user.address.country) {
        // Try to select the user's country
        for (let i = 0; i < countrySelect.options.length; i++) {
          if (countrySelect.options[i].value === user.address.country) {
            countrySelect.selectedIndex = i;
            break;
          }
        }
      }
    }
  })
  .catch(error => {
    console.error('Error loading user profile:', error);
  });
}

// Function to load order summary with product details
function loadOrderSummary() {
  const orderSummaryContainer = document.getElementById('order-summary');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  orderSummaryContainer.innerHTML = '';
  let subtotal = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    // Determine which image to display
    let imageUrl = '';
    if (item.images && item.images.length > 0) {
      imageUrl = item.images[0]; // Use the first image from the array
    } else if (item.image) {
      imageUrl = item.image; // Fallback to the old single image property
    } else {
      imageUrl = 'images/product-default.png'; // Default image
    }
    
    // Create price display with discount if applicable
    let priceDisplay = `$${parseFloat(item.price).toFixed(2)}`;
    if (item.originalPrice) {
      priceDisplay = `
        <span>$${parseFloat(item.price).toFixed(2)}</span>
        <small class="text-muted text-decoration-line-through ms-2">$${parseFloat(item.originalPrice).toFixed(2)}</small>
      `;
    }
    
    // Add color information if available
    const colorInfo = item.color ? `<small class="d-block text-muted">Color: ${item.color}</small>` : '';
    
    orderSummaryContainer.innerHTML += `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <img src="${imageUrl}" alt="${item.name}" class="img-fluid me-3" style="max-width: 60px; max-height: 60px; object-fit: contain;">
            <div>
              <strong>${item.name}</strong> ${colorInfo}
              <div class="d-flex align-items-center mt-1">
                <span class="me-2">Qty: ${item.quantity}</span>
                <span class="text-muted">×</span>
                <span class="ms-2">${priceDisplay}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="text-end">$${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  });
  
  // Calculate shipping cost (example: $10 flat rate)
  const shippingCost = 10;
  const orderTotal = subtotal + shippingCost;
  
  // Update totals
  document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('shipping-cost').textContent = `$${shippingCost.toFixed(2)}`;
  document.getElementById('order-total').textContent = `$${orderTotal.toFixed(2)}`;
}

// Function to place order
function placeOrder(paymentMethodId) {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    console.error('No authentication token found');
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }
  
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const errorElement = document.getElementById('error-message');
  
  // Clear previous errors
  errorElement.classList.add('d-none');
  
  // Get form data
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const postalCode = document.getElementById('postal_code').value;
  const country = document.getElementById('country').value;
  const orderNotes = document.getElementById('order_notes').value;
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
  
  // Prepare order items
  const orderItems = cart.map(item => ({
    name: item.name,
    qty: item.quantity,
    image: item.image || (item.images && item.images.length > 0 ? item.images[0] : ''),
    price: parseFloat(item.price),
    product: item.id
  }));
  
  // Calculate totals
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  const shippingPrice = 10;
  const taxPrice = subtotal * 0.1; // Example: 10% tax
  const totalPrice = subtotal + shippingPrice + taxPrice;
  
  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
  
  // Prepare order data
  const orderData = {
    orderItems,
    shippingAddress: {
      address,
      city,
      postalCode,
      country
    },
    paymentMethod,
    itemsPrice: subtotal,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderNotes
  };
  
  // Add payment method ID if using Stripe
  if (paymentMethodId) {
    orderData.paymentMethodId = paymentMethodId;
  }
  
  // Send order to server
  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  })
  .then(response => response.json())
  .then(data => {
    if (data._id) {
      // Order created successfully
      // Clear cart
      localStorage.removeItem('cart');
      
      // Redirect to thank you page
      window.location.href = `thankyou.html?order=${data._id}`;
    } else {
      throw new Error(data.message || 'Failed to create order');
    }
  })
  .catch(error => {
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
    
    // Show error
    errorElement.textContent = error.message;
    errorElement.classList.remove('d-none');
  });
}
