'use strict';

import { runtime } from '../runtime';
import { KeyboardUtils } from '../libs/keyboard-utils';
import { decodeKeystroke } from '../libs/encode-utils';

const devConsole = console;

export const Mode = {
  mode_stack: [],
  eventListeners: {},
  specialKeys: {
    '<Alt-s>': ['<Alt-s>'], // hotkey to toggleBlacklist
    '<Esc>': ['<Esc>']
  },
  addEventListener(evt, handler) {
    devConsole.log('addEventListener', evt, handler);

    this.eventListeners[evt] = event => {
      if (event.type === 'keydown' && !event.hasOwnProperty('sk_keyName')) {
        event.sk_keyName = KeyboardUtils.getKeyChar(event);
      }

      if (event.type === 'keyup' && this.stopKeyupPropagation === event.keyCode) {
        event.stopImmediatePropagation();
        this.stopKeyupPropagation = 0;
      }

      if (!event.sk_suppressed) {
        handler(event);
        this.postHandler(event);
      }
    };

    return this;
  },
  isSpecialKeyOf(specialKey, keyToCheck) {
    return -1 !== Mode.specialKeys[specialKey].indexOf(decodeKeystroke(keyToCheck));
  },
  postHandler(event) {
    if (event.sk_stopPropagation) {
      event.stopImmediatePropagation();
      event.preventDefault();
      // keyup event also needs to be suppressed for the key whose keydown has been suppressed.
      this.stopKeyupPropagation =
        event.type === 'keydown' && this.enableKeyupMerging ? event.keyCode : 0;
    }
  },
  enter(priority, reentrant) {
    // we need clear the modes stack first to make sure eventListeners of this mode added at first.
    popModes();
    devConsole.log(priority, reentrant, this);

    let pos = this.mode_stack.indexOf(this);
    if (!this.priority) {
      this.priority = priority || this.mode_stack.length;
    }

    if (pos === -1) {
      // push this mode into stack
      this.mode_stack.unshift(this);
    } else if (pos > 0) {
      if (reentrant) {
        // pop up all the modes over this
        this.mode_stack = this.mode_stack.slice(pos);
      } else {
        let modeList = Mode.stack()
          .map(function(u) {
            return u.name;
          })
          .join(',');
        devConsole.log(
          'Mode {0} pushed into mode stack again.'.format(this.name),
          'Modes in stack: {0}'.format(modeList)
        );
      }
      // stackTrace();
    }

    this.mode_stack.sort(function(a, b) {
      return a.priority < b.priority ? 1 : b.priority < a.priority ? -1 : 0;
    });

    pushModes(this.mode_stack);

    // var modes = mode_stack.map(function(m) {
    // return m.name;
    // }).join('->');
    // console.log('enter {0}, {1}'.format(this.name, modes));

    Mode.showStatus();
  },
  showStatus() {
    if (document.hasFocus() && this.mode_stack.length) {
      let cm = this.mode_stack[0];
      let sl = cm.statusLine;
      if (sl === undefined) {
        sl = runtime.conf.showModeStatus ? cm.name : '';
      }
      if (sl !== '' && window !== top) {
        if (chrome.extension.getURL('').indexOf(window.location.origin) === 0) {
          if (!cm.frontendOnly) {
            sl += '✩';
          }
        } else {
          let pathname = window.location.pathname.split('/');
          if (pathname.length) {
            sl += ' - frame: ' + pathname[pathname.length - 1];
          }
        }
      }
      // Front.showStatus(0, sl);
    }
  },
  exit(peek) {
    let pos = this.mode_stack.indexOf(this);
    if (pos !== -1) {
      if (peek) {
        // for peek exit, we need push modes above this back to the stack.
        popModes(this.mode_stack);
        this.mode_stack.splice(pos, 1);
        pushModes(this.mode_stack);
      } else {
        // otherwise, we just pop all modes above this inclusively.
        pos++;
        let popup = this.mode_stack.slice(0, pos);
        popModes(popup);
        this.mode_stack = this.mode_stack.slice(pos);
      }

      // var modes = mode_stack.map(function(m) {
      // return m.name;
      // }).join('->');
      // console.log('exit {0}, {1}'.format(this.name, modes));
    }

    Mode.showStatus();
  },
  stack() {
    return this.mode_stack;
  }
};

function popModes(modes) {
  if (!modes) {
    return;
  }

  modes.forEach(function(m) {
    for (let evt in m.eventListeners) {
      window.removeEventListener(evt, m.eventListeners[evt], true);
    }
  });
}

function pushModes(modes) {
  devConsole.log(modes);

  modes.forEach(function(m) {
    for (const evt in m.eventListeners) {
      window.addEventListener(evt, m.eventListeners[evt], true);
    }
  });
}
