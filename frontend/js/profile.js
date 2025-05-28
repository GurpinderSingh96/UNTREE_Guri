// Profile page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in using authUtils
  const isLoggedIn = window.authUtils && window.authUtils.isLoggedIn();
  if (!isLoggedIn) {
    window.location.href = 'login.html?redirect=profile.html';
    return;
  }
  
  // Load user profile data
  loadUserProfile();
  
  // Set up form submissions
  document.getElementById('profile-form').addEventListener('submit', function(e) {
    e.preventDefault();
    updateProfile();
  });
  
  document.getElementById('address-form').addEventListener('submit', function(e) {
    e.preventDefault();
    updateAddress();
  });
  
  document.getElementById('password-form').addEventListener('submit', function(e) {
    e.preventDefault();
    updatePassword();
  });
});

// Function to load user profile data
function loadUserProfile() {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    console.error('No authentication token found');
    window.location.href = 'login.html?redirect=profile.html';
    return;
  }
  
  const loadingSpinner = document.querySelector('.loading-spinner');
  const profileContent = document.querySelector('.profile-content');
  
  fetch('/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    return response.json();
  })
  .then(user => {
    // Hide loading spinner and show content
    loadingSpinner.style.display = 'none';
    profileContent.classList.remove('d-none');
    
    // Fill in personal information
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    
    // Fill in address information if available
    if (user.address) {
      document.getElementById('street').value = user.address.street || '';
      document.getElementById('city').value = user.address.city || '';
      document.getElementById('state').value = user.address.state || '';
      document.getElementById('postalCode').value = user.address.postalCode || '';
      
      // Set country if available
      const countrySelect = document.getElementById('country');
      if (user.address.country) {
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
    console.error('Error loading profile:', error);
    showError('Failed to load profile. Please try again later.');
    
    // Hide loading spinner
    loadingSpinner.style.display = 'none';
  });
}

// Function to update profile information
function updateProfile() {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    showError('Authentication error. Please log in again.');
    return;
  }
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  
  // Show loading state
  const submitButton = document.querySelector('#profile-form button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
  
  fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      email,
      phone
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    return response.json();
  })
  .then(data => {
    showSuccess('Profile updated successfully!');
    
    // Update user info in authUtils
    if (window.authUtils && window.authUtils.updateUserProfile) {
      window.authUtils.updateUserProfile({
        name,
        email
      });
    }
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  })
  .catch(error => {
    console.error('Error updating profile:', error);
    showError('Failed to update profile. Please try again.');
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  });
}

// Function to update address information
function updateAddress() {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    showError('Authentication error. Please log in again.');
    return;
  }
  
  const street = document.getElementById('street').value;
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const postalCode = document.getElementById('postalCode').value;
  const country = document.getElementById('country').value;
  
  // Show loading state
  const submitButton = document.querySelector('#address-form button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
  
  fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      address: {
        street,
        city,
        state,
        postalCode,
        country
      }
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update address');
    }
    return response.json();
  })
  .then(data => {
    showSuccess('Address updated successfully!');
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  })
  .catch(error => {
    console.error('Error updating address:', error);
    showError('Failed to update address. Please try again.');
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  });
}

// Function to update password
function updatePassword() {
  // Get token from authUtils
  const token = window.authUtils ? window.authUtils.getToken() : null;
  
  if (!token) {
    showError('Authentication error. Please log in again.');
    return;
  }
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate passwords
  if (newPassword !== confirmPassword) {
    showError('New passwords do not match.');
    return;
  }
  
  if (newPassword.length < 6) {
    showError('Password must be at least 6 characters long.');
    return;
  }
  
  // Show loading state
  const submitButton = document.querySelector('#password-form button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
  
  fetch('/api/users/profile/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword,
      newPassword
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update password');
    }
    return response.json();
  })
  .then(data => {
    showSuccess('Password updated successfully!');
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  })
  .catch(error => {
    console.error('Error updating password:', error);
    showError('Failed to update password. Please check your current password and try again.');
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  });
}

// Function to show success message
function showSuccess(message) {
  const successElement = document.getElementById('success-message');
  const errorElement = document.getElementById('error-message');
  
  // Hide error message if visible
  errorElement.classList.add('d-none');
  
  // Show success message
  successElement.textContent = message;
  successElement.classList.remove('d-none');
  
  // Hide message after 5 seconds
  setTimeout(() => {
    successElement.classList.add('d-none');
  }, 5000);
}

// Function to show error message
function showError(message) {
  const successElement = document.getElementById('success-message');
  const errorElement = document.getElementById('error-message');
  
  // Hide success message if visible
  successElement.classList.add('d-none');
  
  // Show error message
  errorElement.textContent = message;
  errorElement.classList.remove('d-none');
  
  // Hide message after 5 seconds
  setTimeout(() => {
    errorElement.classList.add('d-none');
  }, 5000);
}
