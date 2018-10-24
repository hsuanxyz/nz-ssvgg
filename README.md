<h1>
NG-ZORRO
<small>Super SVG generator</small>
</h1>

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]
[![MIT License][license-image]][license-url]

## 这是什么？

这个工具会**尽可能**从你的项目找到使用过的 Icon，然后帮你生成按需引入的文件。对于没有匹配到的(比如动态生成)图标，NG-ZORRO 会自动使用动态加载的方式请求。

## 为什么？

[ng-zorro-antd@1.7.0](https://github.com/NG-ZORRO/ng-zorro-antd/releases/tag/1.7.0) 版本后，使用了 svg 图标替换了原先的 font 图标，从而带来了以下劣势(误)：

- 全量静态引入时带来**包体积增加**
- 动态加载时会在没有缓存的情况下带来**多余的请求**(相比之前)

## 如何使用？

通过 `npm` 或者 `yarn` 安装。

```shell
$ npm i nz-ssvgg -g
```

运行以下命令

```shell
$ nz-ssvgg hsuanlee/ng-project #项目根目录
```

如果一切正常你可以在你项目的下找到 `src/ant-svg-icons.ts` 文件，看起来像这样:

```ts
import {
    AndroidOutline,
    AppleOutline,
    NotificationOutline,
    PaperClipOutline,
...
 } from '@ant-design/icons-angular/icons';

export const ANT_ICONS = [
    AndroidOutline,
    AppleOutline,
    NotificationOutline,
    PaperClipOutline,
  ...
];

```

接下来按照官方文档添加图标即可，就像这样:

```ts
import { ANT_ICONS } from '../ant-svg-icons.ts';
import { NzIconService } from 'ng-zorro-antd';

export class AppComponent implements OnInit, AfterViewInit {
  constructor(private iconService: NzIconService) {
    // Import what you need.
    this.iconService.addIcon(...ANT_ICONS);
  }
}
```

## 它是怎么工作的？

1. 读取你项目的 `angular.json` 文件，找到默认项目
2. 遍历项目文件，使用 `/anticon(-\w+)+/g` 进行匹配
3. 生成按需导入文件夹


[npm-url]: https://www.npmjs.com/package/nz-ssvgg
[npm-image]: https://img.shields.io/npm/v/nz-ssvgg.svg
[downloads-image]: https://img.shields.io/npm/dm/nz-ssvgg.svg
[downloads-url]: http://badge.fury.io/js/nz-ssvgg
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE