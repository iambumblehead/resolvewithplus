# changelog

 * 2.1.4 _Jan.01.2024_
   * [resolve nested exports defined on named-properties](https://github.com/iambumblehead/resolvewithplus/pull/65) with wildcards, eg `exports: { './*': { default: './src/*/index.js' } }` resolves [this issue at esmock](https://github.com/iambumblehead/esmock/issues/289)
 * 2.1.3 _Oct.20.2023_
   * resolve full path from package.json "main", "browser" and "module" definitions. resolves [this issue at esmock.](https://github.com/iambumblehead/esmock/issues/260)
 * 2.1.2 _Oct.19.2023_
   * [remove unused condition](https://github.com/iambumblehead/resolvewithplus/pull/63) and resolved error where fileurl path was not correctly resolved for package.json "main", "browser" and "module" definitions
 * 2.1.1 _Oct.19.2023_
   * [support user-defined priority list](https://github.com/iambumblehead/resolvewithplus/pull/62) when resolving nested export expressions
 * 2.1.0 _Oct.15.2023_
   * [when user-defined priority list](https://github.com/iambumblehead/resolvewithplus/pull/61) includes "import" return packagejson.module before packagejson.main
 * 2.0.9 _Oct.15.2023_
   * [resolve error preventing](https://github.com/iambumblehead/resolvewithplus/pull/60) module resolution. There is a condition that alters lookup paths for the situation when resolvewithplus is being developed and tested from inside another package's node_modules. The condition caused lookup errors. The condition was changed and a unit-test added
 * 2.0.8 _Oct.06.2023_
   * [remove un-necessary sorting](https://github.com/iambumblehead/resolvewithplus/pull/59) should result in faster lookups
 * 2.0.7 _Oct.06.2023_
   * [use package type](https://github.com/iambumblehead/resolvewithplus/pull/55) to determine lookup: 'import' or 'require' etc
 * 2.0.6 _Oct.06.2023_
   * [add support for 'priority'](https://github.com/iambumblehead/resolvewithplus/pull/54) configuration option
   * [explicitly prioritize "browser"](https://github.com/iambumblehead/resolvewithplus/pull/54) then "import" then "default", when browser and import both true
   * [update README image link](https://github.com/iambumblehead/resolvewithplus/pull/52) to use "main" repo path
   * [replace reducer function](https://github.com/iambumblehead/resolvewithplus/pull/53) w/ simple recursion
 * 2.0.5 _Sep.13.2023_
   * [improve performance](https://github.com/iambumblehead/resolvewithplus/pull/49) slightly
   * [use main branch](https://github.com/iambumblehead/resolvewithplus/pull/50) rather than master
 * 2.0.4 _Sep.12.2023_
   * [improve resolution](https://github.com/iambumblehead/resolvewithplus/pull/48) of typescript moduleIds
 * 2.0.3 _Sep.12.2023_
   * pin node 20.4 at unit-test pipeline, last version of node before import.meta.resolve was reduced
   * [add workspaces unit-tests](https://github.com/iambumblehead/resolvewithplus/pull/46)
   * [add detection of ".ts"](https://github.com/iambumblehead/resolvewithplus/pull/47) parent extension for applying typescript conditions
   * [use moduleId and parent as internal names,](https://github.com/iambumblehead/resolvewithplus/pull/48) following nodejs conventions
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
