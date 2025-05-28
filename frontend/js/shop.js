document.addEventListener('DOMContentLoaded', function() {
  // Wait for the include-html to finish loading
  setTimeout(function() {
    loadCategories(); // Load categories from database
    loadColors();     // Load colors from database
    loadMaterials();  // Load materials from database
    loadProducts(1);
    initializeFilters();
  }, 500);
  
  // Set up event listeners
  document.getElementById('apply-filters').addEventListener('click', function(e) {
    e.preventDefault();
    loadProducts(1); // Always start at page 1 when applying filters
  });
  
  document.getElementById('sort-products').addEventListener('change', function() {
    loadProducts(1); // Reset to page 1 when changing sort
  });
  
  // Set up price range inputs
  const minPriceSlider = document.getElementById('min-price');
  const maxPriceSlider = document.getElementById('max-price');
  const minPriceInput = document.getElementById('min-price-input');
  const maxPriceInput = document.getElementById('max-price-input');
  
  minPriceSlider.addEventListener('input', function() {
    minPriceInput.value = this.value;
    if (parseInt(this.value) > parseInt(maxPriceSlider.value)) {
      maxPriceSlider.value = this.value;
      maxPriceInput.value = this.value;
    }
  });
  
  maxPriceSlider.addEventListener('input', function() {
    maxPriceInput.value = this.value;
    if (parseInt(this.value) < parseInt(minPriceSlider.value)) {
      minPriceSlider.value = this.value;
      minPriceInput.value = this.value;
    }
  });
  
  minPriceInput.addEventListener('change', function() {
    minPriceSlider.value = this.value;
    if (parseInt(this.value) > parseInt(maxPriceInput.value)) {
      maxPriceSlider.value = this.value;
      maxPriceInput.value = this.value;
    }
  });
  
  maxPriceInput.addEventListener('change', function() {
    maxPriceSlider.value = this.value;
    if (parseInt(this.value) < parseInt(minPriceInput.value)) {
      minPriceSlider.value = this.value;
      minPriceInput.value = this.value;
    }
  });
});

// Function to load categories from the database
function loadCategories() {
  fetch('/api/products/categories')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(categories => {
      console.log('Categories from API:', categories);
      
      // Get the categories container
      const categoriesContainer = document.getElementById('categoriesCollapse').querySelector('.mt-3');
      
      // Clear existing categories
      categoriesContainer.innerHTML = '';
      
      // Add categories from database
      if (categories && categories.length > 0) {
        categories.forEach(category => {
          // Convert category to lowercase and remove spaces for ID
          const categoryId = category.toLowerCase().replace(/\s+/g, '-');
          
          categoriesContainer.innerHTML += `
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="${category}" id="category-${categoryId}">
              <label class="form-check-label" for="category-${categoryId}">
                ${category.charAt(0).toUpperCase() + category.slice(1)}
              </label>
            </div>
          `;
        });
      } else {
        categoriesContainer.innerHTML = '<p>No categories found</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching categories:', error);
      const categoriesContainer = document.getElementById('categoriesCollapse').querySelector('.mt-3');
      categoriesContainer.innerHTML = '<p>Error loading categories</p>';
    });
}

// Function to load colors from the database
function loadColors() {
  fetch('/api/products/colors')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(colors => {
      console.log('Colors from API:', colors);
      
      // Get the colors container
      const colorsContainer = document.getElementById('colorCollapse').querySelector('.mt-3');
      
      // Clear existing colors
      colorsContainer.innerHTML = '';
      
      // Add colors from database
      if (colors && colors.length > 0) {
        colors.forEach(color => {
          // Convert color to lowercase and remove spaces for ID
          const colorId = color.toLowerCase().replace(/\s+/g, '-');
          
          colorsContainer.innerHTML += `
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="${color}" id="color-${colorId}">
              <label class="form-check-label" for="color-${colorId}">
                ${color.charAt(0).toUpperCase() + color.slice(1)}
              </label>
            </div>
          `;
        });
      } else {
        colorsContainer.innerHTML = '<p>No colors found</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching colors:', error);
      const colorsContainer = document.getElementById('colorCollapse').querySelector('.mt-3');
      colorsContainer.innerHTML = '<p>Error loading colors</p>';
    });
}

// Function to load materials from the database
function loadMaterials() {
  fetch('/api/products/materials')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(materials => {
      console.log('Materials from API:', materials);
      
      // Get the materials container
      const materialsContainer = document.getElementById('materialCollapse').querySelector('.mt-3');
      
      // Clear existing materials
      materialsContainer.innerHTML = '';
      
      // Process materials to ensure individual items
      let processedMaterials = [];
      
      if (Array.isArray(materials)) {
        // Process each material to split any comma-separated values
        materials.forEach(material => {
          if (typeof material === 'string' && material.includes(',')) {
            // Split comma-separated materials
            const splitMaterials = material.split(',').map(m => m.trim());
            processedMaterials = [...processedMaterials, ...splitMaterials];
          } else {
            processedMaterials.push(material);
          }
        });
      } else if (typeof materials === 'string') {
        // If it's a string, split by commas
        processedMaterials = materials.split(',').map(m => m.trim());
      } else {
        // Fallback to empty array
        processedMaterials = [];
      }
      
      // Remove duplicates
      processedMaterials = [...new Set(processedMaterials)];
      
      // Add materials from database
      if (processedMaterials && processedMaterials.length > 0) {
        processedMaterials.forEach(material => {
          // Convert material to lowercase and remove spaces for ID
          const materialId = material.toLowerCase().replace(/\s+/g, '-');
          
          materialsContainer.innerHTML += `
            <div class="material-item">
              <input class="material-checkbox" type="checkbox" value="${material}" id="material-${materialId}">
              <label class="material-label" for="material-${materialId}">
                ${material.charAt(0).toUpperCase() + material.slice(1)}
                <span class="material-count">0</span>
              </label>
            </div>
          `;
        });
      } else {
        materialsContainer.innerHTML = '<p>No materials found</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching materials:', error);
      const materialsContainer = document.getElementById('materialCollapse').querySelector('.mt-3');
      materialsContainer.innerHTML = '<p>Error loading materials</p>';
    });
}

// Initialize filter UI elements
function initializeFilters() {
  // Initialize collapse toggles
  const filterGroupTitles = document.querySelectorAll('.filter-group-title');
  filterGroupTitles.forEach(title => {
    title.addEventListener('click', function() {
      const icon = this.querySelector('i');
      if (this.getAttribute('aria-expanded') === 'true') {
        icon.style.transform = 'rotate(-90deg)';
      } else {
        icon.style.transform = 'rotate(0deg)';
      }
    });
  });
}

// Function to load products from the API
function loadProducts(pageNum) {
  // Ensure page is a number
  const page = (typeof pageNum === 'number') ? pageNum : 1;
  
  const productContainer = document.getElementById('product-container');
  const paginationContainer = document.getElementById('pagination');
  
  // Show loading spinner
  productContainer.innerHTML = `
    <div class="col-12 text-center mt-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;
  
  // Get filter values - use dynamic approach to get all checkboxes
  const categories = [];
  document.querySelectorAll('input[id^="category-"]:checked').forEach(checkbox => {
    categories.push(checkbox.value);
  });
  
  // Get color filters dynamically
  const colors = [];
  document.querySelectorAll('input[id^="color-"]:checked').forEach(checkbox => {
    colors.push(checkbox.value);
  });
  
  // Get material filters dynamically
  const materials = [];
  document.querySelectorAll('input[class="material-checkbox"]:checked').forEach(checkbox => {
    materials.push(checkbox.value);
  });
  
  console.log('Selected materials:', materials);
  
  const minPrice = document.getElementById('min-price-input').value;
  const maxPrice = document.getElementById('max-price-input').value;
  const sortBy = document.getElementById('sort-products').value;
  
  // Build query string - try different parameter formats
  let queryString = `?page=${page}&limit=12`;
  
  // Try both singular and plural forms since we don't know what the backend expects
  if (categories.length > 0) {
    queryString += `&category=${categories.join(',')}`;
  }
  
  if (colors.length > 0) {
    queryString += `&color=${colors.join(',')}`;
  }
  
  if (materials.length > 0) {
    queryString += `&material=${materials.join(',')}`;
  }
  
  // Add price parameters - these will be used to filter by effective price (after discount)
  queryString += `&minPrice=${minPrice}&maxPrice=${maxPrice}`;
  
  switch (sortBy) {
    case 'price-asc':
      queryString += '&sort=price';
      break;
    case 'price-desc':
      queryString += '&sort=-price';
      break;
    case 'newest':
      queryString += '&sort=-createdAt';
      break;
    default:
      queryString += '&sort=featured';
  }
  
  console.log('Fetching products with query:', queryString);
  console.log('Filter parameters:', {
    page,
    categories,
    colors,
    materials,
    minPrice,
    maxPrice,
    sortBy
  });
  
  // For debugging - log the material filter
  if (materials.length > 0) {
    console.log('Material filter active with values:', materials);
  }
  
  // Fetch products from API
  // Fetch products from API
  fetch(`/api/products${queryString}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('API response:', data);
      
      if (data.products && data.products.length > 0) {
        // Clear container
        productContainer.innerHTML = '';
        
        // Update product count
        const productCount = document.getElementById('product-count');
        if (productCount) {
          productCount.textContent = `Showing ${data.products.length} of ${data.totalProducts} products`;
        }
        
        // Add products to the container
        data.products.forEach(product => {
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
          
          // Create product HTML using the same design as index.js but smaller
          // Add out of stock indicator if stock is 0
          const stockStatus = product.countInStock === 0 ? 
            '<span class="out-of-stock-badge">Out of Stock</span>' : '';
            
          productContainer.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3 mb-4">
              <a class="product-item shop-product-item" href="product-detail.html?id=${product._id}">
                <img src="${productImage}" class="img-fluid product-thumbnail" alt="${product.name}">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price-container">
                  ${priceDisplay}
                </div>
                ${stockStatus}
                <span class="icon-cross">
                  <img src="images/cross.svg" class="img-fluid">
                </span>
              </a>
            </div>
          `;
        });
        
        // Create pagination
        const totalPages = Math.ceil(data.totalProducts / 12);
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
          <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadProducts(${page - 1}); return false;">Previous</a>
          </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
          paginationHTML += `
            <li class="page-item ${i === page ? 'active' : ''}">
              <a class="page-link" href="#" onclick="loadProducts(${i}); return false;">${i}</a>
            </li>
          `;
        }
        
        // Next button
        paginationHTML += `
          <li class="page-item ${page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadProducts(${page + 1}); return false;">Next</a>
          </li>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
      } else {
        productContainer.innerHTML = `
          <div class="col-12 text-center mt-5">
            <p>No products found matching your criteria.</p>
          </div>
        `;
        paginationContainer.innerHTML = '';
      }
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      productContainer.innerHTML = `
        <div class="col-12 text-center mt-5">
          <p>Error loading products. Please try again later.</p>
          <p class="text-muted small">Error details: ${error.message}</p>
        </div>
      `;
      paginationContainer.innerHTML = '';
    });
}

// Function to simulate filtered products for testing
function simulateFilteredProducts(categories, colors, materials, minPrice, maxPrice, sortBy, page, productContainer, paginationContainer) {
  // Sample product data
  const allProducts = [
    {
      _id: '1',
      name: 'Modern Chair',
      price: 199.99,
      discount: 10,
      category: 'chairs',
      color: 'black',
      material: 'fabric',
      images: ['images/product-1.png']
    },
    {
      _id: '2',
      name: 'Minimalist Table',
      price: 349.99,
      discount: 0,
      category: 'tables',
      color: 'brown',
      material: 'wood',
      images: ['images/product-2.png']
    },
    {
      _id: '3',
      name: 'Luxury Sofa',
      price: 899.99,
      discount: 15,
      category: 'sofas',
      color: 'gray',
      material: 'fabric',
      images: ['images/product-3.png']
    },
    {
      _id: '4',
      name: 'Queen Size Bed',
      price: 1299.99,
      discount: 0,
      category: 'beds',
      color: 'brown',
      material: 'wood',
      images: ['images/couch.png']
    },
    {
      _id: '5',
      name: 'Storage Cabinet',
      price: 499.99,
      discount: 5,
      category: 'storage',
      color: 'white',
      material: 'wood',
      images: ['images/product-1.png']
    },
    {
      _id: '6',
      name: 'Office Chair',
      price: 249.99,
      discount: 0,
      category: 'chairs',
      color: 'black',
      material: 'leather',
      images: ['images/product-2.png']
    },
    {
      _id: '7',
      name: 'Coffee Table',
      price: 199.99,
      discount: 0,
      category: 'tables',
      color: 'brown',
      material: 'wood',
      images: ['images/product-3.png']
    },
    {
      _id: '8',
      name: 'Sectional Sofa',
      price: 1499.99,
      discount: 20,
      category: 'sofas',
      color: 'gray',
      material: 'fabric',
      images: ['images/couch.png']
    },
    {
      _id: '9',
      name: 'King Size Bed',
      price: 1599.99,
      discount: 10,
      category: 'beds',
      color: 'brown',
      material: 'wood',
      images: ['images/product-1.png']
    },
    {
      _id: '10',
      name: 'Bookshelf',
      price: 349.99,
      discount: 0,
      category: 'storage',
      color: 'white',
      material: 'wood',
      images: ['images/product-2.png']
    },
    {
      _id: '11',
      name: 'Dining Chair',
      price: 149.99,
      discount: 0,
      category: 'chairs',
      color: 'brown',
      material: 'wood',
      images: ['images/product-3.png']
    },
    {
      _id: '12',
      name: 'Dining Table',
      price: 599.99,
      discount: 5,
      category: 'tables',
      color: 'brown',
      material: 'wood',
      images: ['images/couch.png']
    }
  ];
  
  // Filter products based on criteria
  let filteredProducts = [...allProducts];
  
  // Filter by category
  if (categories.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      categories.includes(product.category)
    );
  }
  
  // Filter by color
  if (colors.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      colors.includes(product.color)
    );
  }
  
  // Filter by material
  if (materials.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      materials.includes(product.material)
    );
  }
  
  // Filter by price
  filteredProducts = filteredProducts.filter(product => 
    product.price >= parseInt(minPrice) && product.price <= parseInt(maxPrice)
  );
  
  // Sort products
  switch (sortBy) {
    case 'price-asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      // For demo, we'll just reverse the array to simulate newest
      filteredProducts.reverse();
      break;
    default:
      // Featured - no specific sorting
      break;
  }
  
  // Pagination
  const itemsPerPage = 12;
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  
  // Get current page items
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Update product count
  const productCount = document.getElementById('product-count');
  if (productCount) {
    productCount.textContent = `Showing ${currentPageProducts.length} of ${totalProducts} products`;
  }
  
  // Clear container
  productContainer.innerHTML = '';
  
  if (currentPageProducts.length > 0) {
    // Add products to the container
    currentPageProducts.forEach(product => {
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
      productContainer.innerHTML += `
        <div class="col-6 col-md-4 col-lg-3 mb-4">
          <a class="product-item shop-product-item" href="product-detail.html?id=${product._id}">
            <img src="${product.images[0]}" class="img-fluid product-thumbnail" alt="${product.name}">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price-container">
              ${priceDisplay}
            </div>
            ${product.countInStock === 0 ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
            <span class="icon-cross">
              <img src="images/cross.svg" class="img-fluid">
            </span>
          </a>
        </div>
      `;
    });
    
    // Create pagination
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="loadProducts(${page - 1}); return false;">Previous</a>
      </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <li class="page-item ${i === page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="loadProducts(${i}); return false;">${i}</a>
        </li>
      `;
    }
    
    // Next button
    paginationHTML += `
      <li class="page-item ${page === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="loadProducts(${page + 1}); return false;">Next</a>
      </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
  } else {
    productContainer.innerHTML = `
      <div class="col-12 text-center mt-5">
        <p>No products found matching your criteria.</p>
      </div>
    `;
    paginationContainer.innerHTML = '';
  }
}
