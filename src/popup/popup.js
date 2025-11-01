// ============================================
// Toast Notification System
// ============================================
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// ============================================
// Update Protection Status Display
// ============================================
async function updateProtectionStatus() {
  try {
    const data = await chrome.storage.local.get(['domainCount', 'lastUpdate']);
    const statusElement = document.getElementById('protectionStatus');
    
    if (data.domainCount) {
      statusElement.textContent = `${data.domainCount.toLocaleString()} malicious domains blocked`;
    } else {
      statusElement.textContent = 'Initializing...';
    }
    
    if (data.lastUpdate) {
      const hoursSince = Math.floor((Date.now() - data.lastUpdate) / (1000 * 60 * 60));
      const lastUpdateText = hoursSince < 1 ? 'Updated less than 1 hour ago' : 
                              hoursSince === 1 ? 'Updated 1 hour ago' :
                              `Updated ${hoursSince} hours ago`;
      
      // Update subtitle or create a new element for last update info
      const subtitle = statusElement.parentElement.querySelector('.last-update') || 
                       document.createElement('p');
      subtitle.className = 'last-update';
      subtitle.textContent = lastUpdateText;
      subtitle.style.fontSize = '12px';
      subtitle.style.color = '#6b7280';
      subtitle.style.marginTop = '2px';
      
      if (!statusElement.parentElement.querySelector('.last-update')) {
        statusElement.parentElement.appendChild(subtitle);
      }
    }
  } catch (error) {
    console.error('Error updating protection status:', error);
  }
}

// ============================================
// Manual Update Button
// ============================================
document.getElementById('updateButton').addEventListener('click', async () => {
  const button = document.getElementById('updateButton');
  button.classList.add('spinning');
  button.disabled = true;
  
  try {
    // Send message to background script to trigger update
    const response = await chrome.runtime.sendMessage({ action: 'updateMaliciousDomains' });
    
    if (response && response.success) {
      showToast('✓ Database updated successfully');
      await updateProtectionStatus();
    } else {
      showToast('✗ Error updating database', true);
    }
  } catch (error) {
    console.error('Update error:', error);
    showToast('✗ Error updating database', true);
  } finally {
    button.classList.remove('spinning');
    button.disabled = false;
  }
});

// ============================================
// Add Domain Button
// ============================================
document.getElementById('addButton').addEventListener('click', () => {
  let domain = document.getElementById('domainInput').value;
  if (!domain) {
    return;
  }

  if (!/^https?:\/\//i.test(domain)) {
    domain = 'https://' + domain;
  }
  let url;
  try {
    url = new URL(domain);
  } catch (e) {
    return;
  }

  domain = extractMainDomain(url.hostname);
  if (!/^https?:\/\//i.test(domain)) {
    domain = 'https://' + domain;
  }

  chrome.storage.sync.get('trustedDomains', function(result) {
    let domains = result.trustedDomains || [];
    if (!domains.includes(domain)) {
      domains.push(domain);
      chrome.storage.sync.set({'trustedDomains': domains}, function() {
        loadDomains();
        showToast('✓ Domain added successfully');
        document.getElementById('domainInput').value = '';
      });
    } else {
      showToast('This domain is already in the list', true);
    }
  });
});

function extractMainDomain(hostname) {
  const parts = hostname.split('.');
  const tld = parts.pop();
  const domain = parts.pop();
  return `${domain}.${tld}`;
}

//Get actual URL when open the extension and put it in the input
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  const currentTabId = tabs[0].id;
  chrome.tabs.get(currentTabId, function(tab) {
    const url = new URL(tab.url);
    document.getElementById('domainInput').value = url.hostname;
  });
});


document.getElementById('deleteButton').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all trusted domains?')) {
    chrome.storage.sync.set({'trustedDomains': []}, function() {
      loadDomains();
      showToast('✓ All domains deleted');
    });
  }
});

function loadDomains() {
  let domainList = document.getElementById('domainList');
  domainList.innerHTML = '';

  chrome.storage.sync.get('trustedDomains', function(data) {
    if (data.trustedDomains && data.trustedDomains.length > 0) {
      data.trustedDomains.forEach(function(domain, index) {
        let li = document.createElement('li');
        
        let span = document.createElement('span');
        span.textContent = domain;
        
        let deleteButton = document.createElement('button');
        deleteButton.textContent = '×'; 
        deleteButton.title = 'Delete domain';
        deleteButton.onclick = function() {
          deleteDomain(index);
        };

        li.appendChild(span);
        li.appendChild(deleteButton);
        domainList.appendChild(li);
      });
    } else {
      let emptyMessage = document.createElement('li');
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#6b7280';
      emptyMessage.style.border = 'none';
      emptyMessage.style.background = 'transparent';
      emptyMessage.innerHTML = '<span>No trusted domains added</span>';
      domainList.appendChild(emptyMessage);
    }
  });
}


function deleteDomain(index) {
  chrome.storage.sync.get('trustedDomains', function(data) {
    var domains = data.trustedDomains;
    const deletedDomain = domains[index];
    domains.splice(index, 1);

    chrome.storage.sync.set({'trustedDomains': domains}, function() {
      loadDomains();
      showToast(`✓ ${deletedDomain} eliminado`);
    });
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  // Load domains list
  loadDomains();
  
  // Update protection status
  await updateProtectionStatus();
  
  // Update status every 10 seconds while popup is open
  setInterval(updateProtectionStatus, 10000);
});



document.getElementById('settingsButton').addEventListener('click', function() {
  document.getElementById('settingsMenu').classList.add('open');
});

document.getElementById('loadButton').addEventListener('click', () => {
  document.getElementById('settingsMenu').classList.remove('open');
  
  const predefinedUrls = [
    'https://google.com',
    'https://amazon.com',
    'https://youtube.com',
    'https://facebook.com',
    'https://instagram.com',
    'https://reddit.com',
    'https://tiktok.com',
    'https://wikipedia.org',
    'https://twitter.com',
    'https://linkedin.com',
    'https://microsoft.com',
    'https://apple.com',
    'https://netflix.com',
    'https://spotify.com',
    'https://github.com',
    'https://dropbox.com',
    'https://stackoverflow.com',
    'https://paypal.com',
    'https://ebay.com',
    'https://wordpress.org',
    'https://wordpress.com',
    'https://mozilla.org',
    'https://adobe.com',
    'https://slack.com',
    'https://pinterest.com',
    'https://zoom.us',
    'https://bbc.com',
    'https://nytimes.com',
    'https://wordpress.org',
    'https://wordpress.com',
    'https://wordpress.org',
    'https://stackoverflow.com',
    'https://wordpress.com',
    'https://wordpress.org',
    'https://virustotal.com',
    'https://phishtank.com',
    'https://duckduckgo.com',
    'https://telegram.org',
    'https://slack.com',
    'https://onedrive.live.com',
    'https://bitbucket.org',
    'https://codecademy.com',
    'https://stackoverflow.com',
    'https://codepen.io',
    'https://docker.com',
    'https://khanacademy.org',
    'https://buy.spotify.com',
    'https://wordpress.org',
    'https://wordpress.com',
    'https://mongodb.com',
    'https://oracle.com',
    'https://asp.net',
    'https://hub.docker.com',
    'https://wikimedia.org',
    'https://fandom.com',
    'https://discord.com',
    'https://webflow.com',
    'https://cloudflare.com',
    'https://geeksforgeeks.org',
    'https://jupyter.org',
    'https://stackoverflow.com',
    'https://ubuntu.com',
    'https://w3schools.com'
  ];

  chrome.storage.sync.get('trustedDomains', function(result) {
    let domains = result.trustedDomains || [];
    predefinedUrls.forEach(url => {
      if (!domains.includes(url)) {
        domains.push(url);
      }
    });
    chrome.storage.sync.set({'trustedDomains': domains}, function() {
      loadDomains();
      showToast('✓ Suggested sites loaded successfully');
    });
  });
});

document.getElementById('importButton').addEventListener('click', function() {
  document.getElementById('settingsMenu').classList.remove('open');
  
  var input = document.createElement('input');
  input.type = 'file';

  input.addEventListener('change', function() {
    var file = this.files[0];
    var reader = new FileReader();

    reader.addEventListener('load', function() {
      var contents = this.result;

      var domains = contents.split('\n');

      chrome.storage.sync.get('trustedDomains', function(result) {
        let domainsList = result.trustedDomains || [];
        domains.forEach(domain => {
          if (!domainsList.includes(domain)) {
            domainsList.push(domain);
          }
        });
        chrome.storage.sync.set({'trustedDomains': domainsList}, function() {
          loadDomains();
          showToast('✓ Domains imported successfully');
        });
      });
    });

    reader.readAsText(file);
  });

  input.click();
});

document.getElementById('exportButton').addEventListener('click', function() {
  document.getElementById('settingsMenu').classList.remove('open');
  
  // Obtener los dominios de la memoria
  chrome.storage.sync.get('trustedDomains', function(result) {
    let domains = result.trustedDomains || [];

    // Crear un blob con los dominios
    var blob = new Blob([domains.join('\n')], {type: 'text/plain'});

    // Crear una URL para el blob
    var url = URL.createObjectURL(blob);

    // Crear un enlace para descargar el archivo
    var link = document.createElement('a');
    link.href = url;
    link.download = 'domains.txt';

    // Agregar el enlace al documento y hacer clic en él
    document.body.appendChild(link);
    link.click();

    // Eliminar el enlace después de la descarga
    setTimeout(function() {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('✓ Domains exported successfully');
    }, 0);
  });
});

document.getElementById('closeButton').addEventListener('click', function() {
  document.getElementById('settingsMenu').classList.remove('open');
});  