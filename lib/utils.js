const https = require('https');
const p = require('path');
const fs = require('fs');

let ps = function(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let resData = '', statusCode = res.statusCode;
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        resData += chunk;
      });
      res.on('end', () => {
        if (statusCode >= 200 && statusCode < 300) {
          resolve(JSON.parse(resData));
        } else {
          reject(new Error(statusCode + ' & ' + res.statusText));
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
};

function packageSearch(packageName) {
// https://registry.npmjs.org/koa/latest
  return ps(`https://registry.npm.taobao.org/${packageName}/latest`)
    .then(function(r) {
      return { name: r.name, version: r.version };
    });
}

/**
 * 遍历文件夹
 * @param path  遍历目录
 * @param cb    遍历到每个文件后的回调
 */
function listFiles(path, cb = () => {}) {
  fs.stat(path, (err, stat) => {
    if(err) {
      console.error(err);
    } else {
      if(stat.isFile()) { // 是文件
        cb(path);
      } else {
        // 读取目录下的所有文件
        fs.readdir(path, (err, files) => {
          if(err) {
            console.error(err);
          } else {
            files.forEach(function(f) {
              listFiles(p.join(path, f), cb);
            });
          }
        });
      }
    }
  });
}

module.exports = {

  listFiles, // 遍历文件夹

  packageSearch // 查询 npm 包最新版本信息
};
