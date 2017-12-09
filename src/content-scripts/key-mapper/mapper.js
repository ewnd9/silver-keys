'use strict';

import { Mode } from '../modes/mode';
import { Normal } from '../modes/normal';

import { encodeKeystroke } from '../libs/encode-utils';
import { isProvider } from '../libs/ext-utils';

import { Commands } from './commands';

export function mapkey(keys, annotation, jscode, options) {
  _mapkey(Normal, keys, annotation, jscode, options);
}

export function map(new_keystroke, old_keystroke, domain, new_annotation) {
  if (!domain || domain.test(document.location.href)) {
    if (old_keystroke[0] === ':') {
      const cmdline = old_keystroke.substr(1);
      const args = parseCommand(cmdline);
      const cmd = args.shift();

      if (Commands.items.hasOwnProperty(cmd)) {
        const meta = Commands.items[cmd];
        const ag = !isProvider() ? null : {annotation: new_annotation || meta.annotation, feature_group: meta.feature_group};

        const keybound = createKeyTarget(() => {
          meta.code.call(meta.code, args);
        }, ag, meta.repeatIgnore);

        Normal.mappings.add(encodeKeystroke(new_keystroke), keybound);
      }
    } else {
      if (!_map(Normal, new_keystroke, old_keystroke) && old_keystroke in Mode.specialKeys) {
        Mode.specialKeys[old_keystroke].push(new_keystroke);
      }
    }
  }
}

function parseCommand(cmdline) {
  cmdline = cmdline.trim();
  const tokens = [];
  let pendingToken = false;
  let part = '';

  for (let i = 0; i < cmdline.length; i++) {
    if (cmdline.charAt(i) === ' ' && !pendingToken) {
      tokens.push(part);
      part = '';
    } else {
      if (cmdline.charAt(i) === '\"') {
        pendingToken = !pendingToken;
      } else {
        part += cmdline.charAt(i);
      }
    }
  }

  tokens.push(part);
  return tokens;
}

let _defaultMapping = true;
function _mapkey(mode, keys, annotation, jscode, options) {
  options = options || {};

  if (!options.domain || options.domain.test(document.location.href)) {
    keys = encodeKeystroke(keys);
    mode.mappings.remove(keys);

    if (typeof jscode === 'string') {
      jscode = new Function(jscode);
    }

    let keybound;

    if (_defaultMapping) {
      // to save memory, we keep annotations only in frontend.html, where they are used to create usage message.
      if (isProvider()) {
        keybound = createKeyTarget(jscode, {annotation: annotation, feature_group: ((false /*mode === Visual*/) ? 9 :14)}, options.repeatIgnore);
      } else {
        keybound = createKeyTarget(jscode, null, options.repeatIgnore);
      }

      mode.mappings.add(keys, keybound);
    } else {
      // for user defined mappings, annotations are kept in content.
      keybound = createKeyTarget(jscode, {annotation: annotation, feature_group: ((false /*mode === Visual*/) ? 9 :14)}, options.repeatIgnore);
      mode.mappings.add(keys, keybound);
    }
  }
}

function _map(mode, nks, oks) {
  oks = encodeKeystroke(oks);
  let old_map = mode.mappings.find(oks);

  if (old_map) {
    nks = encodeKeystroke(nks);
    mode.mappings.remove(nks);
    // meta.word need to be new
    const meta = Object.assign({}, old_map.meta);
    mode.mappings.add(nks, meta);
  }

  return old_map;
}

function createKeyTarget(code, ag, repeatIgnore) {
  const keybound = { code };

  if (repeatIgnore) {
    keybound.repeatIgnore = repeatIgnore;
  }

  if (ag) {
    ag = _parseAnnotation(ag);
    keybound.feature_group = ag.feature_group;
    keybound.annotation = ag.annotation;
  }

  keybound.isDefault = false;
  // keybound.isDefault = _defaultMapping;
  return keybound;
}

function _parseAnnotation(ag) {
  const annotations = ag.annotation.match(/#(\d+)(.*)/);

  if (annotations !== null) {
    ag.feature_group = parseInt(annotations[1]);
    ag.annotation = annotations[2];
  }

  return ag;
}
