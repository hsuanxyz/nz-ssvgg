#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parse5 = require('parse5');

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
          getIconNames(content).forEach(name => {
              iconClassList.add(name);
          });
      }
    });

    const iconSet = new Set();

    iconClassList.forEach(value => {
      const iconName = getIconNameByClassName(value);
      if (iconName) {
        iconSet.add(iconName)
      }
    });

    const sortIcon = new Array(...iconSet).sort();

    fs.writeFile(targetPath, getContent(sortIcon), function (err) {
      if (err) {
        return console.log(err);
      }

      console.log(`生成到：${targetPath}`);
    });
  });
}

function getIconNames(content) {
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
        let name = '';
        if (htmlFragment && htmlFragment.childNodes && htmlFragment.childNodes[0]) {
            let type = htmlFragment.childNodes[0].attrs.find(e => e.name === 'type' || e.name === '[type]');
            let theme = htmlFragment.childNodes[0].attrs.find(e => e.name === 'theme' || e.name === '[theme]');
            
            /**
             * TODO
             *  [type] [theme] 匹配出 'xxx'
             *  type theme 匹配出 {{xxx}}
             */
    
            if (type && type.name === 'type' && /^[A-Za-z]/g.test(type.value) && type.value.indexOf(' ') === -1) {
                name += type.value
            }
    
            if (theme && theme.name === 'theme' && /^[A-Za-z]/g.test(theme.value) && theme.value.indexOf(' ') === -1) {
                name += `#${theme.value}`
            }
            
            if (name) {
                names.push('anticon-' + name);
            }
        }
    });
    
    return names;
}

function getContent(iconMap) {
  let imports = 'import {\n';
  let icons = 'export const ANT_ICONS = [\n';
  iconMap.forEach(value => {
    imports += `    ${value},\n`;
    icons += `    ${value},\n`
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
          if (['.ts', '.html', '.css', '.less', '.scss', '.js'].indexOf(path.extname(file)) !== -1) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

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
