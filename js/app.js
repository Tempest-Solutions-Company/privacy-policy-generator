document.addEventListener('DOMContentLoaded', () => {
  const policyForm = document.getElementById('policyForm');
  const resultSection = document.getElementById('result');
  const policyPreview = document.getElementById('policyPreview');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadMarkdownBtn = document.getElementById('downloadMarkdownBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  // Initialize the generator
  const generator = new PrivacyPolicyGenerator();
  let generatedPolicy = null;
  
  // Wait for all resources to load before allowing generation
  window.addEventListener('load', () => {
    console.log('All resources loaded');
  });
  
  // Add event listeners to prevent selecting both payment options
  const paymentCheckbox = document.querySelector('input[name="thirdParties"][value="payment"]');
  const paypalOnlyCheckbox = document.querySelector('input[name="thirdParties"][value="paypal_only"]');
  
  if (paymentCheckbox && paypalOnlyCheckbox) {
    paymentCheckbox.addEventListener('change', function() {
      if (this.checked && paypalOnlyCheckbox.checked) {
        paypalOnlyCheckbox.checked = false;
      }
    });
    
    paypalOnlyCheckbox.addEventListener('change', function() {
      if (this.checked && paymentCheckbox.checked) {
        paymentCheckbox.checked = false;
      }
    });
  }
  
  policyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Show loading indicator
      policyPreview.innerHTML = '<p>Generating your comprehensive privacy policy...</p>';
      resultSection.classList.remove('hidden');
      policyForm.classList.add('hidden');
      
      // Collect form data, including the additional fields
      const formData = {
        businessName: document.getElementById('businessName').value,
        businessType: document.getElementById('businessType').value,
        jurisdiction: document.getElementById('jurisdiction').value,
        sellRegions: Array.from(document.querySelectorAll('input[name="sell_regions"]:checked')).map(cb => cb.value),
        dataCollected: Array.from(document.querySelectorAll('input[name="dataCollected"]:checked')).map(cb => cb.value),
        thirdParties: Array.from(document.querySelectorAll('input[name="thirdParties"]:checked')).map(cb => cb.value),
        compliance: Array.from(document.querySelectorAll('input[name="compliance"]:checked')).map(cb => cb.value),
        
        // Additional fields
        websiteUrl: document.getElementById('websiteUrl')?.value || '',
        country: document.getElementById('country')?.value || 'United States',
        businessAddress: document.getElementById('businessAddress')?.value || '',
        contactEmail: document.getElementById('contactEmail')?.value || '',
        contactPhone: document.getElementById('contactPhone')?.value || '',
        contactPage: document.getElementById('contactPage')?.value || ''
      };
      
      console.log('Generating policy with data:', formData);
      
      // Generate the policy (with a small delay to allow the UI to update)
      setTimeout(async () => {
        try {
          generatedPolicy = await generator.generate(formData);
          
          // Display the policy
          if (generatedPolicy && generatedPolicy.html) {
            console.log('Policy generated successfully');
            policyPreview.innerHTML = generatedPolicy.html;
          } else {
            throw new Error('Generated policy is empty or invalid');
          }
        } catch (error) {
          console.error('Error generating policy:', error);
          policyPreview.innerHTML = `
            <div style="color: #721c24; background-color: #f8d7da; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <h3>Error Generating Policy</h3>
              <p>${error.message || 'Unknown error occurred'}</p>
              <p>Please check your inputs and try again. If the problem persists, try refreshing the page.</p>
              <details>
                <summary>Technical Details</summary>
                <pre>${error.stack || 'No stack trace available'}</pre>
              </details>
            </div>
          `;
        }
      }, 100);
    } catch (error) {
      console.error('Form submission error:', error);
      policyPreview.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  });
  
  // Copy to clipboard functionality
  copyBtn.addEventListener('click', () => {
    if (!generatedPolicy) return;
    
    // Try to use the Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedPolicy.text)
        .then(() => alert('Privacy policy copied to clipboard!'))
        .catch(err => {
          console.error('Could not copy text: ', err);
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
    
    function fallbackCopy() {
      const tempTextarea = document.createElement('textarea');
      tempTextarea.value = generatedPolicy.text;
      document.body.appendChild(tempTextarea);
      tempTextarea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextarea);
      alert('Privacy policy copied to clipboard!');
    }
  });
  
  // Download as HTML functionality
  downloadBtn.addEventListener('click', () => {
    if (!generatedPolicy) return;
    
    const blob = new Blob([generatedPolicy.html], {type: 'text/html'});
    downloadFile(blob, 'privacy-policy.html');
  });
  
  // Download as Markdown functionality
  downloadMarkdownBtn.addEventListener('click', () => {
    if (!generatedPolicy) return;
    
    const blob = new Blob([generatedPolicy.markdown], {type: 'text/markdown'});
    downloadFile(blob, 'privacy-policy.md');
  });
  
  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Reset form functionality
  resetBtn.addEventListener('click', () => {
    policyForm.reset();
    resultSection.classList.add('hidden');
    policyForm.classList.remove('hidden');
  });
  
  // Initialize tooltips - simplified and more reliable implementation
  function initializeTooltips() {
    document.querySelectorAll('.info-tooltip').forEach(tooltip => {
      // Create tooltip element if it doesn't exist
      if (!tooltip.querySelector('.tooltip-popup')) {
        const tooltipContent = tooltip.getAttribute('title') || tooltip.getAttribute('data-tooltip');
        if (tooltipContent) {
          // Store content in data attribute and remove title to prevent default browser tooltip
          tooltip.setAttribute('data-tooltip', tooltipContent);
          tooltip.removeAttribute('title');
          
          // Create tooltip element
          const tooltipEl = document.createElement('div');
          tooltipEl.className = 'tooltip-popup';
          tooltipEl.textContent = tooltipContent;
          tooltip.appendChild(tooltipEl);
          
          // Position tooltip centered above the icon
          tooltipEl.style.bottom = '24px';
          tooltipEl.style.left = '50%';
          tooltipEl.style.transform = 'translateX(-50%)';
        }
      }
    });
  }
  
  // Initialize tooltips after DOM content loaded
  initializeTooltips();
  
  // Also initialize tooltips after any dynamic content is added
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        initializeTooltips();
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
});
