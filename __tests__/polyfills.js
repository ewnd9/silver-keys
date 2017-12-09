global.chrome = require('sinon-chrome');
global.chrome.runtime.connect.returns({
  onDisconnect: { addListener: () => {} },
  onMessage: { addListener: () => {} },
  postMessage: () => {}
});
global.document.getSelection = () => {}

