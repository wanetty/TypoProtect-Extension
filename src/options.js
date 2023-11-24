document.addEventListener('DOMContentLoaded', function() {
  var saveButton = document.getElementById('save');
  var domainInput = document.getElementById('domains');

  // Carga los dominios guardados previamente
  chrome.storage.sync.get('domains', function(data) {
    if(data.domains) {
      domainInput.value = data.domains.join(', ');
    }
  });

  // Guarda los dominios cuando se hace clic en el botón de guardar
  saveButton.addEventListener('click', function() {
    var domains = domainInput.value.split(',').map(function(domain) {
      return domain.trim();
    });
    chrome.storage.sync.set({ 'domains': domains });
  });
});