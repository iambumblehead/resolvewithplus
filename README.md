resolvewithplus
===============
![npm](https://img.shields.io/npm/v/resolvewithplus) ![Build Status](https://github.com/iambumblehead/resolvewithplus/workflows/nodejs-ci/badge.svg) [![install size](https://packagephobia.now.sh/badge?p=resolvewithplus)](https://packagephobia.now.sh/result?p=resolvewithplus)

```javascript
resolvewithplus('koa', '/root/resolvewith/test/')
// '/root/resolvewith/node_modules/koa/dist/koa.mjs'
```

`resolvewithplus` resolves module paths à la the [import.meta.resolve node.js function][33] or the [import-meta-resolve npm package.][35] `resolvewithplus` [is only ~6kB][36] compared to [import-meta-resolve's ~182kB size.][37] `resolvewithplus` has limited goals and exists mostly to be small and to resolve module paths for `esmock`. For more details, [see the wiki.](https://github.com/iambumblehead/resolvewithplus/wiki)

 ![scrounge](https://github.com/iambumblehead/scroungejs/raw/master/img/hand.png) 

[33]: https://nodejs.org/api/esm.html#importmetaresolvespecifier-parent
[35]: https://www.npmjs.com/package/import-meta-resolve
[36]: https://packagephobia.com/result?p=resolvewithplus
[37]: https://packagephobia.com/result?p=import-meta-resolve
[39]: https://github.com/iambumblehead/resolvewithplus



