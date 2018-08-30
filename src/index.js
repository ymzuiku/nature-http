const path = require('path');
const fs = require('fs-extra');
const threads = require('./threads');
const http = require('http');
const mime = require('mime');
const {
  methodGet,
  methodHtml,
  methodPost,
  methodStatic,
  methodError,
  methodGraphql,
} = require('./mothod');

const isDev = process.env.prod === undefined;

const ICtx = {
  req: { url: '' },
  res: {
    on: function() {},
    end: function() {},
    writeHead: function() {},
    write: function() {},
  },
  async: false,
  error: (ctx, statusCode) => {},
  headers: {},
  get: () => {},
  post: () => {},
  static: () => {},
  pages: {
    '404': undefined,
    '500': undefined,
  },
  graph: (url, schema, fn) => {},
  options: {
    gzipMinSize: 1024,
    gzipMaxSize: 10240,
  },
};

const nature = {
  resolve: path.resolve,
  options: ICtx.options,
  mime,
  fs,
  threads,
  isDev,
  ctx: ICtx,
  listenThreads: (port, event = (ctx = ICtx) => {}) => {
    nature.threads(() => {
      nature.listen(port, event);
    });
  },
  listen: (port, event = (ctx = ICtx) => {}) => {
    const app = new http.Server();
    app.on('request', (req, res) => {
      const ctx = {
        req,
        res,
        options: nature.options,
        pages: nature.pages,
        headers: {},
        html: (url, cb) => {
          methodHtml(ctx, url, cb);
        },
        get: (url, cb) => {
          methodGet(ctx, url, cb);
        },
        post: (url, cb) => {
          methodPost(ctx, url, cb);
        },
        static: (url, cb) => {
          methodStatic(ctx, url, cb);
        },
        error: statusCode => {
          methodError(ctx, statusCode);
        },
        graph: (url, schema, body) => {
          methodGraphql(ctx, url, schema, body);
        },
      };
      event(ctx);
    });
    console.log('listren: http://127.0.0.1:' + port);
    app.listen(port);
    return app;
  },
  pages: ICtx.pages,
};

module.exports = nature;
