// Product Detail Page JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get product ID from URL or use default
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id'); // Don't default to '1' anymore
  
  console.log(`Product ID from URL: ${productId}`);
  
  if (productId) {
    // Load product data if we have an ID
    loadProductData(productId);
  } else {
    console.log('No product ID provided, using sample data');
    // Use sample data if no ID provided
    useSampleProductData();
  }
  
  // Initialize quantity selector
  initQuantitySelector();
  
  // Add to cart functionality
  initAddToCart();
  
  // Update cart count on page load
  updateCartCount();
});

// Load product data
function loadProductData(productId) {
  // Show loading spinner
  document.querySelector('.loading-spinner').style.display = 'flex';
  document.querySelector('.product-content').style.display = 'none';
  
  console.log(`Attempting to fetch product with ID: ${productId}`);
  
  // Fetch product data from API
  fetch(`/api/products/${productId}`)
    .then(response => {
      console.log(`API response status: ${response.status}`);
      if (!response.ok) {
        if (response.status === 500) {
          console.error('Server error when fetching product. Falling back to sample data.');
          throw new Error('Server error');
        } else if (response.status === 404) {
          console.error('Product not found. Falling back to sample data.');
          throw new Error('Product not found');
        } else {
          console.error(`Unexpected error (${response.status}). Falling back to sample data.`);
          throw new Error(`Unexpected error: ${response.status}`);
        }
      }
      return response.json();
    })
    .then(product => {
      // Log product data for debugging
      console.log("Product data from API:", product);
      
      // Display product data
      displayProductData(product);
      
      // Initialize color selector with product colors
      if (product.color && product.color.length > 0) {
        // Format colors from the database
        const formattedColors = formatColorsFromDatabase(product.color);
        initColorSelector(formattedColors);
      } else if (product.colors && product.colors.length > 0) {
        initColorSelector(product.colors);
      } else {
        // Fall back to default colors if none provided
        initColorSelector();
      }
      
      // Initialize material selector with product material
      initMaterialSelector(product.material);
    })
    .catch(error => {
      console.error('Error fetching product:', error);
      // Fall back to sample data if API call fails
      useSampleProductData();
    });
}

// Use sample product data
function useSampleProductData() {
  console.log('Using sample product data');
  
  // Fetch a real product from the API to use as sample data
  fetch('/api/products')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    })
    .then(data => {
      console.log('Products data:', data);
      
      // Check if we have products
      if (data && data.products && data.products.length > 0) {
        // Use the first product as sample
        const product = data.products[0];
        console.log('Using first product as sample:', product);
        displayProductData(product);
        
        // Initialize color selector with product colors
        if (product.color && product.color.length > 0) {
          const formattedColors = formatColorsFromDatabase(product.color);
          initColorSelector(formattedColors);
        } else {
          initColorSelector();
        }
        
        // Initialize material selector with product material
        initMaterialSelector(product.material);
      } else {
        // Fall back to hardcoded sample if no products found
        useFallbackSampleData();
      }
    })
    .catch(error => {
      console.error('Error fetching products for sample:', error);
      useFallbackSampleData();
    });
}

// Use hardcoded sample data as a last resort
function useFallbackSampleData() {
  console.log('Using fallback sample product data');
  
  // Sample product data
  const sampleProduct = {
    id: '1',
    name: 'Nordic Chair',
    price: 199.99,
    discount: 15,
    description: 'A beautiful Nordic-style chair perfect for any modern home. This elegant chair combines comfort and style with its minimalist design and premium materials.',
    sku: 'CHAIR-001',
    category: 'Chairs',
    stock: 20, // Set stock to 20 to ensure it shows as in stock
    images: [
      'images/product-1.png',
      'images/product-2.png',
      'images/product-3.png'
    ],
    colors: [
      { name: 'Natural Oak', value: '#d7b889' },
      { name: 'Walnut', value: '#5d4037' },
      { name: 'White', value: '#ffffff' },
      { name: 'Black', value: '#212121' },
      { name: 'Navy Blue', value: '#0d47a1' }
    ],
    rating: 4.5,
    reviewCount: 12
  };
  
  // Display product data
  displayProductData(sampleProduct);
  
  // Initialize color selector with sample colors
  initColorSelector(sampleProduct.colors);
}

// Display product data
function displayProductData(product) {
  // Set product title
  document.querySelector('.product-title').textContent = product.name;
  
  // Set product price
  const currentPrice = document.querySelector('.current-price');
  const originalPrice = document.querySelector('.original-price');
  const discountBadge = document.querySelector('.discount-badge');
  
  if (product.discount && product.discount > 0) {
    const discountedPrice = product.price * (1 - product.discount / 100);
    currentPrice.textContent = `$${discountedPrice.toFixed(2)}`;
    originalPrice.textContent = `$${product.price.toFixed(2)}`;
    discountBadge.textContent = `-${product.discount}%`;
    originalPrice.style.display = 'inline';
    discountBadge.style.display = 'inline';
  } else {
    currentPrice.textContent = `$${product.price.toFixed(2)}`;
    originalPrice.style.display = 'none';
    discountBadge.style.display = 'none';
  }
  
  // Set product description
  //document.querySelector('.product-description').textContent = product.description;
  
  // Set product metadata
  document.querySelector('.product-sku').textContent = product.sku || product._id || 'N/A';
  document.querySelector('.product-category').textContent = product.category || 'N/A';
  
  // Set availability - Check for stock in multiple possible properties
  const availabilitySpan = document.querySelector('.product-availability');
  const stockValue = parseInt(product.stock || product.countInStock || product.quantity || product.inventory || 0);
  
  // Store the stock value as a data attribute for later use
  availabilitySpan.setAttribute('data-stock', stockValue);
  
  if (stockValue > 0) {
    availabilitySpan.textContent = 'In Stock';
    availabilitySpan.classList.add('text-success');
    availabilitySpan.classList.remove('text-danger');
    
    // Add low stock warning if stock is 5 or less
    if (stockValue <= 5) {
      availabilitySpan.textContent = `In Stock (Only ${stockValue} left)`;
      availabilitySpan.classList.add('text-warning');
      availabilitySpan.classList.remove('text-success');
    }
  } else {
    availabilitySpan.textContent = 'Out of Stock';
    availabilitySpan.classList.add('text-danger');
    availabilitySpan.classList.remove('text-success');
  }
  
  // Set product images
  const mainImage = document.querySelector('.product-main-image');
  const thumbnailsContainer = document.querySelector('.product-thumbnails');
  
  if (product.images && product.images.length > 0) {
    // Set main image
    mainImage.src = product.images[0];
    mainImage.alt = product.name;
    
    // Clear thumbnails
    thumbnailsContainer.innerHTML = '';
    
    // Add thumbnails
    product.images.forEach((image, index) => {
      const col = document.createElement('div');
      col.className = 'col-3 mb-2';
      
      const img = document.createElement('img');
      img.src = image;
      img.alt = `${product.name} - Image ${index + 1}`;
      img.className = index === 0 ? 'active' : '';
      
      // Add click event to thumbnail
      img.addEventListener('click', function() {
        // Update main image
        mainImage.src = this.src;
        
        // Update active class
        document.querySelectorAll('.product-thumbnails img').forEach(thumb => {
          thumb.classList.remove('active');
        });
        this.classList.add('active');
      });
      
      col.appendChild(img);
      thumbnailsContainer.appendChild(col);
    });
  }
  
  // Set product rating
  const ratingStars = document.querySelectorAll('.rating-stars');
  const reviewCount = document.querySelectorAll('.review-count');
  
  if (product.rating) {
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 >= 0.5;
    
    ratingStars.forEach(container => {
      container.innerHTML = '';
      
      // Add full stars
      for (let i = 0; i < fullStars; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star';
        container.appendChild(star);
      }
      
      // Add half star if needed
      if (hasHalfStar) {
        const halfStar = document.createElement('i');
        halfStar.className = 'fas fa-star-half-alt';
        container.appendChild(halfStar);
      }
      
      // Add empty stars
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      for (let i = 0; i < emptyStars; i++) {
        const emptyStar = document.createElement('i');
        emptyStar.className = 'far fa-star';
        container.appendChild(emptyStar);
      }
    });
  }
  
  // Set review count
  if (product.reviewCount) {
    reviewCount.forEach(count => {
      count.textContent = product.reviewCount;
    });
  }
  
  // Set full description in tab
  if (product.fullDescription) {
    document.querySelector('.product-full-description').innerHTML = product.fullDescription;
  } else {
    document.querySelector('.product-full-description').innerHTML = `<p>${product.description}</p>`;
  }
  
  // Set specifications if available
  const specificationsTable = document.querySelector('#specifications tbody');
  if (specificationsTable) {
    specificationsTable.innerHTML = '';
    
    console.log("Product data for specifications:", product);
    
    // Check if specifications exist in the product data
    if (product.specifications && typeof product.specifications === 'object' && product.specifications !== null) {
      console.log("Found specifications in product data:", product.specifications);
      
      // Handle different formats of specifications data
      let specs = {};
      
      if (product.specifications instanceof Map) {
        // If it's a Map object
        specs = Object.fromEntries(product.specifications);
      } else if (typeof product.specifications.toJSON === 'function') {
        // If it has a toJSON method (MongoDB document)
        specs = product.specifications.toJSON();
      } else if (product.specifications.get && typeof product.specifications.get === 'function') {
        // If it has Map-like methods but isn't a Map instance
        const keys = Array.from(product.specifications.keys());
        keys.forEach(key => {
          specs[key] = product.specifications.get(key);
        });
      } else {
        // Regular object
        specs = product.specifications;
      }
      
      console.log("Processed specifications:", specs);
      
      // Add each specification to the table
      Object.entries(specs).forEach(([key, value]) => {
        const row = document.createElement('tr');
        
        const keyCell = document.createElement('th');
        keyCell.textContent = key;
        
        const valueCell = document.createElement('td');
        valueCell.textContent = value;
        
        row.appendChild(keyCell);
        row.appendChild(valueCell);
        specificationsTable.appendChild(row);
      });
    } else {
      console.log("No specifications found, creating default ones");
      
      // If no specifications provided, add some default ones based on product properties
      
      // Add category
      if (product.category) {
        const categoryRow = document.createElement('tr');
        const categoryKey = document.createElement('th');
        categoryKey.textContent = 'Category';
        const categoryValue = document.createElement('td');
        categoryValue.textContent = product.category;
        categoryRow.appendChild(categoryKey);
        categoryRow.appendChild(categoryValue);
        specificationsTable.appendChild(categoryRow);
      }
      
      // Add material
      if (product.material) {
        const materialRow = document.createElement('tr');
        const materialKey = document.createElement('th');
        materialKey.textContent = 'Material';
        const materialValue = document.createElement('td');
        materialValue.textContent = Array.isArray(product.material) ? 
          product.material.join(', ') : product.material;
        materialRow.appendChild(materialKey);
        materialRow.appendChild(materialValue);
        specificationsTable.appendChild(materialRow);
      }
      
      // Add SKU (using part of the product ID)
      const skuRow = document.createElement('tr');
      const skuKey = document.createElement('th');
      skuKey.textContent = 'SKU';
      const skuValue = document.createElement('td');
      skuValue.textContent = product._id ? product._id.substring(0, 8).toUpperCase() : 'N/A';
      skuRow.appendChild(skuKey);
      skuRow.appendChild(skuValue);
      specificationsTable.appendChild(skuRow);
      
      // Add dimensions based on category
      if (product.category) {
        const dimensionsRow = document.createElement('tr');
        const dimensionsKey = document.createElement('th');
        dimensionsKey.textContent = 'Dimensions';
        const dimensionsValue = document.createElement('td');
        
        if (product.category.toLowerCase().includes('chair')) {
          dimensionsValue.textContent = '24" W x 26" D x 36" H';
        } else if (product.category.toLowerCase().includes('table')) {
          dimensionsValue.textContent = '48" W x 30" D x 30" H';
        } else if (product.category.toLowerCase().includes('sofa')) {
          dimensionsValue.textContent = '78" W x 35" D x 33" H';
        } else {
          dimensionsValue.textContent = 'Varies by product';
        }
        
        dimensionsRow.appendChild(dimensionsKey);
        dimensionsRow.appendChild(dimensionsValue);
        specificationsTable.appendChild(dimensionsRow);
      }
      
      // Add warranty
      const warrantyRow = document.createElement('tr');
      const warrantyKey = document.createElement('th');
      warrantyKey.textContent = 'Warranty';
      const warrantyValue = document.createElement('td');
      warrantyValue.textContent = '1 Year Limited';
      warrantyRow.appendChild(warrantyKey);
      warrantyRow.appendChild(warrantyValue);
      specificationsTable.appendChild(warrantyRow);
      
      // Add care instructions
      const careRow = document.createElement('tr');
      const careKey = document.createElement('th');
      careKey.textContent = 'Care Instructions';
      const careValue = document.createElement('td');
      careValue.textContent = 'Clean with soft, dry cloth';
      careRow.appendChild(careKey);
      careRow.appendChild(careValue);
      specificationsTable.appendChild(careRow);
    }
  }
  
  // Hide loading spinner and show content
  document.querySelector('.loading-spinner').style.display = 'none';
  document.querySelector('.product-content').style.display = 'block';
}

// Initialize quantity selector
function initQuantitySelector() {
  const decreaseBtn = document.getElementById('decrease-btn');
  const increaseBtn = document.getElementById('increase-btn');
  const quantityInput = document.getElementById('quantity-input');
  
  if (decreaseBtn && increaseBtn && quantityInput) {
    // Remove any existing event listeners first
    decreaseBtn.replaceWith(decreaseBtn.cloneNode(true));
    increaseBtn.replaceWith(increaseBtn.cloneNode(true));
    
    // Get the new elements after cloning
    const newDecreaseBtn = document.getElementById('decrease-btn');
    const newIncreaseBtn = document.getElementById('increase-btn');
    
    // Add event listeners to the new elements
    newDecreaseBtn.addEventListener('click', function() {
      let currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
    
    newIncreaseBtn.addEventListener('click', function() {
      let currentValue = parseInt(quantityInput.value);
      
      // Get max stock from availability span
      const availabilitySpan = document.querySelector('.product-availability');
      const maxStock = parseInt(availabilitySpan.getAttribute('data-stock') || 0);
      
      // Check if increasing would exceed stock
      if (currentValue + 1 > maxStock) {
        showErrorMessage(`Sorry, only ${maxStock} items are available in stock.`);
        return;
      }
      
      quantityInput.value = currentValue + 1;
    });
    
    quantityInput.addEventListener('change', function() {
      let currentValue = parseInt(quantityInput.value);
      if (isNaN(currentValue) || currentValue < 1) {
        quantityInput.value = 1;
      }
      
      // Get max stock from availability span
      const availabilitySpan = document.querySelector('.product-availability');
      const maxStock = parseInt(availabilitySpan.getAttribute('data-stock') || 0);
      
      // Check if value exceeds stock
      if (currentValue > maxStock) {
        showErrorMessage(`Sorry, only ${maxStock} items are available in stock.`);
        quantityInput.value = maxStock;
      }
    });
  }
}

// Initialize color selector
function initColorSelector(productColors) {
  // Add colors to selector
  const colorSelector = document.querySelector('.color-selector');
  if (!colorSelector) return;
  
  console.log("Product colors:", productColors);
  
  // Show loading indicator
  const colorLoading = document.querySelector('.color-loading');
  if (colorLoading) colorLoading.style.display = 'block';
  
  // Fetch colors from the database
  fetch('/api/products/colors')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch colors');
      }
      return response.json();
    })
    .then(colors => {
      console.log("Colors from API:", colors);
      
      // Hide loading indicator
      if (colorLoading) colorLoading.style.display = 'none';
      
      // If we have product colors, use them, otherwise use all available colors
      const colorsToUse = productColors && productColors.length > 0 
        ? formatColorsFromDatabase(productColors) 
        : formatColorsFromDatabase(colors);
      
      populateColorOptions(colorsToUse);
    })
    .catch(error => {
      console.error('Error fetching colors:', error);
      
      // Hide loading indicator
      if (colorLoading) colorLoading.style.display = 'none';
      
      // Fall back to default colors or product colors if available
      const defaultColors = [
        { name: 'Red', value: '#ff0000' },
        { name: 'Black', value: '#000000' },
        { name: 'White', value: '#ffffff' },
        { name: 'Blue', value: '#0000ff' },
        { name: 'Green', value: '#008000' },
        { name: 'Yellow', value: '#ffff00' },
        { name: 'Purple', value: '#800080' },
        { name: 'Orange', value: '#ffa500' },
        { name: 'Pink', value: '#ffc0cb' },
        { name: 'Brown', value: '#a52a2a' }
      ];
      
      const colorsToUse = productColors && productColors.length > 0 
        ? formatColorsFromDatabase(productColors) 
        : defaultColors;
      
      populateColorOptions(colorsToUse);
    });
  
  // Function to populate color options
  function populateColorOptions(colorOptions) {
    // Clear any existing colors
    colorSelector.innerHTML = '';
    
    // Add color options
    colorOptions.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      
      // Set background color
      colorOption.style.backgroundColor = color.value;
      colorOption.setAttribute('data-color', color.name);
      
      // Add tooltip
      colorOption.setAttribute('title', color.name);
      
      colorSelector.appendChild(colorOption);
      
      // Add click event
      colorOption.addEventListener('click', function() {
        // Remove selected class from all options
        document.querySelectorAll('.color-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        this.classList.add('selected');
        
        // Update label
        const colorLabel = document.querySelector('.color-label');
        if (colorLabel) {
          colorLabel.textContent = this.getAttribute('data-color');
        }
      });
    });
    
    // Do NOT select first color by default - require user to make a selection
    const colorLabel = document.querySelector('.color-label');
    if (colorLabel) {
      colorLabel.textContent = "Please select a color";
    }
  }
}

// Initialize add to cart functionality
function initAddToCart() {
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      // Get selected options
      const selectedColor = document.querySelector('.color-option.selected');
      const selectedMaterial = document.getElementById('material-select').value;
      const quantity = parseInt(document.getElementById('quantity-input').value);
      
      // Validate color selection
      if (!selectedColor) {
        showErrorMessage('Please select a color before adding to cart.');
        
        // Highlight the color label to draw attention
        const colorLabel = document.querySelector('.color-label');
        if (colorLabel) {
          colorLabel.classList.add('no-selection');
          setTimeout(() => {
            colorLabel.classList.remove('no-selection');
          }, 3000);
        }
        return;
      }
      
      // Validate material selection
      if (!selectedMaterial) {
        showErrorMessage('Please select a material before adding to cart.');
        
        // Highlight the material select to draw attention
        const materialSelect = document.getElementById('material-select');
        materialSelect.classList.add('is-invalid');
        setTimeout(() => {
          materialSelect.classList.remove('is-invalid');
        }, 3000);
        return;
      }
      
      // Get product ID from URL or use default
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id'); // Don't default to product ID 1 anymore
      
      // Get current stock
      const availabilitySpan = document.querySelector('.product-availability');
      const isInStock = availabilitySpan && availabilitySpan.textContent.includes('In Stock');
      
      // Get stock value from data attribute (set during displayProductData)
      const stockValue = parseInt(document.querySelector('.product-availability').getAttribute('data-stock') || 0);
      
      // Validate stock
      if (!isInStock) {
        showErrorMessage('Sorry, this product is out of stock.');
        return;
      }
      
      // Check if requested quantity exceeds available stock
      if (quantity > stockValue) {
        showErrorMessage(`Sorry, only ${stockValue} items are available in stock.`);
        
        // Reset quantity to max available
        document.getElementById('quantity-input').value = stockValue;
        return;
      }
      
      // Check if adding to cart would exceed stock when combined with existing cart items
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingItem = cart.find(item => 
        item.id === productId && 
        item.color === selectedColor.getAttribute('data-color') &&
        item.material === selectedMaterial
      );
      
      if (existingItem) {
        const totalQuantity = existingItem.quantity + quantity;
        if (totalQuantity > stockValue) {
          showErrorMessage(`You already have ${existingItem.quantity} of this item in your cart. Adding ${quantity} more would exceed the available stock of ${stockValue}.`);
          return;
        }
      }
      
      // Get product details for cart
      const productName = document.querySelector('.product-title').textContent;
      const productPrice = document.querySelector('.current-price').textContent.replace('$', '');
      const productImage = document.querySelector('.product-main-image').src;
      
      // Prepare cart item data
      const cartItem = {
        id: productId,
        name: productName,
        price: parseFloat(productPrice),
        image: productImage,
        quantity: quantity,
        color: selectedColor ? selectedColor.getAttribute('data-color') : null,
        material: selectedMaterial,
        maxStock: stockValue // Store max stock for cart validation
      };
      
      console.log("Adding to cart:", cartItem);
      
      // Save to cart (localStorage)
      saveToCart(cartItem);
      
      // Show success notification
      showAddToCartNotification();
    });
  }
}

// Save item to cart in localStorage
function saveToCart(item) {
  // Get existing cart or initialize empty array
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(cartItem => 
    cartItem.id === item.id && 
    cartItem.color === item.color &&
    cartItem.material === item.material
  );
  
  if (existingItemIndex > -1) {
    // Update quantity if item exists
    cart[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item if it doesn't exist
    cart.push(item);
  }
  
  // Save updated cart back to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart count in header
  updateCartCount();
}

// Update cart count in header
function updateCartCount() {
  const cartCountElement = document.querySelector('.cart-count');
  if (cartCountElement) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = itemCount;
    
    // Hide badge if cart is empty
    if (itemCount === 0) {
      cartCountElement.style.display = 'none';
    } else {
      cartCountElement.style.display = 'inline-block';
    }
  }
}

// Show add to cart notification
function showAddToCartNotification() {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('cart-add-feedback');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'cart-add-feedback';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.backgroundColor = '#3b5d50';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    notification.style.minWidth = '250px';
    
    notification.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <i class="fas fa-check-circle me-2"></i>
          Product added to cart!
        </div>
        <div>
          <button class="btn btn-sm view-cart-btn" style="background: none; border: none; color: white;">
            View Cart
          </button>
          <button class="btn btn-sm close-notification-btn" style="background: none; border: none; color: white;">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
  }
  
  // Always add fresh event listeners
  notification.querySelector('.view-cart-btn').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'cart.html';
  });
  
  notification.querySelector('.close-notification-btn').addEventListener('click', function() {
    hideNotification();
  });
  
  // Show notification
  notification.style.opacity = '1';
  
  // Hide after 5 seconds
  setTimeout(hideNotification, 5000);
  
  function hideNotification() {
    notification.style.opacity = '0';
  }
}
// Format colors from database
function formatColorsFromDatabase(colorArray) {
  // Color name to hex code mapping
  const colorMap = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'purple': '#800080',
    'orange': '#ffa500',
    'pink': '#ffc0cb',
    'brown': '#a52a2a',
    'gray': '#808080',
    'silver': '#c0c0c0',
    'gold': '#ffd700',
    'navy': '#000080',
    'teal': '#008080',
    'olive': '#808000',
    'maroon': '#800000',
    'natural oak': '#d7b889',
    'walnut': '#5d4037'
  };
  
  // Handle different input formats
  if (!colorArray) return [];
  
  // Ensure colorArray is actually an array
  if (!Array.isArray(colorArray)) {
    console.warn('Expected color array, got:', colorArray);
    return [];
  }
  
  // Convert color names to objects with name and value properties
  return colorArray.map(color => {
    // If color is already an object with name and value, return it
    if (typeof color === 'object' && color !== null && color.name && color.value) {
      return color;
    }
    
    const colorName = typeof color === 'string' ? color.toLowerCase() : String(color).toLowerCase();
    return {
      name: typeof color === 'string' ? color : String(color),
      value: colorMap[colorName] || colorName // Use mapped hex code or the color name itself
    };
  });
}
// Show error message
function showErrorMessage(message) {
  // Create error notification element if it doesn't exist
  let errorNotification = document.getElementById('error-feedback');
  
  if (!errorNotification) {
    errorNotification = document.createElement('div');
    errorNotification.id = 'error-feedback';
    errorNotification.style.position = 'fixed';
    errorNotification.style.top = '20px';
    errorNotification.style.right = '20px';
    errorNotification.style.padding = '15px 20px';
    errorNotification.style.background = '#dc3545';
    errorNotification.style.color = 'white';
    errorNotification.style.borderRadius = '5px';
    errorNotification.style.zIndex = '1000';
    errorNotification.style.opacity = '0';
    errorNotification.style.transition = 'opacity 0.3s ease-in-out';
    errorNotification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    errorNotification.style.minWidth = '250px';
    
    document.body.appendChild(errorNotification);
  }
  
  // Set message
  errorNotification.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <i class="fas fa-exclamation-circle me-2"></i>
        ${message}
      </div>
      <div>
        <button class="btn btn-sm close-notification-btn" style="background: none; border: none; color: white;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  
  // Add event listener to close button
  errorNotification.querySelector('.close-notification-btn').addEventListener('click', function() {
    hideErrorNotification();
  });
  
  // Show notification
  errorNotification.style.opacity = '1';
  
  // Hide after 5 seconds
  setTimeout(hideErrorNotification, 5000);
  
  function hideErrorNotification() {
    errorNotification.style.opacity = '0';
  }
}
// Initialize material selector
function initMaterialSelector(productMaterial) {
  const materialSelect = document.getElementById('material-select');
  if (!materialSelect) return;
  
  // Show loading indicator
  const materialLoading = document.querySelector('.material-loading');
  if (materialLoading) materialLoading.style.display = 'block';
  
  // Process the product material if it's a comma-separated string
  let materialArray = [];
  if (typeof productMaterial === 'string' && productMaterial.includes(',')) {
    materialArray = productMaterial.split(',').map(m => m.trim());
  } else if (Array.isArray(productMaterial)) {
    materialArray = productMaterial;
  } else if (productMaterial) {
    materialArray = [productMaterial];
  }
  
  console.log("Product materials processed:", materialArray);
  
  // Fetch all available materials from API
  fetch('/api/products/materials')
    .then(response => response.json())
    .then(materials => {
      console.log("Materials from API:", materials);
      
      // Hide loading indicator
      if (materialLoading) materialLoading.style.display = 'none';
      
      // Process materials to ensure we have individual items
      let processedMaterials = [];
      
      if (Array.isArray(materials)) {
        // If it's already an array, use it
        processedMaterials = materials;
      } else if (typeof materials === 'string') {
        // If it's a string, split by commas
        processedMaterials = materials.split(',').map(m => m.trim());
      } else {
        // Fallback to default materials
        processedMaterials = ['Wood', 'Metal', 'Fabric', 'Leather', 'Glass', 'Plastic'];
      }
      
      // Make sure we have all the product's materials in our options
      materialArray.forEach(material => {
        if (material && !processedMaterials.some(m => 
            (typeof m === 'string' && m.toLowerCase() === material.toLowerCase()) || 
            (m.name && m.name.toLowerCase() === material.toLowerCase()))) {
          processedMaterials.push(material);
        }
      });
      
      // Remove any combined material options (containing commas)
      processedMaterials = processedMaterials.filter(material => {
        if (typeof material === 'string') {
          return !material.includes(',');
        }
        return true;
      });
      
      populateMaterialOptions(processedMaterials, materialArray);
    })
    .catch(error => {
      console.error('Error fetching materials:', error);
      
      // Hide loading indicator
      if (materialLoading) materialLoading.style.display = 'none';
      
      // Fall back to default materials
      const defaultMaterials = ['Wood', 'Metal', 'Fabric', 'Leather', 'Glass', 'Plastic'];
      
      // Make sure we have all the product's materials in our options
      materialArray.forEach(material => {
        if (material && !defaultMaterials.includes(material)) {
          defaultMaterials.push(material);
        }
      });
      
      populateMaterialOptions(defaultMaterials, materialArray);
    });
}

// Populate material options in select dropdown
function populateMaterialOptions(materials, selectedMaterials) {
  const materialSelect = document.getElementById('material-select');
  if (!materialSelect) return;
  
  // Clear existing options except the first one
  while (materialSelect.options.length > 1) {
    materialSelect.remove(1);
  }
  
  // Ensure selectedMaterials is an array
  const materialArray = Array.isArray(selectedMaterials) ? selectedMaterials : 
                       (selectedMaterials ? [selectedMaterials] : []);
  
  console.log("Populating materials:", materials);
  console.log("Selected materials:", materialArray);
  
  // Add material options
  materials.forEach(material => {
    // Handle different material formats
    let materialValue, materialName;
    
    if (typeof material === 'string') {
      materialValue = material.toLowerCase();
      materialName = material.charAt(0).toUpperCase() + material.slice(1); // Capitalize first letter
    } else if (material && material.name) {
      materialValue = material.id || material.value || material.name.toLowerCase();
      materialName = material.name;
    } else {
      return; // Skip invalid material
    }
    
    const option = document.createElement('option');
    option.value = materialValue;
    option.textContent = materialName;
    
    // Select the first material from the product's materials
    if (materialArray.length > 0 && materialArray[0].toLowerCase() === materialValue.toLowerCase()) {
      option.selected = true;
    }
    
    materialSelect.appendChild(option);
  });
  
  // If no material was selected and we have product materials, select the first one
  if (materialSelect.value === '' && materialArray.length > 0) {
    const firstMaterial = materialArray[0];
    
    // Look for this material in the dropdown
    for (let i = 0; i < materialSelect.options.length; i++) {
      if (materialSelect.options[i].value.toLowerCase() === firstMaterial.toLowerCase()) {
        materialSelect.options[i].selected = true;
        break;
      }
    }
    
    // If not found, add it
    if (materialSelect.value === '') {
      const option = document.createElement('option');
      option.value = firstMaterial.toLowerCase();
      option.textContent = firstMaterial.charAt(0).toUpperCase() + firstMaterial.slice(1);
      option.selected = true;
      materialSelect.appendChild(option);
    }
  }
}
// Initialize review functionality
document.addEventListener('DOMContentLoaded', function() {
  // Set up rating input
  const ratingStars = document.querySelectorAll('.rating-input i');
  const ratingInput = document.getElementById('reviewRating');
  
  // Add event listeners to stars
  ratingStars.forEach(star => {
    star.addEventListener('mouseover', function() {
      const rating = this.getAttribute('data-rating');
      highlightStars(rating);
    });
    
    star.addEventListener('mouseout', function() {
      const currentRating = ratingInput.value || 0;
      highlightStars(currentRating);
    });
    
    star.addEventListener('click', function() {
      const rating = this.getAttribute('data-rating');
      ratingInput.value = rating;
      highlightStars(rating);
    });
  });
  
  // Function to highlight stars
  function highlightStars(rating) {
    ratingStars.forEach(star => {
      const starRating = star.getAttribute('data-rating');
      if (starRating <= rating) {
        star.className = 'fas fa-star';
      } else {
        star.className = 'far fa-star';
      }
    });
  }
  
  // Handle review form submission
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Check if user is logged in
      if (!window.authUtils || !window.authUtils.isLoggedIn()) {
        showErrorMessage('Please log in to submit a review');
        setTimeout(() => {
          window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 2000);
        return;
      }
      
      // Get form data
      const rating = document.getElementById('reviewRating').value;
      const title = document.getElementById('reviewTitle').value;
      const comment = document.getElementById('reviewContent').value;
      
      // Validate form data
      if (!rating) {
        showErrorMessage('Please select a rating');
        return;
      }
      
      if (!title) {
        showErrorMessage('Please enter a review title');
        return;
      }
      
      if (!comment) {
        showErrorMessage('Please enter your review');
        return;
      }
      
      // Get product ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      
      if (!productId) {
        showErrorMessage('Product ID not found');
        return;
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Submit review
      fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          title,
          comment
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Failed to submit review');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Review submitted successfully:', data);
        
        // Show success message
        showSuccessMessage('Your review has been submitted successfully!');
        
        // Reset form
        reviewForm.reset();
        ratingInput.value = '';
        highlightStars(0);
        
        // Add the new review to the list
        if (data.review) {
          addReviewToList(data.review);
        }
        
        // Reload reviews
        loadProductReviews(productId);
      })
      .catch(error => {
        console.error('Error submitting review:', error);
        showErrorMessage(error.message || 'Failed to submit review');
      });
    });
  }
  
  // Load reviews when product is loaded
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (productId) {
    loadProductReviews(productId);
  }
});

// Function to load product reviews
function loadProductReviews(productId) {
  const reviewsList = document.querySelector('.reviews-list');
  const noReviewsMessage = document.querySelector('.no-reviews');
  
  if (!reviewsList) return;
  
  // Show loading indicator
  reviewsList.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading reviews...</span></div></div>';
  
  // Fetch product to get reviews
  fetch(`/api/products/${productId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch product reviews');
      }
      return response.json();
    })
    .then(product => {
      console.log('Product reviews:', product.reviews);
      
      // Update review count
      const reviewCountElements = document.querySelectorAll('.review-count');
      reviewCountElements.forEach(element => {
        element.textContent = product.numReviews || 0;
      });
      
      // Update average rating
      const averageRatingElement = document.querySelector('.average-rating');
      if (averageRatingElement) {
        averageRatingElement.textContent = product.rating ? product.rating.toFixed(1) : '0.0';
      }
      
      // Update rating stars
      const ratingStarsElements = document.querySelectorAll('.rating-stars');
      ratingStarsElements.forEach(container => {
        updateRatingStars(container, product.rating || 0);
      });
      
      // Check if there are reviews
      if (!product.reviews || product.reviews.length === 0) {
        reviewsList.innerHTML = '';
        if (noReviewsMessage) {
          noReviewsMessage.style.display = 'block';
        }
        return;
      }
      
      // Hide no reviews message
      if (noReviewsMessage) {
        noReviewsMessage.style.display = 'none';
      }
      
      // Sort reviews by date (newest first)
      const sortedReviews = [...product.reviews].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Clear reviews list
      reviewsList.innerHTML = '';
      
      // Add reviews to list
      sortedReviews.forEach(review => {
        addReviewToList(review);
      });
      
      // Update rating breakdown
      updateRatingBreakdown(product.reviews);
    })
    .catch(error => {
      console.error('Error loading reviews:', error);
      reviewsList.innerHTML = `<div class="alert alert-danger">Error loading reviews: ${error.message}</div>`;
    });
}

// Function to add a review to the list
function addReviewToList(review) {
  const reviewsList = document.querySelector('.reviews-list');
  if (!reviewsList) return;
  
  const reviewElement = document.createElement('div');
  reviewElement.className = 'review-item card border-0 shadow-sm mb-4';
  
  // Format date
  const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Just now';
  
  // Create rating stars HTML
  let ratingStars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= review.rating) {
      ratingStars += '<i class="fas fa-star"></i>';
    } else {
      ratingStars += '<i class="far fa-star"></i>';
    }
  }
  
  reviewElement.innerHTML = `
    <div class="card-body p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="card-title mb-0">${review.title || 'Review'}</h5>
        <span class="badge bg-light text-dark rounded-pill px-3 py-2">${reviewDate}</span>
      </div>
      <div class="text-warning mb-2">${ratingStars}</div>
      <p class="review-author mb-3 text-primary fw-bold">
        <i class="fas fa-user-circle me-2"></i>${review.name || 'Anonymous'}
      </p>
      <p class="card-text mb-0">${review.comment}</p>
    </div>
  `;
  
  // Add to the beginning of the list
  if (reviewsList.firstChild) {
    reviewsList.insertBefore(reviewElement, reviewsList.firstChild);
  } else {
    reviewsList.appendChild(reviewElement);
  }
}

// Function to update rating stars
function updateRatingStars(container, rating) {
  if (!container) return;
  
  container.innerHTML = '';
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    const star = document.createElement('i');
    star.className = 'fas fa-star';
    container.appendChild(star);
  }
  
  // Add half star if needed
  if (hasHalfStar) {
    const halfStar = document.createElement('i');
    halfStar.className = 'fas fa-star-half-alt';
    container.appendChild(halfStar);
  }
  
  // Add empty stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    const emptyStar = document.createElement('i');
    emptyStar.className = 'far fa-star';
    container.appendChild(emptyStar);
  }
}

// Function to update rating breakdown
function updateRatingBreakdown(reviews) {
  const breakdownContainer = document.querySelector('.rating-breakdown');
  if (!breakdownContainer || !reviews || reviews.length === 0) return;
  
  // Count ratings
  const ratingCounts = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };
  
  reviews.forEach(review => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating]++;
    }
  });
  
  // Clear container
  breakdownContainer.innerHTML = '';
  
  // Add breakdown bars
  for (let i = 5; i >= 1; i--) {
    const count = ratingCounts[i];
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    
    const breakdownItem = document.createElement('div');
    breakdownItem.className = 'mb-3';
    breakdownItem.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="me-3" style="width: 40px; font-weight: 600;">${i} <i class="fas fa-star text-warning"></i></div>
        <div class="progress flex-grow-1" style="height: 10px; background-color: #f0f0f0; border-radius: 10px;">
          <div class="progress-bar" role="progressbar" 
               style="width: ${percentage}%; background-color: #3b5d50; border-radius: 10px;" 
               aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <div class="ms-3 text-muted" style="width: 40px; text-align: right;">${count}</div>
      </div>
    `;
    
    breakdownContainer.appendChild(breakdownItem);
  }
}

// Function to show success message
function showSuccessMessage(message) {
  // Create success notification element if it doesn't exist
  let successNotification = document.getElementById('success-feedback');
  
  if (!successNotification) {
    successNotification = document.createElement('div');
    successNotification.id = 'success-feedback';
    successNotification.style.position = 'fixed';
    successNotification.style.top = '20px';
    successNotification.style.right = '20px';
    successNotification.style.padding = '15px 20px';
    successNotification.style.background = '#28a745';
    successNotification.style.color = 'white';
    successNotification.style.borderRadius = '5px';
    successNotification.style.zIndex = '1000';
    successNotification.style.opacity = '0';
    successNotification.style.transition = 'opacity 0.3s ease-in-out';
    successNotification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    successNotification.style.minWidth = '250px';
    
    document.body.appendChild(successNotification);
  }
  
  // Set message
  successNotification.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <i class="fas fa-check-circle me-2"></i>
        ${message}
      </div>
      <div>
        <button class="btn btn-sm close-notification-btn" style="background: none; border: none; color: white;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  
  // Add event listener to close button
  successNotification.querySelector('.close-notification-btn').addEventListener('click', function() {
    hideSuccessNotification();
  });
  
  // Show notification
  successNotification.style.opacity = '1';
  
  // Hide after 5 seconds
  setTimeout(hideSuccessNotification, 5000);
  
  function hideSuccessNotification() {
    successNotification.style.opacity = '0';
  }
}
