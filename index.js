#!/usr/bin/env node

const fs = require('fs');
const path = require('path');


(() => {
  const runDir = process.argv[2];
  const runPath = path.resolve(runDir);
  const angularJSONPath = path.join(runPath, 'angular.json');

  if (!fs.existsSync(angularJSONPath)) {
    console.error(`没有在 ${runPath} 找到 angular.json！`);
    process.exit();
  }

  const project = getProject(angularJSONPath);
  const sourceRoot = path.join(runPath, project.sourceRoot);

  walkAndGenerator(sourceRoot, `ant-svg-icons.ts`)

})();

function walkAndGenerator(sourceRoot, filename) {

  const targetPath = path.join(sourceRoot, filename);
  walk(sourceRoot, (err, results) => {
    const iconClassList = new Set();
    const regex = /anticon(-\w+)+/g;

    results.forEach(file => {
      const content = fs.readFileSync(file).toString();
      if (typeof content === 'string') {
        const match = content.match(regex) || [];
        match.forEach(klass => {
          iconClassList.add(klass);
        })
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

function getContent(iconMap) {
  let imports = 'import {\n';
  let icons = 'export const ANT_ICONS = [\n';
  iconMap.forEach(value => {
    imports += `${value},\n`;
    icons += `  ${value},\n`
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
  } else {
    // TODO
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
