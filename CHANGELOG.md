# changelog

 * 2.0.2 _Mar.18.2023_
  * increment dependencies,
  * use node 20 at ci
 * 2.0.1 _Nov.26.2022_
  * resolve windows modules with correct drive letter [using patch](https://github.com/iambumblehead/resolvewithplus/pull/42) from @mshima
 * 2.0.0 _Oct.19.2022_
  * return encoded url [same as import.meta.resolve](https://github.com/iambumblehead/resolvewithplus/pull/40) 
 * 1.0.2 _Sep.24.2022_
   * add test and changes to [support import.meta.resolve](https://github.com/iambumblehead/resolvewithplus/pull/39)
 * 1.0.1 _Sep.15.2022_
   * reduce size of minified resolvewithplus.js file [by 50%](https://github.com/iambumblehead/resolvewithplus/pull/38)
 * 1.0.0 _Aug.28.2022_
   * return paths in fileurl format, like import.meta.resolve
   * added tests around export sugar esm patterns
 * 0.9.0 _Aug.23.2022_
   * add complete esm pattern parsing [(big improvement)](https://github.com/iambumblehead/resolvewithplus/pull/26)
 * 0.8.9 _Aug.19.2022_
   * resolve pg packages cjs ["main": "./lib"](https://github.com/iambumblehead/resolvewithplus/pull/32)
 * 0.8.8 _Aug.16.2022_
   * support win32 [drive-style module-path](https://github.com/iambumblehead/resolvewithplus/pull/31)
 * 0.8.7 _Aug.15.2022_
   * support core modules [w/ node: prefix](https://github.com/iambumblehead/resolvewithplus/pull/27), credit @gmahomarf
 * 0.8.6 _Aug.01.2022_
   * begin dusting off this old package
   * move tests into subdirectory, prepare for multiple test packages
   * use shields io npm badge
   * add tests for export patterns from nodejs documentation
   * add exports.import definition
