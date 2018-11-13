# nature

一个非常自然的 web 框架

没有任何黑魔法，源码仅有 250 行，纯粹的 nodejs 原生 http 库，为了性能没有使用 async。

## 使用例子

```js
const nature = require('nature-http');
const staticPath = nature.resolve(process.cwd(), './example/public/');

// nature.pages['404'] = '/api/test?bbb=222';

const schema = `
  type Query {
      hello: String
  }
`;

nature.listenThreads(4100, ctx => {
  ctx.get('/api/get', data => {
    ctx.res.end(JSON.stringify(data));
  });
  ctx.post('/api/post', data => {
    console.log(data);
    ctx.res.end(JSON.stringify(data));
  });
  ctx.graph('/graphql', schema, {
    hello: () => 'hello, graphql',
  });
  ctx.static(nature.resolve(staticPath));
});
```
