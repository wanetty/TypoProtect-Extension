// ============================================
// Modern Warning Banner with Animation
// ============================================

let warningBanner = null;

function createWarningBanner(message, reason) {
  // Remove existing banner if any
  if (warningBanner) {
    warningBanner.remove();
  }

  // Create banner container
  const banner = document.createElement('div');
  banner.id = 'typoprotect-warning-banner';
  
  // Banner HTML structure
  banner.innerHTML = `
    <style>
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      #typoprotect-warning-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2147483647;
        background: rgba(220, 38, 38, 0.97);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: white;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      }
      
      #typoprotect-banner-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      #typoprotect-banner-icon {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
      }
      
      #typoprotect-banner-text {
        flex: 1;
      }
      
      #typoprotect-banner-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 4px 0;
        letter-spacing: 0.3px;
      }
      
      #typoprotect-banner-subtitle {
        font-size: 13px;
        margin: 0;
        opacity: 0.95;
      }
      
      #typoprotect-banner-close {
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 20px;
        font-weight: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      #typoprotect-banner-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }
      
      #typoprotect-banner-close:active {
        transform: scale(0.95);
      }
    </style>
    
    <div id="typoprotect-banner-content">
      <div id="typoprotect-banner-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9v4m0 4h.01M12 3l9 18H3l9-18z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div id="typoprotect-banner-text">
        <div id="typoprotect-banner-title">⚠️ SECURITY WARNING</div>
        <div id="typoprotect-banner-subtitle">${message}</div>
      </div>
      <button id="typoprotect-banner-close" title="Close warning">×</button>
    </div>
  `;
  
  // Add close button functionality
  const closeButton = banner.querySelector('#typoprotect-banner-close');
  closeButton.addEventListener('click', () => {
    banner.style.animation = 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse';
    setTimeout(() => {
      banner.remove();
      warningBanner = null;
    }, 300);
  });
  
  warningBanner = banner;
  return banner;
}

function showWarningBanner(message, reason) {
  const banner = createWarningBanner(message, reason);
  
  // Insert banner when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.prepend(banner);
    });
  } else {
    document.body.prepend(banner);
  }
}

// ============================================
// Message Listener
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'danger') {
    const message = request.message || '🛡️ This website has been identified as potentially dangerous';
    const reason = request.reason || 'unknown';
    
    showWarningBanner(message, reason);
  }
});
