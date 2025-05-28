// auth.js - Authentication utility functions

// Create a global auth utilities object
window.authUtils = (function() {
  'use strict';
  
  // Check if user is logged in
  function isLoggedIn() {
    const userInfo = localStorage.getItem('userInfo');
    return !!userInfo;
  }
  
  // Get current user information
  function getCurrentUser() {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error parsing user info:', error);
      return null;
    }
  }
  
  // Get authentication token
  function getToken() {
    const userInfo = getCurrentUser();
    return userInfo ? userInfo.token : null;
  }
  
  // Log out user
  function logoutUser() {
    localStorage.removeItem('userInfo');
    window.location.href = 'index.html';
  }
  
  // Check if user is admin
  function isAdmin() {
    const userInfo = getCurrentUser();
    return userInfo ? userInfo.isAdmin : false;
  }
  
  // Update user profile in localStorage
  function updateUserProfile(updatedUser) {
    try {
      const userInfo = getCurrentUser();
      if (userInfo) {
        const updatedUserInfo = { ...userInfo, ...updatedUser };
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }
  
  // Public API
  return {
    isLoggedIn,
    getCurrentUser,
    getToken,
    logoutUser,
    isAdmin,
    updateUserProfile
  };
})();

// Add authentication headers to fetch requests
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  // Only add auth header for API requests
  if (url.includes('/api/') && window.authUtils.isLoggedIn()) {
    const token = window.authUtils.getToken();
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  return originalFetch(url, options);
};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth.js loaded, checking authentication status...');
  console.log('User logged in:', window.authUtils.isLoggedIn());
  
  // Redirect from protected pages if not logged in
  const protectedPages = [
    'profile.html',
    'my-orders.html',
    'checkout.html'
  ];
  
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage) && !window.authUtils.isLoggedIn()) {
    window.location.href = 'login.html?redirect=' + currentPage;
  }
  
  // Redirect from auth pages if already logged in
  const authPages = [
    'login.html',
    'register.html',
    'signup.html'
  ];
  
  if (authPages.includes(currentPage) && window.authUtils.isLoggedIn()) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    window.location.href = redirect || 'index.html';
  }
});
