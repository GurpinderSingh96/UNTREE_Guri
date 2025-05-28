// Index page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get container for random products
  const productsContainer = document.querySelector('.product-section .row');
  
  // Function to fetch random products from API
  async function fetchRandomProducts() {
    try {
      // Show loading state (the spinner is already in the HTML)
      
      // Fetch random products from API
      const response = await fetch('/api/products/random?limit=3');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const products = await response.json();
      
      // Clear loading indicator
      productsContainer.innerHTML = '';
      
      // Add the first column back (the text column)
      productsContainer.innerHTML = `
        <div class="col-md-12 col-lg-3 mb-5 mb-lg-0">
          <h2 class="mb-4 section-title">Crafted with excellent material.</h2>
          <p class="mb-4">Donec vitae odio quis nisl dapibus malesuada. Nullam ac aliquet velit. Aliquam vulputate velit imperdiet dolor tempor tristique.</p>
          <p><a href="shop.html" class="btn">Explore</a></p>
        </div>
      `;
      
      // Check if products exist
      if (products.length === 0) {
        productsContainer.innerHTML += '<div class="col-12 text-center"><h3>No products available</h3></div>';
        return;
      }
      
      // Render products
      products.forEach(product => {
        // Get the first image or use default
        const productImage = product.images && product.images.length > 0 
          ? product.images[0] 
          : '/images/product-default.png';
        
        // Calculate discount price if applicable
        let priceDisplay = `$${product.price.toFixed(2)}`;
        if (product.discount && product.discount > 0) {
          const discountedPrice = product.price * (1 - product.discount / 100);
          priceDisplay = `
            <span class="product-price">$${discountedPrice.toFixed(2)}</span>
            <span class="product-price-original text-decoration-line-through text-muted ms-2">$${product.price.toFixed(2)}</span>
          `;
        }
        
        // Create product HTML
        const productHTML = `
          <div class="col-12 col-md-4 col-lg-3 mb-5 mb-md-0">
            <a class="product-item" href="product-detail.html?id=${product._id}">
              <img src="${productImage}" class="img-fluid product-thumbnail" alt="${product.name}">
              <h3 class="product-title">${product.name}</h3>
              <div class="product-price-container">
                ${priceDisplay}
              </div>
              <span class="icon-cross">
                <img src="images/cross.svg" class="img-fluid">
              </span>
            </a>
          </div>
        `;
        
        // Add product to container
        productsContainer.innerHTML += productHTML;
      });
      
    } catch (error) {
      console.error('Error fetching products:', error);
      productsContainer.innerHTML = `
        <div class="col-md-12 col-lg-3 mb-5 mb-lg-0">
          <h2 class="mb-4 section-title">Crafted with excellent material.</h2>
          <p class="mb-4">Donec vitae odio quis nisl dapibus malesuada. Nullam ac aliquet velit. Aliquam vulputate velit imperdiet dolor tempor tristique.</p>
          <p><a href="shop.html" class="btn">Explore</a></p>
        </div>
        <div class="col-12 col-md-9 text-center">
          <h3>Error loading products. Please try again later.</h3>
        </div>
      `;
    }
  }
  
  // Initialize the page
  fetchRandomProducts();
});
