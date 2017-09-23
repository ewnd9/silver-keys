# silver-keys

Forked from https://github.com/brookhong/Surfingkeys with a goal to modularize all commands.

Think Alfred but inside Google Chrome as an extension.

Inspired by https://github.com/sindresorhus/refined-github/tree/master/src/libs

## Install

```sh
$ yarn install
$ yarn build
```

Open `chrome://extensions`, click `Load unpacked extension...`, and select the `dist` directory

## Notes

```sh
# entry point for web content (dev)
$ cat manifest.json | strip-json-comments | jq '.content_scripts[0].js'
# entry point for web content (prod), modified by "use_common_content_min_manifest" task in gulpfile.js
$ cat dist/manifest.json | strip-json-comments | jq '.content_scripts[0].js'
# entry point for background (same for prod)
$ cat manifest.json | strip-json-comments | jq '.background'
```

## Todo

- [ ] Bundle code with webpack
