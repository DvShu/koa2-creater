/**
 * 扩展 fs 模块
 * Created by haoran.shu on 2018/12/12 10:38.
 */
const p = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let rm = function(path) {
  return new Promise((resolve, reject) => {
    let deleteCmd = process.platform === 'win32' ? 'rd /s/q' : 'rm -rf';
    exec(`${deleteCmd} ${path}`, function(error, stdout, stderr) {
      if (error) {
        reject(error);
      } else {
        if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      }
    });
  });
};

/**
 * 删除目录, 包含目录下所有的文件一起静默删除
 * @param path {String|Array|Set} 需要删除的目录
 * @return Promise
 */
function rmdirs(path) {
  if (typeof path === 'string') {
    return rm(path);
  } else if (path instanceof Array) {
    return Promise.all(path.map(p => {
      return rm(p);
    }));
  } else if (path instanceof Set) {
    let ps = [];
    for (let i of path) {
      ps.push(rm(i));
    }
    return Promise.all(ps);
  } else {
    return Promise.reject('path must be [String|Array|Set]');
  }
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

  rmdirs,

  listFiles
};
