const SIMILARITY_THRESHOLD = 2;
const tabStates = {};

// ============================================
// Automatic Update System
// ============================================

// Initialize on extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  
  // Initialize Bloom filter
  await initializeBloomFilter();
  
  // Fetch fresh data
  await fetchMaliciousDomains();
  
  // Setup daily update alarm
  chrome.alarms.create('updateMaliciousDomains', {
    periodInMinutes: 1440 // 24 hours
  });
  
  console.log('✓ Daily update alarm created');
});

// Initialize on browser startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started');
  
  // Initialize Bloom filter from storage
  await initializeBloomFilter();
  
  // Check if update needed (>24h since last update)
  const data = await chrome.storage.local.get('lastUpdate');
  const hoursSinceUpdate = (Date.now() - (data.lastUpdate || 0)) / (1000 * 60 * 60);
  
  if (hoursSinceUpdate > 24) {
    console.log('Update needed (>24h since last update)');
    await fetchMaliciousDomains();
  }
});

// Handle alarm for periodic updates
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'updateMaliciousDomains') {
    console.log('Alarm triggered: updating malicious domains');
    await fetchMaliciousDomains();
  }
});

// Handle messages from popup (manual update button)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateMaliciousDomains') {
    fetchMaliciousDomains().then(success => {
      sendResponse({ success });
    });
    return true; // Keep channel open for async response
  }
});

// ============================================
// Bloom Filter Implementation
// ============================================
class BloomFilter {
  constructor(size = 100000, hashCount = 5) {
    this.size = size;
    this.hashCount = hashCount;
    this.bits = new Uint8Array(Math.ceil(size / 8));
  }

  // Simple hash functions
  hash1(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.size;
  }

  hash2(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash) % this.size;
  }

  getHash(str, seed) {
    const h1 = this.hash1(str);
    const h2 = this.hash2(str);
    return (h1 + seed * h2) % this.size;
  }

  add(item) {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.getHash(item.toLowerCase(), i);
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      this.bits[byteIndex] |= (1 << bitIndex);
    }
  }

  contains(item) {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.getHash(item.toLowerCase(), i);
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      if ((this.bits[byteIndex] & (1 << bitIndex)) === 0) {
        return false;
      }
    }
    return true;
  }

  toJSON() {
    return {
      size: this.size,
      hashCount: this.hashCount,
      bits: Array.from(this.bits)
    };
  }

  static fromJSON(data) {
    const filter = new BloomFilter(data.size, data.hashCount);
    filter.bits = new Uint8Array(data.bits);
    return filter;
  }
}

// ============================================
// Global Bloom Filter Instance
// ============================================
let maliciousDomainsFilter = null;

// ============================================
// Initial Malicious Domains (for offline-first)
// ============================================
const INITIAL_MALICIOUS_DOMAINS = [
  'secure-paypal-verify.com',
  'appleid-unlock.com',
  'facebook-security-check.com',
  'amazcn.com',
  'gooogle.com',
  'microsooft.com',
  'netfliix.com',
  'paypa1.com',
  'bankofameriica.com',
  'wells-fargo-secure.com'
];

// ============================================
// Fetch Malicious Domains from OpenPhish
// ============================================
async function fetchMaliciousDomains() {
  try {
    console.log('Fetching malicious domains from OpenPhish...');
    
    const response = await fetch('https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const urls = text.split('\n').filter(line => line.trim());
    
    // Extract domains from URLs
    const domains = new Set();
    for (const url of urls) {
      try {
        const hostname = new URL(url.startsWith('http') ? url : 'http://' + url).hostname;
        if (hostname) {
          domains.add(hostname.toLowerCase());
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    // Create Bloom filter
    const filter = new BloomFilter(100000, 5);
    
    // Add all domains to Bloom filter
    for (const domain of domains) {
      filter.add(domain);
    }
    
    // Also add initial domains
    for (const domain of INITIAL_MALICIOUS_DOMAINS) {
      filter.add(domain);
    }
    
    // Save to storage
    await chrome.storage.local.set({
      bloomFilterData: filter.toJSON(),
      lastUpdate: Date.now(),
      domainCount: domains.size + INITIAL_MALICIOUS_DOMAINS.length
    });
    
    // Update global instance
    maliciousDomainsFilter = filter;
    
    console.log(`✓ Bloom filter updated with ${domains.size} domains`);
    return true;
    
  } catch (error) {
    console.error('Error fetching malicious domains:', error);
    return false;
  }
}

// ============================================
// Initialize Bloom Filter from Storage
// ============================================
async function initializeBloomFilter() {
  try {
    const data = await chrome.storage.local.get(['bloomFilterData', 'lastUpdate', 'domainCount']);
    
    if (data.bloomFilterData) {
      maliciousDomainsFilter = BloomFilter.fromJSON(data.bloomFilterData);
      console.log(`✓ Bloom filter loaded from storage (${data.domainCount || 0} domains)`);
    } else {
      // First time: create filter with initial domains
      maliciousDomainsFilter = new BloomFilter(100000, 5);
      for (const domain of INITIAL_MALICIOUS_DOMAINS) {
        maliciousDomainsFilter.add(domain);
      }
      
      await chrome.storage.local.set({
        bloomFilterData: maliciousDomainsFilter.toJSON(),
        lastUpdate: Date.now(),
        domainCount: INITIAL_MALICIOUS_DOMAINS.length
      });
      
      console.log('✓ Initial Bloom filter created');
    }
  } catch (error) {
    console.error('Error initializing Bloom filter:', error);
    
    // Fallback: create empty filter
    maliciousDomainsFilter = new BloomFilter(100000, 5);
    for (const domain of INITIAL_MALICIOUS_DOMAINS) {
      maliciousDomainsFilter.add(domain);
    }
  }
}

// ============================================
// Homoglyph Detection
// ============================================
function containsSuspiciousCharacters(domain) {
  // Check for punycode (IDN homograph attacks)
  if (domain.includes('xn--')) {
    return true;
  }
  
  // Check for mixed scripts (common in homoglyph attacks)
  const commonHomoglyphs = /[αаеорсухіӏԁցјӏոԛѕԝхуъіӏ]/i; // Cyrillic that look like Latin
  if (commonHomoglyphs.test(domain)) {
    return true;
  }
  
  // Check for zero-width characters or other unicode tricks
  if (/[\u200B-\u200D\uFEFF]/.test(domain)) {
    return true;
  }
  
  return false;
}

// ============================================
// Combined Multi-Level Threat Detection
// ============================================
async function detectThreat(currentDomain, currentUrl) {
  // LEVEL 1: Check against Bloom filter (blacklist)
  if (maliciousDomainsFilter && maliciousDomainsFilter.contains(currentDomain)) {
    return {
      isDangerous: true,
      reason: 'blacklist',
      message: '🛡️ Domain blocked by phishing database'
    };
  }
  
  // LEVEL 2: Check for homoglyphs/suspicious characters
  if (containsSuspiciousCharacters(currentDomain)) {
    return {
      isDangerous: true,
      reason: 'homoglyph',
      message: '🔍 Suspicious characters detected (possible homograph)'
    };
  }
  
  // LEVEL 3: Check typosquatting against trusted domains
  const result = await new Promise((resolve) => {
    chrome.storage.sync.get(['trustedDomains'], (data) => {
      if (!data || !data.trustedDomains || data.trustedDomains.length === 0) {
        resolve({ isDangerous: false });
        return;
      }

      const trustedDomains = data.trustedDomains;
      const currentDomainWithProtocol = `${new URL(currentUrl).protocol}//${extractMainDomain(currentDomain)}`;

      // Skip if exact match with trusted domain
      if (trustedDomains.includes(currentDomainWithProtocol)) {
        resolve({ isDangerous: false });
        return;
      }

      // Check typosquatting patterns
      const isTyposquatting = trustedDomains.some((trustedDomain) => {
        const trustedDomainHostname = new URL(trustedDomain).hostname;
        const levenshteinDistance = calculateLevenshteinDistance(currentDomain, trustedDomainHostname);
        const hasDifferentTLD = checkDifferentTLD(currentUrl, trustedDomains);
        const isInSubdomain = checkTrustedDomainInSubdomain(currentUrl, trustedDomains);

        return (levenshteinDistance <= SIMILARITY_THRESHOLD && levenshteinDistance !== 0) || hasDifferentTLD || isInSubdomain;
      });
      
      if (isTyposquatting) {
        resolve({
          isDangerous: true,
          reason: 'typosquatting',
          message: '⚠️ Domain similar to a trusted site detected'
        });
      } else {
        resolve({ isDangerous: false });
      }
    });
  });
  
  return result;
}

// ============================================
// Tab Update Handler (Refactored)
// ============================================
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    let currentDomain;
    try {
      const url = new URL(tab.url);
      
      // Skip internal pages
      if (url.protocol === 'chrome:' || url.protocol === 'about:' || url.protocol === 'chrome-extension:') {
        return;
      }
      
      currentDomain = url.hostname;
    } catch (e) {
      return;
    }

    // Detect threats using multi-level approach
    const threat = await detectThreat(currentDomain, tab.url);
    
    if (threat.isDangerous) {
      chrome.tabs.sendMessage(tabId, { 
        type: 'danger',
        reason: threat.reason,
        message: threat.message
      });
      showDangerBadge();
      tabStates[tabId] = true;
    } else {
      hideDangerBadge();
      tabStates[tabId] = false;
    }
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  if (tabStates[activeInfo.tabId]) {
    showDangerBadge();
  } else {
    hideDangerBadge();
  }
});


chrome.tabs.onRemoved.addListener(tabId => {
  delete tabStates[tabId];
});

function showDangerBadge() {
  chrome.action.setBadgeText({ text: '!!!' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Color rojo para el badge
}

function hideDangerBadge() {
  chrome.action.setBadgeText({ text: '' });
}


function calculateLevenshteinDistance(a, b) {
  a = extractDomainWithoutTLD(a);
  b = extractDomainWithoutTLD(b);
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }

  return matrix[b.length][a.length];
}

function checkDifferentTLD(url, trustedDomains) {  
  const urlHostname = extractMainDomain(new URL(url).hostname);
  const urlMainDomain = urlHostname.split('.').slice(0, -1).join('.');
  const urlTLD = getTLD(urlHostname);
  return trustedDomains.some(trustedDomain => {    
    const trustedDomainHostname = extractMainDomain(new URL(trustedDomain).hostname);
    const trustedMainDomain = trustedDomainHostname.split('.').slice(0, -1).join('.');
    const trustedDomainTLD = getTLD(trustedDomainHostname);
    
    return urlMainDomain === trustedMainDomain && urlTLD !== trustedDomainTLD;  
  });
}
function extractMainDomain(hostname) {  
  const parts = hostname.split('.');
  if (parts.length >= 2) {    
    return parts.slice(-2).join('.');  }
  return hostname;
}

function checkTrustedDomainInSubdomain(url, trustedDomains) {
  const hostname = new URL(url).hostname;
  const domainParts = extractDomainWithoutTLD(hostname).split('.');

  const subdomainParts = domainParts.slice(0, -1);

  return trustedDomains.some(trustedDomain => {
    const trustedHostname = new URL(trustedDomain).hostname;
    const trustedDomainWithoutTLD = extractDomainWithoutTLD(trustedHostname);

    return subdomainParts.some(part => part === trustedDomainWithoutTLD);
  });
}

function extractDomainWithoutTLD(hostname) {
  const parts = hostname.split('.');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('.');
  }
  return hostname;
}

function getTLD(hostname) {
  const parts = hostname.split('.');
  return parts[parts.length - 1];
}

function extractHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}
