export function isProvider() {
  return chrome.extension.getURL('/pages/frontend.html') === document.location.href;
}
