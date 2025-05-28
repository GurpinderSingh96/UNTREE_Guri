// Function to include HTML content
function includeHTML() {
  const elements = document.querySelectorAll('[include-html]');
  
  elements.forEach(element => {
    const file = element.getAttribute('include-html');
    
    if (file) {
      // Make an HTTP request using the file path attribute
      const xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            element.innerHTML = this.responseText;
            
            // Execute any scripts in the included HTML
            const scripts = element.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
              eval(scripts[i].text);
            }
            
            // Mark the current page as active in the navigation
            markCurrentPageActive();
            
            // Update authentication display after including header
            if (file.includes('header.html')) {
              updateAuthDisplay();
            }
          }
          
          if (this.status == 404) {
            element.innerHTML = "Page not found.";
          }
          
          // Remove the attribute to prevent future processing
          element.removeAttribute('include-html');
          
          // Continue with the next element
          includeHTML();
        }
      }
      
      xhttp.open("GET", file, true);
      xhttp.send();
      
      // Exit the function to wait for the response
      return;
    }
  });
}

// Function to mark the current page as active in the navigation
function markCurrentPageActive() {
  // Get the current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Find the navigation link that matches the current page
  const navLinks = document.querySelectorAll('.custom-navbar-nav .nav-link');
  
  navLinks.forEach(link => {
    // Remove active class from all links
    link.parentElement.classList.remove('active');
    
    // Add active class to the current page link
    if (link.getAttribute('href') === currentPage) {
      link.parentElement.classList.add('active');
    }
  });
}

// Function to update authentication display
function updateAuthDisplay() {
  // Wait a bit to ensure auth.js is fully loaded
  setTimeout(function() {
    console.log("Updating auth display after header inclusion");
    
    // Check if user is logged in using auth utility
    const isLoggedIn = window.authUtils && window.authUtils.isLoggedIn();
    const currentUser = isLoggedIn ? window.authUtils.getCurrentUser() : null;
    
    console.log("Auth status in updateAuthDisplay:", isLoggedIn, currentUser);
    
    // Get the navbar CTAs container
    const navbarCta = document.querySelector('.custom-navbar-cta');
    
    if (navbarCta) {
      if (isLoggedIn && currentUser && currentUser.name) {
        // Get first 3 letters of user's name
        const userInitials = currentUser.name.substring(0, 3);
        
        console.log("User logged in:", userInitials);
        
        // User is logged in, update the navigation
        navbarCta.innerHTML = `
          <li class="dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              <img src="images/user.svg"> ${userInitials}
            </a>
            <ul class="dropdown-menu" aria-labelledby="userDropdown">
              <li><a class="dropdown-item" href="profile.html">My Profile</a></li>
              <li><a class="dropdown-item" href="my-orders.html">My Orders</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" id="logout-btn">Logout</a></li>
            </ul>
          </li>
          <li><a class="nav-link" href="cart.html"><img src="images/cart.svg"></a></li>
        `;
        
        // Add event listener for logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.authUtils) {
              window.authUtils.logoutUser();
            } else {
              // Fallback if auth.js is not loaded
              localStorage.removeItem('userToken');
              localStorage.removeItem('userName');
              localStorage.removeItem('userEmail');
              window.location.href = 'index.html';
            }
          });
        }
      } else {
        // User is not logged in, show login/signup links
        // navbarCta.innerHTML = `
        //   <li><a class="nav-link" href="login.html"><img src="images/user.svg"> Login</a></li>
        //   <li><a class="nav-link" href="signup.html">Sign Up</a></li>
        //   <li><a class="nav-link" href="cart.html"><img src="images/cart.svg"></a></li>
        // `;
      }
    }
  }, 0); // Reduced delay to prevent flashing
}

// Run the includeHTML function when the page loads
document.addEventListener('DOMContentLoaded', includeHTML);
