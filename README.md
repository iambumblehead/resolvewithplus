resolvewithplus
===============
[![npm version](https://badge.fury.io/js/resolvewithplus.svg)](https://badge.fury.io/js/resolvewithplus) [![Build Status](https://github.com/iambumblehead/resolvewithplus/workflows/nodejs-ci/badge.svg)][2][[![install size](https://packagephobia.now.sh/badge?p=resolvewithplus)](https://packagephobia.now.sh/result?p=resolvewithplus)

_resolvewithplus_ iterates on the _resolvewith_ package for resolving CJS modules following [the original node.js spec.][2] _resolvewithplus_ is changed to an ESM module and adds support for ESM `import 'name'` resolutions.

When a package exports both ESM and CJS, `resolvewithplus` returns the ESM path (tries to). Resolving ESM paths is complex and ESM support will be lacking for edge-cases.

```javascript
// ESM paths are returned by default rather than CJS paths
resolvewithplus('koa', '/Users/bumble/resolvewith/test/');
// '/Users/bumble/resolvewith/node_modules/koa/dist/koa.mjs'

// A CJS path is returned when the ESM path is not found
resolvewithplus('./testfiles/testscript.js', '/Users/bumble/resolvewith/test/')
// '/Users/bumble/resolvewith/test/testfiles/testscript.js'

// use the older 'resolvewith' package to resolve CJS paths
resolvewith('koa', '/Users/bumble/resolvewith/test/');
// '/Users/bumble/resolvewith/node_modules/koa/lib/application.js'
```

_resolvewithplus_ caches and reuse results it generates. The first call follows rules to locate the file. Subsequent calls using the values return reults from a key store.


[0]: http://www.bumblehead.com                            "bumblehead"
[1]: https://github.com/iambumblehead/resolvewith/blob/master/src/resolvewith.js
[2]: https://nodejs.org/api/modules.html#modules_module_require_id
[3]: https://github.com/bower/spec/blob/master/json.md
[4]: https://github.com/substack/browserify-handbook#browser-field

 ![scrounge](https://github.com/iambumblehead/scroungejs/raw/master/img/hand.png) 
