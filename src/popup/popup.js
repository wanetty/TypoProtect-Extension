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

  domain = url.hostname;
  if (!/^https?:\/\//i.test(domain)) {
    domain = 'https://' + domain;
  }

  chrome.storage.sync.get('trustedDomains', function(result) {
    let domains = result.trustedDomains || [];
    if (!domains.includes(domain)) {
      domains.push(domain);
      chrome.storage.sync.set({'trustedDomains': domains}, function() {
        loadDomains();
      });
    }
  });
});

//Get actual URL when open the extension and put it in the input
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  const currentTabId = tabs[0].id;
  chrome.tabs.get(currentTabId, function(tab) {
    const url = new URL(tab.url);
    document.getElementById('domainInput').value = url.hostname;
  });
});


document.getElementById('deleteButton').addEventListener('click', () => {
  chrome.storage.sync.set({'trustedDomains': []}, function() {
    loadDomains();
  });
});

function loadDomains() {
  let domainList = document.getElementById('domainList');
  domainList.innerHTML = '';

  chrome.storage.sync.get('trustedDomains', function(data) {
    if (data.trustedDomains) {
      data.trustedDomains.forEach(function(domain, index) {
        let li = document.createElement('li');
        li.textContent = domain;

        let deleteButton = document.createElement('button');
        deleteButton.textContent = 'X'; 
        deleteButton.onclick = function() {
          deleteDomain(index);
        };

        li.appendChild(deleteButton);
        domainList.appendChild(li);
      });
    }
  });
}


function deleteDomain(index) {
  chrome.storage.sync.get('trustedDomains', function(data) {
    var domains = data.trustedDomains;
    domains.splice(index, 1);

    chrome.storage.sync.set({'trustedDomains': domains}, function() {
      loadDomains();
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTabId = tabs[0].id;
    chrome.storage.local.get([currentTabId.toString()], function(result) {
      if (result[currentTabId] === 'danger') {
        document.body.style.backgroundColor = 'red';
      } else {
        document.body.style.backgroundColor = 'white';
      }
    });
  });
  loadDomains();
});



document.getElementById('settingsButton').addEventListener('click', function() {
  if (document.getElementById('settingsMenu').style.width === '250px') {
    document.getElementById('settingsMenu').style.width = '0px';
  } else{
    document.getElementById('settingsMenu').style.width = '250px';
  }
});

document.getElementById('loadButton').addEventListener('click', () => {
  const predefinedUrls = [
    'https://www.google.com',
    'https://www.amazon.com',
    'https://www.youtube.com',
    'https://www.facebook.com',
    'https://www.instagram.com',
    'https://www.reddit.com',
    'https://www.tiktok.com',
    'https://www.wikipedia.org'
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
    });
  });
});

document.getElementById('importButton').addEventListener('click', function() {
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
        });
      });
    });

    // Leer el archivo como texto
    reader.readAsText(file);
  });

  // Simular un click en el input para abrir el diálogo de selección de archivo
  input.click();
});

document.getElementById('exportButton').addEventListener('click', function() {
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
    }, 0);
  });
});

document.getElementById('closeButton').addEventListener('click', function() {
  document.getElementById('settingsMenu').style.width = '0px';
} );  