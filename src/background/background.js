const SIMILARITY_THRESHOLD = 2;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`Tab ${tabId} updated with URL: ${tab.url}`);

    chrome.storage.sync.get(['trustedDomains'], function(result) {
      if (!result.trustedDomains) {
        console.log('No trusted domains found in storage.');
        return;
      }

      const trustedDomains = result.trustedDomains;
      console.log("Trusted Domains:", trustedDomains);

      const currentDomain = extractHostname(tab.url);
      const currentDomainWithProtocol = new URL(tab.url).protocol + "//" + new URL(tab.url).host;
      // Verifica si el dominio completo con el protocolo está en la lista de trustedDomains
      if (trustedDomains.includes(currentDomainWithProtocol)) {
        console.log('The domain is trusted. No danger detected.');
        return;
      }else{
        const isTyposquatting = trustedDomains.some(trustedDomain => {
          const levenshteinDistance = calculateLevenshteinDistance(currentDomain, extractHostname(trustedDomain));
          console.log("Levenshtein Distance:", levenshteinDistance);
          const hasDifferentTLD = checkDifferentTLD(tab.url, trustedDomains);
          console.log("Different TLD:", hasDifferentTLD);
          const isInSubdomain = checkTrustedDomainInSubdomain(tab.url, trustedDomains);
          console.log("Subdomain:", isInSubdomain);
  
          return (levenshteinDistance <= SIMILARITY_THRESHOLD && levenshteinDistance != 0) || hasDifferentTLD || isInSubdomain;
        });
  
        if (isTyposquatting) {
          chrome.tabs.sendMessage(tabId, { type: 'danger' });
          console.log(`Danger message sent to tab ${tabId}`);
        }
      }      
    });
  }
});






function calculateLevenshteinDistance(a, b) {
  const matrix = [];
  //hay que quitarle los tld a los dominios y solo quedarnos con el dominio principal
  a = extractDomainWithoutTLD(a);
  b = extractDomainWithoutTLD(b);

  // Inicializar la matriz
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Calcular la distancia
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // Sustitución
                               Math.min(matrix[i][j - 1] + 1, // Inserción
                                        matrix[i - 1][j] + 1)); // Eliminación
      }
    }
  }
  console.log(matrix[b.length][a.length]);
  return matrix[b.length][a.length];
}


function checkDifferentTLD(url, trustedDomains) {
  const urlHostname = extractHostname(url);
  const urlTLD = getTLD(urlHostname);
  const urlDomainWithoutTLD = extractDomainWithoutTLD(urlHostname);

  return trustedDomains.some(trustedDomain => {
    const trustedDomainHostname = extractHostname(trustedDomain);
    const trustedDomainTLD = getTLD(trustedDomainHostname);
    const trustedDomainWithoutTLD = extractDomainWithoutTLD(trustedDomainHostname);

    return urlDomainWithoutTLD === trustedDomainWithoutTLD && urlTLD !== trustedDomainTLD;
  });
}

function checkTrustedDomainInSubdomain(url, trustedDomains) {
  const hostname = extractHostname(url);
  const domainParts = extractDomainWithoutTLD(hostname).split('.');

  // Ignora el último elemento en domainParts (el dominio de nivel superior)
  const subdomainParts = domainParts.slice(0, -1);

  return trustedDomains.some(trustedDomain => {
    const trustedHostname = extractHostname(trustedDomain);
    const trustedDomainWithoutTLD = extractDomainWithoutTLD(trustedHostname);

    // Comprueba si alguna de las partes del subdominio coincide con el dominio confiable
    return subdomainParts.some(part => part === trustedDomainWithoutTLD);
  });
}

function extractDomainWithoutTLD(hostname) {
  let parts = hostname.split('.');
  if (parts.length > 1) {
    // Elimina el TLD y devuelve el resto del dominio.
    return parts.slice(0, -1).join('.');
  }
  return hostname;
}



function getTLD(hostname) {
  const parts = hostname.split('.');
  return parts[parts.length - 1];
}

function extractHostname(url) {
  let hostname;

  // Encuentra & remueve el protocolo (http, ftp, etc.) y obtiene el hostname
  if (url.indexOf("//") > -1) {
      hostname = url.split('/')[2];
  } else {
      hostname = url.split('/')[0];
  }

  // Encuentra & remueve el puerto y la ruta
  hostname = hostname.split(':')[0];
  hostname = hostname.split('?')[0];
  return hostname;
}

function extractDomain(hostname) {
  let parts = hostname.split('.').reverse();

  if (parts.length >= 2) {
    // Combina las partes para formar el dominio
    return parts[1] + '.' + parts[0];
  }

  return hostname;
}
