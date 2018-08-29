const path = require('path');
const fs = require('fs-extra');
const thread = require('./thread');
const http = require('http');
const mine = require('mime');

const fileCache = {};

function rendFile(res, filePath, fileContents) {
  console.log('render----' + filePath);
  res.writeHead(200, {
    'Content-Type': mime.getType(filePath),
  });

  res.end(fileContents);
}
const isDev = process.env.NODE_ENV === 'development' || process.env.dev;

const nature = {
  path,
  fs,
  thread,
  isDev,
  listen: (port, event) => {
    const app = new http.Server();
    app.on('request', event);
    app.listen(4100);
    return app;
  },
  serverStatic: (res, absPath) => {
    console.log(absPath);
    if (fileCache[absPath]) {
      //检查文件是否在缓存中
      res.writeHead(200, {
        'Content-Type': mime.lookup(path.basename(absPath)),
      });
      res.end(fileCache[absPath]);
    } else {
      //不在缓存中
      fs.exists(absPath, exists => {
        //检查文件是否存在
        if (exists) {
          //存在
          fs.readFile(absPath, (err, data) => {
            if (err) {
              res.end('404');
            } else {
              fileCache[absPath] = data;
              res.writeHead(200, {
                'Content-Type': mime.lookup(path.basename(absPath)),
              });
              res.end(fileCache[absPath]);
            }
          });
        } else {
          res.end('404');
        }
      });
    }
  },
  url: (res, url) => {
    if (res.url.indexOf(url) === 0) {
      return true;
    }
    return false;
  },
  html: (res, url) => {
    if (!nature.url(res, url)) {
      res.writeHead(200, {
        'Content-Type': 'text/html',
      });
      res.end(404);
      return false;
    } else
      res.writeHead(200, {
        'Content-Type': 'text/html',
      });
  },
  get: (res, url) => {
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    return url.parse(req.url, true).query;
  },
  post: (res, url) => {
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    let data = {};
    res.on('data', chunk => {
      data = querystring.parse(chunk);
    });
    return data;
  },
};

module.exports = nature;
