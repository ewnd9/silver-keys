'use strict';

import { encodeKeystroke, decodeKeystroke } from './encode-utils';

export const KeyboardUtils = {
  keyCodesMac: {
    Minus: ["-", "_"],
    Equal: ["=", "+"],
    BracketLeft: ["[", "{"],
    BracketRight: ["]", "}"],
    Backslash: ["\\", "|"],
    Semicolon: [";", ":"],
    Quote: ["'", "\""],
    Comma: [",", "<"],
    Period: [".", ">"],
    Slash: ["/", "?"]
  },
  keyCodes: {
    ESC: 27,
    backspace: 8,
    deleteKey: 46,
    enter: 13,
    ctrlEnter: 10,
    space: 32,
    shiftKey: 16,
    ctrlKey: 17,
    f1: 112,
    f12: 123,
    comma: 188,
    tab: 9,
    downArrow: 40,
    upArrow: 38
  },
  modifierKeys: {
    16: "Shift",
    17: "Ctrl",
    18: "Alt",
    91: "Meta",
    92: "Meta",
    93: "ContextMenu",
    229: "Process"
  },
  keyNames: {
    8:   'Backspace',
    9:   'Tab',
    12:  'NumLock',
    27:  'Esc',
    32:  'Space',
    46:  'Delete',
  },
  keyIdentifierCorrectionMap: {
    "U+00C0": ["U+0060", "U+007E"],
    "U+0030": ["U+0030", "U+0029"],
    "U+0031": ["U+0031", "U+0021"],
    "U+0032": ["U+0032", "U+0040"],
    "U+0033": ["U+0033", "U+0023"],
    "U+0034": ["U+0034", "U+0024"],
    "U+0035": ["U+0035", "U+0025"],
    "U+0036": ["U+0036", "U+005E"],
    "U+0037": ["U+0037", "U+0026"],
    "U+0038": ["U+0038", "U+002A"],
    "U+0039": ["U+0039", "U+0028"],
    "U+00BD": ["U+002D", "U+005F"],
    "U+00BB": ["U+003D", "U+002B"],
    "U+00DB": ["U+005B", "U+007B"],
    "U+00DD": ["U+005D", "U+007D"],
    "U+00DC": ["U+005C", "U+007C"],
    "U+00BA": ["U+003B", "U+003A"],
    "U+00DE": ["U+0027", "U+0022"],
    "U+00BC": ["U+002C", "U+003C"],
    "U+00BE": ["U+002E", "U+003E"],
    "U+00BF": ["U+002F", "U+003F"]
  },
  init: function() {
    if (navigator.platform.indexOf("Mac") !== -1) {
      return this.platform = "Mac";
    } else if (navigator.userAgent.indexOf("Linux") !== -1) {
      return this.platform = "Linux";
    } else {
      return this.platform = "Windows";
    }
  },
  getKeyChar: function(event) {
    let character;

    if (event.keyCode in this.modifierKeys) {
        character = "";
    } else {
        if (this.keyNames.hasOwnProperty(event.keyCode)) {
            character = "{0}".format(this.keyNames[event.keyCode]);
        } else {
            character = event.key;
            if (!character) {
                if (event.keyIdentifier) {
                    // keep for chrome version below 52
                    if (event.keyIdentifier.slice(0, 2) !== "U+") {
                        character = "{0}".format(event.keyIdentifier);
                    } else {
                        let keyIdentifier = event.keyIdentifier;
                        if ((this.platform === "Windows" || this.platform === "Linux") && this.keyIdentifierCorrectionMap[keyIdentifier]) {
                            let correctedIdentifiers = this.keyIdentifierCorrectionMap[keyIdentifier];
                            keyIdentifier = event.shiftKey ? correctedIdentifiers[1] : correctedIdentifiers[0];
                        }
                        let unicodeKeyInHex = "0x" + keyIdentifier.substring(2);
                        character = String.fromCharCode(parseInt(unicodeKeyInHex));
                        character = event.shiftKey ? character : character.toLowerCase();
                    }
                }
            } else {
                if (character.charCodeAt(0) > 127   // Alt-s is ß under Mac
                    || character === "Dead"         // Alt-i is Dead under Mac
                ) {
                    if (event.keyCode < 127) {
                        character = String.fromCharCode(event.keyCode);
                        character = event.shiftKey ? character : character.toLowerCase();
                    } else if (this.keyCodesMac.hasOwnProperty(event.code)) {
                        // Alt-/ or Alt-?
                        character = this.keyCodesMac[event.code][event.shiftKey ? 1 : 0];
                    }
                } else if (character === "Unidentified") {
                    // for IME on
                    character = "";
                }
            }
        }
        if (event.shiftKey && character.length > 1) {
            character = "Shift-" + character;
        }
        if (event.metaKey) {
            character = "Meta-" + character;
        }
        if (event.altKey) {
            character = "Alt-" + character;
        }
        if (event.ctrlKey) {
            character = "Ctrl-" + character;
        }
        if (character.length > 1) {
            character = "<{0}>".format(character);
        }
    }
    if (decodeKeystroke(encodeKeystroke(character)) === character) {
        character = encodeKeystroke(character);
    }
    return character;
  },
  isWordChar: function(event) {
    return (event.keyCode < 123 && event.keyCode >= 97 || event.keyCode < 91 && event.keyCode >= 65 || event.keyCode < 58 && event.keyCode >= 48);
  }
};

KeyboardUtils.init();

export const keyCodes = KeyboardUtils.keyCodes;
