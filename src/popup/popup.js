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
