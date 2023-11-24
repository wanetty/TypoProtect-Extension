const SIMILARITY_THRESHOLD = 2;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // El evento onUpdated puede dispararse por varios motivos; nos aseguramos de que haya una URL.
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`Tab ${tabId} updated with URL: ${tab.url}`);

    chrome.storage.sync.get(['trustedDomains'], function(result) {
      if (!result.trustedDomains) {
        console.log('No trusted domains found in storage.');
        return; // Salir temprano si no hay dominios de confianza almacenados.
      }

      const trustedDomains = result.trustedDomains;
      console.log("Trusted Domains:", trustedDomains);

      // Verifica si alguna de las URLs de los dominios de confianza se asemeja a la URL actual.
      const isTyposquatting = trustedDomains.some((trustedDomain) => {
        const currentDomain = extractHostname(tab.url);
        const levenshteinDistance = calculateLevenshteinDistance(currentDomain, extractHostname(trustedDomain));
        const hasDifferentTLD = checkDifferentTLD(tab.url, trustedDomains);
        console.log("Has different TLD:", hasDifferentTLD);
        const isInSubdomain = checkTrustedDomainInSubdomain(tab.url, trustedDomains);
        console.log("Is in subdomain:", isInSubdomain);

        return levenshteinDistance <= SIMILARITY_THRESHOLD || hasDifferentTLD || isInSubdomain;
      });
      if (isTyposquatting) {
        chrome.tabs.sendMessage(tabId, { type: 'danger' });
        console.log(`Danger message sent to tab ${tabId}`);
      }
    });
  }
});




function calculateLevenshteinDistance(a, b) {
  const matrix = [];

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
  const urlTLD = getTLD(extractHostname(url));

  return trustedDomains.some(trustedDomain => {
    const trustedDomainTLD = getTLD(extractHostname(trustedDomain));
    return urlTLD !== trustedDomainTLD;
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
