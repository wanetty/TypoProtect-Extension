chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'danger') {
    const banner = document.createElement('div');
    banner.innerText = 'DANGER: POSSIBLE PHISHING';
    banner.style.position = 'fixed';
    banner.style.width = '100%';
    banner.style.backgroundColor = 'red';
    banner.style.color = 'white';
    banner.style.textAlign = 'center';
    banner.style.fontSize = '24px';
    banner.style.zIndex = '1000';
    banner.style.top = '0'; // Asegúrate de que el banner esté en la parte superior de la ventana

    // Añadir el banner cuando el DOM esté completamente cargado
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        document.body.prepend(banner);
      });
    } else {
      document.body.prepend(banner);
    }
  }
});
