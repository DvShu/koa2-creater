#!/usr/bin/env node
/**
 * Created by Tenny on 2018/12/10 16:40.
 */
const program = require('commander');
const util = require('util');
const downloadGitRepo = require('download-git-repo');
const download = util.promisify(downloadGitRepo);
const inquirer = require('inquirer');
const chalk = require('chalk');
const symbols = require('log-symbols');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const spinner = ora();
const packageSearch = require('./lib/package_search');
const fs2 = require('./lib/fs_spread');
const Render = require('./lib/render');

const date = new Date();
const datetime = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' +
  date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();

let source = {
  datetime,
  time: date.getTime()
};

function inquire() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'session',
      message: '是否需要使用session(koa-session),[y/n]?'
    },
    {
      type: 'input',
      name: 'template',
      message: '是否需要使用模板引擎(art-template),[y/n]?'
    },
    {
      type: 'input',
      name: 'test',
      message: '是否需要 mocha + supertest 进行单元测试,[y/n]?'
    },
    {
      type: 'input',
      name: 'mongo',
      message: '不填表示不使用mongo,[test@mongo:127.0.0.1:27017/test]'
    }
  ]).then((answers) => {
    if (answers.mongo && !answers.mongo.includes('@')) {
      return Promise.reject('mongo url must includes @');
    } else {
      spinner.start('正在下载模板……');
      answers.mongo = answers.mongo ? answers.mongo.split('@') : null;
      Object.assign(source, answers);
      return download('github:ReconcileMySelf/koa2-template', source.name, { clone: true });
    }
  })
    .then(() => { // 模板下载完成
      spinner.succeed('模板下载成功!');
      spinner.start('获取依赖插件……');
      let des = [
        'koa',
        'log4js',
        'koa-router',
        'koa-static-cache',
        'koa-log4js-base',
        'koa-bodyparser'
      ], deleteFiles = [];
      if (source.session === 'y') {
        des.push('koa-session');
      }
      if (source.template === 'y') {
        des.push('art-template');
        des.push('koa-art-template');
      }
      if (source.mongo) {
        des.push('mongodb');
        des.push('mongo-adapt');
      } else {
        deleteFiles.push(path.join(source.name, 'dbs'));
      }
      if (source.test === 'y') {
        des.push('mocha');
        des.push('supertest');
      } else {
        deleteFiles.push(path.join(source.name, 'test'));
      }
      return fs2.rmdirs(deleteFiles).then(() => {
        return Promise.resolve(des);
      }); // 删除不需要的目录
    })
    .then(des => {
      return Promise.all(des.map(v => {
        return packageSearch(v)
      }))
    })
    .then(ar => {
      if (source.test === 'y') {
        source.dependencies = ar.slice(0, ar.length - 2);
        source.testDependencies = ar.slice(ar.length - 2);
      } else {
        source.dependencies = ar;
      }
      spinner.succeed('获取依赖插件成功!');
      spinner.start('模板编译……');
      return Promise.resolve(0);
    })
    .then(() => {
      let render = new Render(source);
      fs2.listFiles(source.name, function(n) {
        render.render(n);
      });
      setTimeout(() => {
        spinner.succeed('模板编译成功!');
        console.log(symbols.success, chalk.green('工程构建成功!'));
      }, 200);
    })
    .catch(err => {
      console.error(err);
      spinner.fail('工程构建失败!');
      console.log(symbols.error, chalk.red('工程构建失败'));
    });
}

program.version('0.0.5', '-v, --version')
  .command('init <name>')
  .action(name => {
    fs.access(name, fs.constants.F_OK, (err) => {
      if (err) {
        source.name = name;
        inquire();
      } else { // 文件存在
        // 错误提示项目已存在，避免覆盖原有项目
        console.log(symbols.error, chalk.red('项目已存在'));
      }
    });
  });

program.parse(process.argv);
