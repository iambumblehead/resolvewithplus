resolvewithplus
===============
![npm](https://img.shields.io/npm/v/resolvewithplus) ![Build Status](https://github.com/iambumblehead/resolvewithplus/workflows/nodejs-ci/badge.svg) [![install size](https://packagephobia.now.sh/badge?p=resolvewithplus)](https://packagephobia.now.sh/result?p=resolvewithplus)

```javascript
resolvewithplus( 'koa', '/root/resolvewith/test/' );
// '/root/resolvewith/node_modules/koa/dist/koa.mjs'
```

`resolvewithplus` resolves module paths à la the [`import.meta.resolve` node.js function][33] or the [`import-meta-resolve` npm package.][35] `resolvewithplus` [is only ~5.12kB][36] compared to [import-meta-resolve's ~182kB size,][37] at this time of writing. `resolvewithplus` has limited goals and exists mostly to be small and to resolve module paths for `esmock`,
  * returns a path string or null, doesn't try to follow node.js' error-handling behaviour,
  * locates modules at the local-filesystem only,
  * locates paths with non-standard extensions such as ".tsx",
  * caches module paths it returns, and returns the same paths for subsequent matching calls,
  * still improving and fails to resolve some ESM export patterns, please report any issue you find,
  * is called the same way as `import.meta.resolve`, with two parameters "specifier" and a "parent"


More "complicated" ESM export patterns may yet be un-supported, for example ["#" sign subpath-patterns][38] are still un-supported `{ imports: { '#main': './main.js' } }`. The support chart below shows export patterns currently supported by esmock,

<table>
  <tbody>
    <tr>
      <td align="left">&nbsp;
        <pre lang="json">{
  "name": "test",
  "exports": "./main.js"
}</pre></td>
      <td align="left" style="white-space:normal;"><b>top-level exports</b></td>
    </tr>
    <tr>
      <td align="left">&nbsp;
        <pre lang="json">{
  "name": "test",
  "exports": {
    "types": "./main.ts",
    "require": "./main.js",
    "import": "./main.mjs"
  }
}</pre></td>
      <td align="left" style="white-space:normal;"><b>subpath exports, simplified</b></td>
    </tr>
    <tr>
      <td align="left">&nbsp;
        <pre lang="json">{
  "name": "test",
  "exports": {
    "." : {
      "require": "./main.js",
      "import": "./main.mjs"
    }
  }
}</pre></td>
      <td align="left" style="white-space:normal;"><b>subpath exports, nested</b></td>
    </tr>
    <tr>
      <td align="left">&nbsp;
        <pre lang="json">{
  "name": "test",
  "exports": {
    "." : [ {
      "import" : "./index.mjs",
      "require" : "./index.cjs"
    }, "./index.cjs" ]
  }
}</pre></td>
      <td align="left" style="white-space:normal;"><b>subpath exports, nested list</b></td>
    </tr>
  </tbody>
</table>

 ![scrounge](https://github.com/iambumblehead/scroungejs/raw/master/img/hand.png) 

[20]: https://github.com/iambumblehead/esmock/pull/68#issuecomment-1191884521
[30]: https://github.com/facebook/jest/issues/11786#issuecomment-907136701
[31]: https://nodejs.org/api/esm.html#resolver-algorithm-specification
[32]: https://nodejs.org/api/packages.html#package-entry-points
[33]: https://nodejs.org/api/esm.html#importmetaresolvespecifier-parent
[34]: https://github.com/nodejs/modules/issues/550
[35]: https://www.npmjs.com/package/import-meta-resolve
[36]: https://packagephobia.com/result?p=resolvewithplus
[37]: https://packagephobia.com/result?p=import-meta-resolve
[38]: https://nodejs.org/api/packages.html#subpath-patterns
[39]: https://github.com/iambumblehead/resolvewithplus



