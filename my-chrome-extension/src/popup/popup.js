document.getElementById('addButton').addEventListener('click', () => {
  var domain = document.getElementById('domainInput').value;
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

document.getElementById('deleteButton').addEventListener('click', () => {
  chrome.storage.sync.set({'trustedDomains': []}, function() {
    loadDomains();
  });
});

function loadDomains() {
  var domainList = document.getElementById('domainList');
  domainList.innerHTML = ''; // Limpia la lista antes de volver a cargarla

  chrome.storage.sync.get('trustedDomains', function(data) {
    if (data.trustedDomains) {
      data.trustedDomains.forEach(function(domain, index) {
        var li = document.createElement('li');
        li.textContent = domain;

        var deleteButton = document.createElement('button');
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
    domains.splice(index, 1); // Eliminar el dominio seleccionado

    chrome.storage.sync.set({'trustedDomains': domains}, function() {
      loadDomains(); // Recargar la lista
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
        document.body.style.backgroundColor = 'white'; // O cualquier otro color predeterminado
      }
    });
  });
  loadDomains();
});
