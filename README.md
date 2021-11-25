resolvewithplus
===============
[![npm version](https://badge.fury.io/js/resolvewithplus.svg)](https://badge.fury.io/js/resolvewithplus) [![Build Status](https://github.com/iambumblehead/resolvewithplus/workflows/nodejs-ci/badge.svg)][2]

_resolvewithplus_ is an iteration of the _resolvewith_ package, which resolves CJS modules following [the original node.js spec.][2] _resolvewithplus_ adds incomplete support for ESM-style `import 'name'` resolution.

```javascript
// CJS
resolvewithplus('./testfiles/testscript.js', '/Users/bumble/resolvewith/test/')
// '/Users/bumble/resolvewith/test/testfiles/testscript.js'
resolvewithplus('testmodule', '/Users/bumble/resolvewith/test/')
// '/Users/bumble/resolvewith/node_modules/testmodule/index.js'

// ESM
resolvewithplus('koa', '/Users/bumble/resolvewith/test/', { esm : true });
// '/Users/bumble/resolvewith/node_modules/koa/dist/koa.mjs'
resolvewithplus('koa', '/Users/bumble/resolvewith/test/');
// '/Users/bumble/resolvewith/node_modules/koa/lib/application.js'

resolvewithplus('bowermodule', '/Users/bumble/resolvewith/test/', { browser : true });
// '/Users/bumble/resolvewith/bower_components/bowermodule/build/bowermoduleweb.js'
```

[0]: http://www.bumblehead.com                            "bumblehead"
[1]: https://github.com/iambumblehead/resolvewith/blob/master/src/resolvewith.js
[2]: https://nodejs.org/api/modules.html#modules_module_require_id
[3]: https://github.com/bower/spec/blob/master/json.md
[4]: https://github.com/substack/browserify-handbook#browser-field

 ![scrounge](https://github.com/iambumblehead/scroungejs/raw/master/img/hand.png) 

(The MIT License)

Copyright (c) [Bumblehead][0] <chris@bumblehead.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
