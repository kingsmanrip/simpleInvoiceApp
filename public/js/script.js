// General JavaScript for the invoice app

// Auto close alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  // Auto close alerts
  const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
  alerts.forEach(alert => {
    setTimeout(() => {
      if (alert.parentNode) {
        alert.classList.add('fade');
        setTimeout(() => {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 500);
      }
    }, 5000);
  });
  
  // Activate tooltips
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
  
  // Activate popovers
  if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  }
});