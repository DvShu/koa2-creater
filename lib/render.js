/**
 * 渲染流, 根据读取的模板内容进行渲染
 * Created by haoran.shu on 2018/1/12.
 */
const art = require('art-template');
const fs = require('fs');

let readStream = function(p) {
  return new Promise((resolve, reject) => {
    let stream = fs.createReadStream(p);
    stream.setEncoding('utf8');
    let source = '';
    stream.on('data', (chunk) => {
      source += chunk;
    });
    stream.once('end', () => {
      resolve(source);
    });
    stream.once('error', (err) => {
      reject(err);
    });
  });
};

class Render {

  constructor(data) {
    this.data = data;
  }

  render(p) {
    readStream(p)
      .then(source => {
        source = art.render(source, this.data);
        let wr = fs.createWriteStream(p);
        wr.write(source);
      })
      .catch(err => {
        console.error(err);
      });
  }
}



module.exports = Render;
