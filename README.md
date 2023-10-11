resolvewithplus
===============
![npm](https://img.shields.io/npm/v/resolvewithplus) ![Build Status](https://github.com/iambumblehead/resolvewithplus/workflows/test/badge.svg) [![install size](https://packagephobia.now.sh/badge?p=resolvewithplus)](https://packagephobia.now.sh/result?p=resolvewithplus)


```javascript
resolvewithplus('koa', '/resolvewith/test/')
// 'file:///resolvewith/node_modules/koa/dist/koa.mjs'

resolvewithplus('react-dom/server', '/resolvewith/test/', {
  isbrowser: true
})
// 'file:///resolvewith/node_modules/react-dom/server.browser.js'

resolvewithplus('react-dom/server', '/resolvewith/test/', {
  priority: ['browser', 'default']
})
// 'file:///resolvewith/node_modules/react-dom/server.browser.js'
```


`resolvewithplus` resolves module paths à la [node.js' import.meta.resolve function][33] and the [import-meta-resolve npm package.][35] It exists mostly to be small and to resolve module paths for `esmock`. [It's size is ~7kB][36] compared to [import-meta-resolve's ~76kB size.][37] For more details, [see the wiki.](https://github.com/iambumblehead/resolvewithplus/wiki)

 ![scrounge](https://github.com/iambumblehead/scroungejs/raw/main/img/hand.png) 

[33]: https://nodejs.org/api/esm.html#importmetaresolvespecifier-parent
[35]: https://www.npmjs.com/package/import-meta-resolve
[36]: https://packagephobia.com/result?p=resolvewithplus
[37]: https://packagephobia.com/result?p=import-meta-resolve
[39]: https://github.com/iambumblehead/resolvewithplus



