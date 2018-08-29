const path = require('path');
const fs = require('fs-extra');
const threads = require('./threads');
const http = require('http');
const mime = require('mime');
const zlib = require('zlib');
const gzip = zlib.createGzip();
const urlParse = require('url').parse;

const fileCache = {};
const isDev = process.env.NODE_ENV === 'development' || process.env.dev;

function mothodHtml(ctx, cb) {
  if (typeof ctx === 'function') {
    ctx = ctx();
  }
  if (ctx.req.url.indexOf(url) === 0) {
    ctx.res.writeHead(200, {
      'Content-Type': 'text/html',
      ...ctx.headers,
    });
    cb();
  }
}
function mothodGet(ctx, url, cb) {
  if (typeof ctx === 'function') {
    ctx = ctx();
  }
  if (ctx.req.url.indexOf(url) === 0) {
    ctx.res.writeHead(200, {
      'Content-Type': 'application/json',
      ...ctx.headers,
    });
    cb(urlParse(ctx.req.url, true).query);
  }
}
function mothodPost(ctx, url, cb) {
  if (typeof ctx === 'function') {
    ctx = ctx();
  }
  if (ctx.req.url.indexOf(url) === 0) {
    ctx.res.writeHead(200, {
      'Content-Type': 'application/json',
      ...ctx.headers,
    });
    let data = {};
    ctx.res.on('data', chunk => {
      data = querystring.parse(chunk);
    });
    cb(data);
  }
}
function staticServer(ctx, dirPath, cb) {
  if (typeof ctx === 'function') {
    ctx = ctx();
  }
  let absPath = dirPath + ctx.req.url;
  if (fileCache[absPath]) {
    ctx.res.writeHead(200, {
      'Content-Type': mime.getType(absPath),
      ...ctx.headers,
    });
    ctx.res.end(fileCache[absPath]);
  } else {
    ctx.async = true;
    fs.stat(absPath, (err, stats) => {
      if (err) {
        nature.error(ctx);
      } else {
        let file = absPath;
        if (stats.isDirectory()) {
          file = file + 'index.html';
        }
        fs.readFile(file, (err, data) => {
          if (err) {
            nature.error(ctx);
          } else {
            if (
              data.length > 2048 &&
              (absPath.indexOf('.js') > -1 || absPath.indexOf('.css') > -1)
            ) {
              zlib.deflate(data, (err, buffer) => {
                if (err) {
                  nature.error(ctx);
                  ctx.res.writeHead(200, {
                    'Content-Type': mime.getType(absPath),
                    ...ctx.headers,
                  });
                } else {
                  ctx.res.writeHead(200, {
                    'Content-Type': mime.getType(absPath),
                    'Content-Encoding': 'gzip',
                    ...ctx.headers,
                  });
                  data = buffer;
                }
              });
            } else {
              ctx.res.writeHead(200, {
                'Content-Type': mime.getType(absPath),
                ...ctx.headers,
              });
            }
            fileCache[absPath] = data;
            if (cb) {
              cb(ctx);
            }
            ctx.res.end(fileCache[absPath]);
          }
        });
      }
    });
  }
}

const ICtx = {
  req: { url: '' },
  res: {
    on: function() {},
    end: function() {},
    writeHead: function() {},
    write: function() {},
  },
  async: false,
  headers: {},
  get: () => {},
  post: () => {},
  static: () => {},
};

const nature = {
  resolve: path.resolve,
  mime,
  fs,
  threads,
  isDev,
  ctx: ICtx,
  listenThreads: (prot, event = (ctx = ICtx) => {}) => {
    nature.threads(function() {
      nature.listen(4100, event);
    });
  },
  listen: (port, event = (ctx = ICtx) => {}) => {
    const app = new http.Server();
    app.on('request', (req, res) => {
      const ctx = {
        req,
        res,
        async: false,
        headers: {},
        get: (url, cb) => {
          mothodGet(ctx, url, cb);
        },
        post: (url, cb) => {
          mothodPost(ctx, url, cb);
        },
        static: (url, cb) => {
          staticServer(ctx, url, cb);
        },
      };
      event(ctx);
      if (!ctx.async) {
        nature.error(ctx);
      }
    });
    app.listen(4100);
    return app;
  },
  pages: {
    '404': undefined,
    '500': undefined,
  },
  error: (ctx, statusCode = 404) => {
    if (typeof ctx === 'function') {
      ctx = ctx();
    }
    ctx.res.writeHead(statusCode, {
      'Content-Type': 'text/html',
      ...ctx.headers,
    });
    if (nature.pages[statusCode] !== undefined) {
      ctx.res.end(`
      <script language="javascript">
      window.location = "${nature.pages[statusCode]}";
    </script>
      `);
    } else {
      ctx.res.end(statusCode + '');
    }
  },
};

module.exports = nature;
