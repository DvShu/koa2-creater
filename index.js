#!/usr/bin/env node
/**
 * Created by Tenny on 2018/12/10 16:40.
 */
const program = require('commander');
const util = require('util');
const download = util.promisify(require('download-git-repo'));
const inquirer = require('inquirer');
const chalk = require('chalk');
const symbols = require('log-symbols');
const fs = require('fs-extra');
const path = require('path');
const spinner = require('ora')();
const { listFiles, packageSearch } = require('./lib/utils');
const ejs = require('ejs');

function log(msg = '', level) {
  if (level != null) {
    console.log(symbols[level], msg);
  } else {
    console.log(msg);
  }
}

let TEMP_TEMPLATE_FILENAME = '_koa2-template_';

const prompt = [
  {
    "type": "confirm",
    "name": "session",
    "message": "是否需要使用session(koa-session)?"
  },
  {
    "type": "confirm",
    "name": "template",
    "message": "是否需要使用模板引擎(ejs)?"
  },
  {
    "type": "confirm",
    "name": "test",
    "message": "是否需要 mocha + supertest 进行单元测试?"
  },
  {
    "type": "confirm",
    "name": "mongo",
    "message": "是否需要连接 mongodb?"
  },
  {
    "type": "input",
    "name": "mongoUrl",
    "message": "mongo连接：[连接名@连接地址]",
    "when": function(aw) {
      return aw.mongo;
    },
    "validate": function(input) {
      return input.includes('@') ? true : '连接地址必须包含 @';
    }
  }
];

const D = {
  "session": {
    "dependencies": ["koa-session"]
  },
  "template": {
    "dependencies": ["koa-ejs"]
  },
  "mongo": {
    "dependencies": ["mongodb", "mongo-adapt"]
  },
  "test": {
    "devDependencies": ["mocha", "supertest"]
  }
};

program
  .version(require('./package.json').version)
  .usage('<command> [options]');

program
  .command('init <name>')
  .description('create a new project')
  .alias('create')
  .option("-d, --dir [dir]", "The project directory, default: [.]", '.')
  .allowUnknownOption()
  .action(function(name, options) {
    let proPath = path.join(options.dir, name);
    // 判断目录是否存在
    fs.pathExists(proPath, (err, exists) => {
      if (!exists) { // 工程不存在
        spinner.start('start download template koa2-template-simple……');
        let tempPath = path.join(options.dir, TEMP_TEMPLATE_FILENAME), source = { name, time: Date.now() };
        // github: DvShu/koa2-template-simple
        download('direct:git@gitee.com:towardly/koa2-template-simple.git', tempPath, { clone: true })
          .then((tJson) => {
            spinner.succeed('template downloaded!');
            return inquirer.prompt(prompt);
          })
          .then((aw) => {
            aw.mongoUrl = aw.mongo ? aw.mongoUrl.split('@') : null;
            Object.assign(source, aw);
            let dep = [
              "koa",
              "koa-router",
              "koa-static-cache",
              "self-log",
              "koa-bodyparser"
            ];
            let devDep = [];
            for (let k in aw) {
              if (aw[k] === true) {
                let cd = D[k] || {};
                dep = dep.concat(cd.dependencies || []);
                devDep = devDep.concat(cd.devDependencies || []);
              }
            }
            source.devLength = devDep.length;
            return Promise.all(dep.concat(devDep).map(v => {
              return packageSearch(v)
            }))
          })
          .then((ar) => {
            source.dep = [];
            source.dep = ar.slice(0, ar.length - source.devLength);
            source.devDep = ar.slice(ar.length - source.devLength);
            spinner.succeed('获取依赖插件成功!');
          })
          .then(() => {
            spinner.start('编译模板……');
            return fs.copy(path.join(tempPath, 'template'), path.join(options.dir, name), {
              filter: function(filterName) {
                let fileBasename = path.basename(filterName);
                if (fileBasename === 'dbs') {
                  return source.mongo;
                } else if (fileBasename === 'test') {
                  return source.test;
                } else if (fileBasename === 'views') {
                  return source.template;
                }
                return true;
              }
            });
          })
          .then(() => {
            listFiles(path.join(options.dir, name), (filepath) => {
              let filePathObj = path.parse(filepath);
              if (filePathObj.name.startsWith('_')) { // 需要进行模板编译
                fs.rename(filepath, path.join(filePathObj.dir, filePathObj.name.substring(1) + filePathObj.ext));
              } else if (filePathObj.ext === '.ejs') {
                ejs.renderFile(filepath, source, (err, tplStr) => {
                  fs.writeFile(path.join(filePathObj.dir, filePathObj.name), tplStr, (err) => {
                    if (err) {
                      log(err, 'error');
                    } else {
                      fs.unlink(filepath);
                    }
                  });
                })
              }
            });
            return fs.emptyDir(tempPath);
          })
          .then(() => {
            fs.rmdir(tempPath);
            spinner.succeed('模板编译成功');
            log();
            log(chalk.green('工程构建成功：' + path.join(options.dir, name)), 'success');
          })
          .catch(err => {
            log(chalk.red(err), 'error');
            process.exit(0);
          })
      } else {
        log(chalk.red(`${proPath} is already exists!`), 'error');
        process.exit(1);
      }
    });
  });

program.Command.prototype['unknownOption'] = function (o) {
  if (this._allowUnknownOption) {
    return;
  }
  log();
  this.outputHelp();
  log();
  log(chalk.red(`unknown option: ${o}`), 'error');
  log();
};


program.on('command:*', () => {
  log();
  program.outputHelp();
  log();
  log(chalk.red('Invalid command: %s'), 'error');
  log();
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
