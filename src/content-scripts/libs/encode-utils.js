export function encodeKeystroke(s) {
  let ekp = /<(?:Ctrl-)?(?:Alt-)?(?:Meta-)?(?:Shift-)?([^>]+|.)>/g;
  let mtches, ret = "", lastIndex = 0;
  while ((mtches = ekp.exec(s)) !== null) {
    ret += s.substr(lastIndex, mtches.index - lastIndex);
    ret += _encodeKeystroke(mtches[0], mtches[1]);
    lastIndex = ekp.lastIndex;
  }

  ret += s.substr(lastIndex);
  return ret;
}

// <Esc>: ✐: <Esc>
// <Alt-Space>: ⤑: <Alt-Space>
// <Ctrl-Alt-F7>: ⨘: <Ctrl-Alt-F7>
// <Ctrl-'>: ⠷: <Ctrl-'>
// <Alt-i>: ⥹: <Alt-i>
// <Ctrl-Alt-z>: ⪊: <Ctrl-Alt-z>
// <Ctrl-Alt-Meta-h>: ⹸: <Ctrl-Alt-Meta-h>
function _encodeKeystroke(s, k) {
    let mod = 0;
    if (s.indexOf("Ctrl-") !== -1) {
        mod |= 1;
    }
    if (s.indexOf("Alt-") !== -1) {
        mod |= 2;
    }
    if (s.indexOf("Meta-") !== -1) {
        mod |= 4;
    }
    if (s.indexOf("Shift-") !== -1) {
        mod |= 8;
    }
    let code;
    if (k.length > 1) {
        code = 256 + encodeKeystroke.specialKeys.indexOf(k);
    } else {
        code = k.charCodeAt(0);
    }

    // <flag: always 1><flag: 1 bit, 0 for visible keys, 1 for invisible keys><key: 8 bits><mod: 4 bits>
    code = 8192 + (code << 4) + mod;
    return String.fromCharCode(code);
}

encodeKeystroke.specialKeys = ['Esc', 'Space', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Enter', 'Tab', 'Delete', 'End', 'Home', 'Insert', 'NumLock', 'PageDown', 'PageUp', 'Pause', 'ScrollLock', 'CapsLock', 'PrintScreen', 'Escape', 'Hyper'];

export function decodeKeystroke(s) {
    let ret = "";
    for (let i = 0; i < s.length; i++) {
        let r = s[i].charCodeAt(0);
        if (r > 8192) {
            r = r - 8192;
            let flag = r >> 12,
                key = (r % 4096) >> 4,
                mod = r & 15;
            if (flag) {
                r = encodeKeystroke.specialKeys[key % 256];
            } else {
                r = String.fromCharCode(key);
            }
            if (mod & 8) {
                r = "Shift-" + r;
            }
            if (mod & 4) {
                r = "Meta-" + r;
            }
            if (mod & 2) {
                r = "Alt-" + r;
            }
            if (mod & 1) {
                r = "Ctrl-" + r;
            }
            ret += "<" + r + ">";
        } else {
            ret += s[i];
        }
    }
    return ret;
}

export function generateQuickGuid() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
