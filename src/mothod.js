const mime = require('mime');
const zlib = require('zlib');
const urlParse = require('url').parse;
const fs = require('fs-extra');
const graph = require('./graph');

const fileCache = {};

function methodHtml(ctx, url, cb) {
  if (ctx.req.url.indexOf(url) !== 0) return;
  ctx.res.writeHead(200, {
    'Content-Type': 'text/html',
    ...ctx.headers,
  });
  cb({}, ctx);
}
function methodGet(ctx, url, cb) {
  if (ctx.req.url.indexOf(url) !== 0) return;
  ctx.res.writeHead(200, {
    'Content-Type': 'application/json',
    ...ctx.headers,
  });
  cb(urlParse(ctx.req.url, true).query, ctx);
}
function methodPost(ctx, url, cb) {
  if (ctx.req.url.indexOf(url) !== 0) return;
  ctx.res.writeHead(200, {
    'Content-Type': 'application/json',
    ...ctx.headers,
  });
  ctx.res.on('data', chunk => {
    console.log('data..')
    cb(querystring.parse(chunk), ctx);
  });
}
function methodGraphql(ctx, url, schema, body) {
  if (ctx.req.url.indexOf(url) !== 0) return;
  ctx.res.writeHead(200, {
    'Content-Type': 'application/graphql',
    ...ctx.headers,
  });
  let data = urlParse(ctx.req.url, true);
  if (data.query) {
    graph(schema, JSON.stringify(data.query), body, res => {
      ctx.res.end(JSON.stringify(res));
    });
  } else {
    ctx.res.on('data', chunk => {
      graph(schema, chunk, body, res => {
        ctx.res.end(JSON.stringify(res));
      });
    });
  }
}
function methodStatic(ctx, dirPath, cb) {
  let absPath = dirPath + ctx.req.url;
  if (fileCache[absPath]) {
    ctx.res.writeHead(200, {
      'Content-Type': mime.getType(absPath),
      ...ctx.headers,
    });
    ctx.res.end(fileCache[absPath]);
  } else {
    fs.stat(absPath, (err, stats) => {
      if (err) {
        ctx.error();
      } else {
        let file = absPath;
        if (stats.isDirectory()) {
          file = file + 'index.html';
        }
        fs.readFile(file, (err, data) => {
          if (err) {
            ctx.error();
          } else {
            if (
              data.length > ctx.options.gzipMinSize &&
              data.length < ctx.options.gzipMaxSize &&
              (absPath.indexOf('.jpg') < 0 || absPath.indexOf('.png') < 0)
            ) {
              zlib.deflate(data, (err, buffer) => {
                if (err) {
                  ctx.error();
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
            if (data.length < ctx.options.gzipMaxSize) {
              fileCache[absPath] = data;
            }
            if (cb) {
              cb(data, ctx);
            }
            ctx.res.end(data);
          }
        });
      }
    });
  }
}

function methodError(ctx, statusCode = 404) {
  ctx.res.writeHead(statusCode, {
    'Content-Type': 'text/html',
    ...ctx.headers,
  });
  if (ctx.pages[statusCode] !== undefined) {
    ctx.res.end(`
        <script language="javascript">
        window.location = "${ctx.pages[statusCode]}";
      </script>
        `);
  } else {
    ctx.res.end(statusCode + '');
  }
}

module.exports = {
  methodGet,
  methodHtml,
  methodPost,
  methodError,
  methodStatic,
  methodGraphql,
};
