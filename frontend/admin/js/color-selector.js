// Color selector functionality
document.addEventListener('DOMContentLoaded', function() {
  // Set up color checkbox listeners
  const colorCheckboxes = document.querySelectorAll('.color-checkbox');
  const selectedColorsPreview = document.getElementById('selected-colors-preview');
  
  if (colorCheckboxes.length > 0) {
    colorCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateSelectedColorsPreview);
    });
    
    // Initial update
    updateSelectedColorsPreview();
  }
  
  function updateSelectedColorsPreview() {
    if (!selectedColorsPreview) return;
    
    const selectedColors = [];
    document.querySelectorAll('.color-checkbox:checked').forEach(checkbox => {
      selectedColors.push(checkbox.value);
    });
    
    if (selectedColors.length > 0) {
      selectedColorsPreview.innerHTML = `
        <div class="alert alert-info">
          <strong>Selected colors:</strong> ${selectedColors.join(', ')}
        </div>
      `;
    } else {
      selectedColorsPreview.innerHTML = `
        <div class="alert alert-warning">
          <strong>No colors selected.</strong> Please select at least one color.
        </div>
      `;
    }
  }
});
