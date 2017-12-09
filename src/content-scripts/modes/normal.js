'use strict';

import { Trie } from '../libs/tree';
import { Mode } from './mode';

import { runtime } from '../runtime';
import { getRealEdit, isEditable } from '../libs/dom-utils';
import { isProvider } from '../libs/ext-utils';

const devConsole = console;

export const Normal = Object.assign({}, Mode, {
  name: 'Normal',
  // Enable to stop propagation of the event whose keydown handler has been triggered
  // Why we need this?
  // For example, there is keyup event handler of `s` on some site to set focus on an input box,
  // Now user presses `sg` to search with google, Surfingkeys got `s` and triggered its keydown handler.
  // But keyup handler of the site also got triggered, then `g` was swallowed by the input box.
  // This setting now is only turned on for Normal.
  // For Hints, we could not turn on it, as keyup should be propagated to Normal
  // to stop scrolling when holding a key.
  enableKeyupMerging: true,

  _passFocus: false,
  passFocus(pf) {
    this._passFocus = pf;
  },

  // let next focus event pass
  enter() {
    Mode.enter.apply(Normal, arguments);

    if (runtime.conf.stealFocusOnLoad && !isProvider()) {
      let elm = getRealEdit();
      elm && elm.blur();
    }
  }
});

Normal.addEventListener('keydown', function(event) {
  devConsole.log('Normal#addEventListener(keydown)', event);
  const realTarget = getRealEdit(event);

  if (isEditable(realTarget)) {
    if (Mode.isSpecialKeyOf('<Esc>', event.sk_keyName)) {
      realTarget.blur();
      // Insert.exit();
    } else if (event.key === 'Tab') {
      // enable Tab key to focus next input
      Normal.passFocus(true);
      // Insert.enter(realTarget);
    }
  } else if (Mode.isSpecialKeyOf('<Alt-s>', event.sk_keyName)) {
    Normal.toggleBlacklist();
    event.sk_stopPropagation = true;
  } else if (event.sk_keyName.length) {
    Normal._handleMapKey(event);
  }

  Normal.passFocus(runtime.conf.enableAutoFocus);
});

// let keyHeld = false;
// Normal.addEventListener('blur', () => {
//   keyHeld = false;
// });

Normal.addEventListener('focus', function(event) {
  Mode.showStatus();

  if (runtime.conf.stealFocusOnLoad && !isProvider()) {
    const elm = getRealEdit(event);

    if (isEditable(elm)) {
      if (this._passFocus) {
        if (!runtime.conf.enableAutoFocus) {
          // prevent focus on input only when enableAutoFocus is turned off.
          this._passFocus = false;
        }
      } else {
        elm.blur();
        event.sk_stopPropagation = true;
      }
    }
  }
});

// Normal.addEventListener('keyup', () => {
//   setTimeout(function() {
//     keyHeld = false;
//   }, 0);
// });

Normal.addEventListener('mousedown', function(event) {
  // The isTrusted read-only property of the Event interface is a boolean
  // that is true when the event was generated by a user action, and false
  // when the event was created or modified by a script or dispatched via dispatchEvent.

  // enable only mouse click from human being to focus input
  if (runtime.conf.enableAutoFocus) {
    Normal.passFocus(true);
  } else {
    Normal.passFocus(event.isTrusted);
  }

  const realTarget = getRealEdit(event);

  if (isEditable(realTarget)) {
    // Insert.enter(realTarget);
  } else {
    // Insert.exit();
  }
});

Normal.mappings = new Trie();
Normal.map_node = Normal.mappings;

Normal.repeats = '';

Normal._handleMapKey = function(event, onNoMatched) {
  const thisMode = this;
  const key = event.sk_keyName;

  if (Mode.isSpecialKeyOf('<Esc>', key) && _finish(this)) {
    event.sk_stopPropagation = true;
    event.sk_suppressed = true;
  } else if (this.pendingMap) {
    this.setLastKeys && this.setLastKeys(this.map_node.meta.word + key);

    const pf = this.pendingMap.bind(this);
    event.sk_stopPropagation = !this.map_node.meta.keepPropagation;

    setTimeout(function() {
      pf(key);
      _finish(thisMode);
      thisMode.postHandler(event);
    }, 0);
  } else if (
    this.repeats !== undefined &&
    this.map_node === this.mappings &&
    (key >= '1' || (this.repeats !== '' && key >= '0')) &&
    key <= '9'
  ) {
    // reset only after target action executed or cancelled
    this.repeats += key;

    // Front.showKeystroke(key, this.name);
    event.sk_stopPropagation = true;
  } else {
    const last = this.map_node;
    this.map_node = this.map_node.find(key);

    if (!this.map_node) {
      onNoMatched && onNoMatched(last);
      event.sk_suppressed = last !== this.mappings;
      _finish(this);
    } else if (this.map_node.meta) {
      let code = this.map_node.meta.code;
      if (code.length) {
        // bound function needs arguments
        this.pendingMap = code;
        // Front.showKeystroke(key, this.name);
        event.sk_stopPropagation = true;
      } else {
        this.setLastKeys && this.setLastKeys(this.map_node.meta.word);
        runtime.RUNTIME.repeats = parseInt(this.repeats) || 1;

        event.sk_stopPropagation = !this.map_node.meta.keepPropagation;
        setTimeout(function() {
          while (runtime.RUNTIME.repeats > 0) {
            code();
            runtime.RUNTIME.repeats--;
          }
          _finish(thisMode);
          thisMode.postHandler(event);
        }, 0);
      }
    } else {
      // Front.showKeystroke(key, this.name);
      event.sk_stopPropagation = true;
    }
  }
};

function _finish(mode) {
  let ret = false;
  if (mode.map_node !== mode.mappings || mode.pendingMap != null || mode.repeats) {
    mode.map_node = mode.mappings;
    mode.pendingMap = null;

    // Front.hideKeystroke();

    if (mode.repeats) {
      mode.repeats = '';
    }

    ret = true;
  }

  return ret;
}
