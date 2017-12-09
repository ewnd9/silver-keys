'use strict';

import { generateQuickGuid } from './libs/encode-utils';

const devConsole = console;

export const runtime = {
  conf: {
    lastKeys: '',
    // local part from settings
    useLocalMarkdownAPI: true,
    focusOnSaved: true,
    omnibarMaxResults: 10,
    omnibarPosition: 'middle',
    omnibarSuggestionTimeout: 200,
    omnibarTabsQuery: {},
    historyMUOrder: true,
    tabsThreshold: 9,
    smoothScroll: true,
    modeAfterYank: '',
    scrollStepSize: 70,
    nextLinkRegex: /(\b(next)\b)|下页|下一页|>>/i,
    prevLinkRegex: /(\b(prev|previous)\b)|上页|上一页|<</i,
    pageUrlRegex: [],
    clickablePat: /(https?|thunder|magnet):\/\/\S+/ig,
    hintAlign: 'center',
    defaultSearchEngine: 'g',
    showModeStatus: false,
    showProxyInStatusBar: false,
    richHintsForKeystroke: true,
    smartPageBoundary: false,
    clickableSelector: '',
    blacklistPattern: undefined,
    startToShowEmoji: 2,
    focusFirstCandidate: false,
    language: undefined,
    stealFocusOnLoad: true,
    enableAutoFocus: true,
    defaultVoice: 'Daniel',
    experiment: false,
    lastQuery: ''
  },
  runtime_handlers: {},
  RUNTIME
};

function RUNTIME(action, args) {
  const actionsRepeatBackground = ['closeTab', 'nextTab', 'previousTab', 'moveTab', 'reloadTab', 'setZoom', 'closeTabLeft','closeTabRight', 'focusTabByIndex'];
  (args = args || {}).action = action;

  if (actionsRepeatBackground.indexOf(action) !== -1) {
    // if the action can only be repeated in background, pass repeats to background with args,
    // and set RUNTIME.repeats 1, so that it won't be repeated in foreground's _handleMapKey
    args.repeats = RUNTIME.repeats;
    RUNTIME.repeats = 1;
  }

  try {
    chrome.runtime.sendMessage(args);
  } catch (e) {
    devConsole.log(e);
    // Front.showPopup('[runtime exception] ' + e);
  }
}

const actions = {};

if (chrome.runtime.connect) {
  const _port = chrome.runtime.connect({
    name: 'main'
  });

  _port.onDisconnect.addListener(() => {
    if (window === top) {
      devConsole.log('reload triggered by runtime disconnection.');

      // setTimeout(function() {
      //   window.location.reload();
      // }, 1000);
    }
  });

  const callbacks = {};

  _port.onMessage.addListener(function(_message) {
    if (callbacks[_message.id]) {
      const f = callbacks[_message.id];
      // returns true to make callback stay for coming response.
      if (!f(_message)) {
        delete callbacks[_message.id];
      }
    } else if (actions[_message.action]) {
      const result = {
        id: _message.id,
        action: _message.action
      };

      actions[_message.action].forEach(function(a) {
        result.data = a.call(null, _message);
        if (_message.ack) {
          _port.postMessage(result);
        }
      });
    } else {
      devConsole.log(`[unexpected runtime message] ${JSON.stringify(_message)}`);
    }
  });

  runtime.on = function(message, cb) {
    if (!(message in actions)) {
      actions[message] = [];
    }

    actions[message].push(cb);
  };

  runtime.command = function(args, cb) {
    args.id = generateQuickGuid();

    if (!window.frameId && window.innerHeight && window.innerWidth) {
      window.frameId = generateQuickGuid();
    }

    args.windowId = window.frameId;

    if (cb) {
      callbacks[args.id] = cb;
      // request background to hold _sendResponse for a while to send back result
      args.ack = true;
    }

    _port.postMessage(args);
  };

  runtime.updateHistory = function(type, cmd) {
    const prop = type + 'History';

    runtime.command({
      action: 'getSettings',
      key: prop
    }, response => {
      let list = response.settings[prop] || [];
      const toUpdate = {};

      if (cmd.constructor.name === 'Array') {
        toUpdate[prop] = cmd;

        runtime.command({
          action: 'updateSettings',
          settings: toUpdate
        });
      } else if (cmd.length) {
        list = list.filter(c => c.length && c !== cmd);
        list.unshift(cmd);

        if (list.length > 50) {
          list.pop();
        }

        toUpdate[prop] = list;

        runtime.command({
          action: 'updateSettings',
          settings: toUpdate
        });
      }
    });
  };

  chrome.runtime.onMessage.addListener(function(msg, sender, response) {
    if (msg.target === 'content_runtime') {
      if (runtime.runtime_handlers[msg.subject]) {
        runtime.runtime_handlers[msg.subject](msg, sender, response);
      }
    }
  });

  const getTopURLPromise = new Promise(resolve => {
    if (window === top) {
      resolve(window.location.href);
    } else {
      runtime.command({
        action: 'getTopURL'
      }, rs => {
        resolve(rs.url);
      });
    }
  });

  runtime.getTopURL = cb => getTopURLPromise.then(cb);
  runtime.postTopMessage = msg => getTopURLPromise.then(topUrl => {
    if (new URL(topUrl).origin === 'file://') {
      topUrl = '*';
    }

    top.postMessage(msg, topUrl);
  });
}
