(function() {
	'use strict';

	var tinyslider = function() {
		var el = document.querySelectorAll('.testimonial-slider');

		if (el.length > 0) {
			var slider = tns({
				container: '.testimonial-slider',
				items: 1,
				axis: "horizontal",
				controlsContainer: "#testimonial-nav",
				swipeAngle: false,
				speed: 700,
				nav: true,
				controls: true,
				autoplay: true,
				autoplayHoverPause: true,
				autoplayTimeout: 3500,
				autoplayButtonOutput: false
			});
		}
	};
	tinyslider();

	


	var sitePlusMinus = function() {
		var value,
    		quantity = document.getElementsByClassName('quantity-container');

		function createBindings(quantityContainer) {
	      var quantityAmount = quantityContainer.getElementsByClassName('quantity-amount')[0];
	      var increase = quantityContainer.getElementsByClassName('increase')[0];
	      var decrease = quantityContainer.getElementsByClassName('decrease')[0];
	      
	      // Check if elements exist before adding event listeners
	      if (increase) {
	        increase.addEventListener('click', function (e) { increaseValue(e, quantityAmount); });
	      }
	      
	      if (decrease) {
	        decrease.addEventListener('click', function (e) { decreaseValue(e, quantityAmount); });
	      }
	    }

	    function init() {
	        if (quantity.length > 0) {
	            for (var i = 0; i < quantity.length; i++ ) {
	                createBindings(quantity[i]);
	            }
	        }
	    };

	    function increaseValue(event, quantityAmount) {
	        value = parseInt(quantityAmount.value, 10);
	        console.log(quantityAmount, quantityAmount.value);
	        value = isNaN(value) ? 0 : value;
	        value++;
	        quantityAmount.value = value;
	    }

	    function decreaseValue(event, quantityAmount) {
	        value = parseInt(quantityAmount.value, 10);
	        value = isNaN(value) ? 0 : value;
	        if (value > 0) value--;
	        quantityAmount.value = value;
	    }
	    
	    init();
	};
	sitePlusMinus();


})()
// User Authentication Display
// This functionality is now handled by include-html.js
// Keeping this comment to maintain file structure without changing anything else
// Update cart count on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
});

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
