// Cart Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Load and display cart items
  loadCart();
  
  // Initialize event listeners
  initCartEvents();
  
  // Update cart count in header
  updateCartCount();
});

function loadCart() {
  const cartTableBody = document.querySelector('.cart-table tbody');
  const cartTotalElement = document.getElementById('cart-total');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const cartContent = document.getElementById('cart-content');
  
  // Get cart from localStorage
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Show/hide elements based on cart status
  if (cart.length === 0) {
    if (emptyCartMessage) emptyCartMessage.style.display = 'block';
    if (cartContent) cartContent.style.display = 'none';
    return;
  } else {
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
  }
  
  // Clear existing cart items
  if (cartTableBody) cartTableBody.innerHTML = '';
  
  // Calculate total
  let total = 0;
  
  // Add each item to cart table
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    if (cartTableBody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="product-thumbnail">
          <img src="${item.image}" alt="${item.name}" class="img-fluid" style="max-width: 100px;">
        </td>
        <td class="product-name">
          <h2 class="h5 text-black">${item.name}</h2>
          <p class="small text-muted">Color: ${item.color || 'N/A'}</p>
          <p class="small text-muted">Material: ${item.material || 'N/A'}</p>
        </td>
        <td>$${item.price.toFixed(2)}</td>
        <td>
          <div class="input-group mb-3" style="max-width: 120px;">
            <div class="input-group-prepend">
              <button class="btn btn-outline-black decrease" type="button" data-index="${index}">&minus;</button>
            </div>
            <input type="text" class="form-control text-center quantity-input" value="${item.quantity}" readonly>
            <div class="input-group-append">
              <button class="btn btn-outline-black increase" type="button" data-index="${index}">&plus;</button>
            </div>
          </div>
        </td>
        <td>$${itemTotal.toFixed(2)}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm remove-item" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      cartTableBody.appendChild(row);
    }
  });
  
  // Update total
  if (cartTotalElement) {
    cartTotalElement.textContent = `$${total.toFixed(2)}`;
  }
}

function initCartEvents() {
  // Event delegation for cart actions
  document.addEventListener('click', function(e) {
    // Increase quantity
    if (e.target.classList.contains('increase')) {
      const index = e.target.getAttribute('data-index');
      updateItemQuantity(index, 1);
    }
    
    // Decrease quantity
    if (e.target.classList.contains('decrease')) {
      const index = e.target.getAttribute('data-index');
      updateItemQuantity(index, -1);
    }
    
    // Remove item
    if (e.target.classList.contains('remove-item') || 
        (e.target.parentElement && e.target.parentElement.classList.contains('remove-item'))) {
      const index = e.target.closest('.remove-item').getAttribute('data-index');
      removeItem(index);
    }
  });
  
  // Clear cart button
  const clearCartBtn = document.getElementById('clear-cart-btn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }
}

function updateItemQuantity(index, change) {
  // Get cart
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Update quantity
  cart[index].quantity += change;
  
  // Remove item if quantity is 0 or less
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  
  // Save updated cart
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Reload cart display
  loadCart();
  
  // Update cart count in header
  updateCartCount();
}

function removeItem(index) {
  // Get cart
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Remove item
  cart.splice(index, 1);
  
  // Save updated cart
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Reload cart display
  loadCart();
  
  // Update cart count in header
  updateCartCount();
}

function clearCart() {
  // Clear cart in localStorage
  localStorage.removeItem('cart');
  
  // Reload cart display
  loadCart();
  
  // Update cart count in header
  updateCartCount();
}

function updateCartCount() {
  const cartCountElement = document.querySelector('.cart-count');
  if (cartCountElement) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = itemCount;
  }
}
