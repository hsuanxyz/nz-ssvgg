#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parse5 = require('parse5');

const whitelist = [
  'CalendarOutline',
  'CheckCircleFill',
  'CheckCircleOutline',
  'CheckOutline',
  'ClockCircleOutline',
  'CloseCircleOutline',
  'CloseCircleFill',
  'CloseOutline',
  'DoubleLeftOutline',
  'DoubleRightOutline',
  'DownOutline',
  'ExclamationCircleFill',
  'ExclamationCircleOutline',
  'InfoCircleFill',
  'InfoCircleOutline',
  'LeftOutline',
  'LoadingOutline',
  'PaperClipOutline',
  'QuestionCircleOutline',
  'RightOutline',
  'UploadOutline',
  'UpOutline',
  'ClassOutline'
];

(() => {
  const runDir = process.argv[2] || '';
  const runPath = path.resolve(runDir);
  const angularJSONPath = path.join(runPath, 'angular.json');

  if (!fs.existsSync(angularJSONPath)) {
    console.error(`没有在 ${runPath} 找到 angular.json！`);
    process.exit();
  }

  const project = getProject(angularJSONPath);
  const sourceRoot = path.join(runPath, project.sourceRoot || project.root);

  walkAndGenerator(sourceRoot, `ant-svg-icons.ts`)

})();

function walkAndGenerator(sourceRoot, filename) {
  const targetPath = path.join(sourceRoot, filename);
  walk(sourceRoot, (err, results) => {
    const iconClassList = new Set();

    results.forEach(file => {
      const content = fs.readFileSync(file).toString();
      if (typeof content === 'string') {
        paresIcons(content).forEach(name => {
          iconClassList.add(name);
        });
      }
    });

    const iconSet = new Set();

    iconClassList.forEach(value => {
      const iconName = getIconNameByClassName(value);

      if (iconName && whitelist.indexOf(iconName) === -1) {
        iconSet.add(iconName)
      }
    });

    const sortIcon = new Array(...iconSet).sort();

    fs.writeFile(targetPath, generateContent(sortIcon), function (err) {
      if (err) {
        return console.log(err);
      }

      console.log(`生成到：${targetPath}`);
    });
  });
}
function paresIcons(content) {
  const names = [];
  const inClassRegex = /anticon(-\w+)+/g;
  const inTagRegex = /<i\s.*((type)|(nz-icon)).*<\/i>/g;
  const inClassMatch = `${content}`.match(inClassRegex) || [];
  const inTagMatch = `${content}`.match(inTagRegex) || [];
  inClassMatch.forEach(klass => {
    names.push(klass);
  });
  inTagMatch.forEach(e => {
    const htmlFragment = parse5.parseFragment(e);
    let _names = [];
    if (htmlFragment && htmlFragment.childNodes && htmlFragment.childNodes[0]) {
      let type = htmlFragment.childNodes[0].attrs.find(attr => ['type', '[type]', 'nzType', '[nzType]'].indexOf(attr.name) !== -1);
      let theme = htmlFragment.childNodes[0].attrs.find(attr => ['theme', '[theme]', 'nzTheme', '[nzTheme]'].indexOf(attr.name) !== -1);

      /**
       * type="icon"
       * nzType="icon"
       */
      if (type && ['type', 'nzType'].indexOf(type.name) !== -1 && /^[A-Za-z]/g.test(type.value) && type.value.indexOf(' ') === -1) {
        _names.push(type.value);
      }

      /**
       * [type]="value ? 'icon' : 'icon'"
       * [nzType]="value ? 'icon' : 'icon'"
       * [type]="'icon'"
       * [nzType]="'icon'"
       */
      if (type && ['[type]', '[nzType]'].indexOf(type.name) !== -1) {
        let types = type.value.match(/'[A-Za-z]+'/g) || [];
        types = types.map(t => t.replace(/'/g, ''));
        _names.push(...types);
      }

      /**
       * theme="theme"
       * nzTheme="theme"
       */
      if (theme && ['theme', 'nzTheme'].indexOf(theme.name) !== -1 && /^[A-Za-z]/g.test(theme.value) && theme.value.indexOf(' ') === -1) {
        _names = _names.map(e => `${e}#${theme.value}`);
      }

      /**
       * [theme]="value ? 'theme' : 'theme'"
       * [nzTheme]="value ? 'theme' : 'theme'"
       * [theme]="'theme'"
       * [nzTheme]="'theme'"
       */
      if (theme && ['[theme]', '[nzTheme]'].indexOf(theme.name) !== -1 ) {
        let themes = theme.value.match(/'[A-Za-z]+'/g) || [];
        themes = themes.map(t => t.replace(/'/g, ''));
        let themesXNames = [];

        if (themes.indexOf('outline') !== -1) {
          _names.forEach(n => {
            themesXNames.push(`${n}#outline`)
          })
        }

        if (themes.indexOf('fill') !== -1) {
          _names.forEach(n => {
            themesXNames.push(`${n}#fill`)
          })
        }

        _names = [...themesXNames];
      }

      if (_names.length) {
        _names = _names.map(e => e.indexOf('anticon-') === -1 ? `anticon-${e}` : e);
        names.push(..._names);
      }
    }
  });

  return names;
}

function generateContent(iconMap) {
  let imports = 'import {\n';
  let icons = 'export const ANT_ICONS = [\n';
  iconMap.forEach((value, index) => {
    imports += `    ${value}${index < iconMap.length - 1? ',' : '' }\n`;
    icons += `    ${value}${index < iconMap.length - 1? ',' : '' }\n`
  });

  return `${imports} } from '@ant-design/icons-angular/icons';\n\n${icons}];\n`;
}

function getProject(angularJSONPath) {
  const angularJSON = fs.readFileSync(angularJSONPath);
  const defaultProject = JSON.parse(angularJSON).defaultProject;

  if (!defaultProject) {
    console.error(`没有在 angular.json 中找到 [defaultProject] 字段`);
    process.exit();
  }

  return JSON.parse(angularJSON).projects[defaultProject];
}

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function (file) {
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (['.ts', '.html'].indexOf(path.extname(file)) !== -1) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

function getIconNameByClassName(className) {

  let parsedIconType = className.replace('anticon-', '');
  if (className === 'anticon-spin' || className.indexOf('-o-') !== -1) {
    return null;
  }

  if (parsedIconType.includes('verticle')) {
    parsedIconType = parsedIconType.replace('verticle', 'vertical');
  }
  if (parsedIconType.startsWith('cross')) {
    parsedIconType = parsedIconType.replace('cross', 'close');
  }

  if (/(-o)$/.test(parsedIconType)) {
    parsedIconType = parsedIconType.replace(/(-o)$/, '-outline')
  } else if (/#outline/.test(parsedIconType)) {
    parsedIconType = parsedIconType.replace(/#outline/, '-outline')
  } else if (/#fill/.test(parsedIconType)) {
    parsedIconType = parsedIconType.replace(/#fill/, '-fill')
  } else {
    parsedIconType = `${parsedIconType}-outline`
  }

  return className2camelCased(parsedIconType);
}

function className2camelCased(className) {
  return className
    .replace(/-([a-z])/g, e => {
      return e[1].toUpperCase();
    })
    .replace(/^\w/, g => {
      return g[0].toUpperCase()
    })
}
