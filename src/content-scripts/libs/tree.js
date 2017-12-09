/*
*  A simple implementation of Trie by brook hong, for less memory usage and better performance.
*
*  Each node has at most two properties, stem or meta. All other properties are expected to be
*  one character, taken to be child of the node.
*
*/
export var Trie = (function() {

    function Trie() {
        if (arguments.length > 0) {
            this.stem = arguments[0];
        }
        if (arguments.length > 1) {
            this.meta = arguments[1];
        }
    }

    Trie.prototype = {
        find: function(word) {
            let found = this, len = word.length;
            for (let i = 0; i < len && found; i++) {
                found = found[word[i]];
            }
            return found;
        },

        add: function(word, meta) {
            let node = this, len = word.length;
            for (let i = 0; i < len; i++) {
                let c = word[i];
                if (!node.hasOwnProperty(c)) {
                    let t = new Trie(c);
                    node[c] = t;
                    node = t;
                } else {
                    node = node[c];
                }
            }

            meta.word = word;
            node.meta = meta;
        },

        remove: function(word) {
            let found = this, len = word.length, ancestor = [];
            for (var i = 0; i < len && found; i++) {
                // keep node in path for later to remove empty nodes
                ancestor.push(found);
                found = found[word[i]];
            }
            if (found) {
                var i = ancestor.length - 1,
                    node = ancestor[i];
                delete node[found.stem];
                found = node;
                while (found !== this && Object.keys(found).length === 1) {
                    // remove the node if it has only one property -- which should be stem
                    node = ancestor[--i];
                    delete node[found.stem];
                    found = node;
                }
            }
            return found;
        },

        getWords: function(prefix, withoutStem) {
            var ret = [], prefix = (prefix || "") + (withoutStem ? "" : (this.stem || ""));
            if (this.hasOwnProperty('meta')) {
                ret.push(prefix);
            }
            for (let k in this) {
                if (k.length === 1) {
                    ret = ret.concat(this[k].getWords(prefix));
                }
            }
            return ret;
        },

        getMetas: function(criterion) {
            let ret = [];
            if (this.hasOwnProperty('meta') && criterion(this.meta)) {
                ret.push(this.meta);
            }
            for (let k in this) {
                if (k.length === 1) {
                    ret = ret.concat(this[k].getMetas(criterion));
                }
            }
            return ret;
        },

        getPrefixWord: function() {
            // unmapAllExcept could make this Trie object empty.
            if (Object.keys(this).length === 0) {
                return "";
            }
            let fullWord = "", futureWord = this.stem, node = this;
            while (fullWord === "") {
                let keys = Object.keys(node);
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i] === 'meta') {
                        fullWord = node.meta.word;
                        break;
                    } else if (keys[i] !== 'stem') {
                        futureWord = futureWord + keys[i];
                        node = node[keys[i]];
                        break;
                    }
                }
            }
            return fullWord.substr(0, fullWord.length - futureWord.length + 1);
        }
    };

    return Trie;
})();
