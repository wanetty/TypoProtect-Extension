const SIMILARITY_THRESHOLD = 2;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.sync.get(['trustedDomains'], (result) => {
      if (!result || !result.trustedDomains) {
        return;
      }

      const trustedDomains = result.trustedDomains;

      let currentDomain;
      try {
        currentDomain = new URL(tab.url).hostname;
      } catch (e) {
        return;
      }

      const currentDomainWithProtocol = `${new URL(tab.url).protocol}//${extractMainDomain(currentDomain)}`;

      if (trustedDomains.includes(currentDomainWithProtocol)) {
        return;
      }

      const isTyposquatting = trustedDomains.some((trustedDomain) => {
        const trustedDomainHostname = new URL(trustedDomain).hostname;
        const levenshteinDistance = calculateLevenshteinDistance(currentDomain, trustedDomainHostname);
        const hasDifferentTLD = checkDifferentTLD(tab.url, trustedDomains);
        const isInSubdomain = checkTrustedDomainInSubdomain(tab.url, trustedDomains);

        return (levenshteinDistance <= SIMILARITY_THRESHOLD && levenshteinDistance !== 0) || hasDifferentTLD || isInSubdomain;
      });

      if (isTyposquatting) {
        chrome.tabs.sendMessage(tabId, { type: 'danger' });
      }
    });
  }
});

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
