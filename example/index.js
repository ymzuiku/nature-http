const nature = require('../src');
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
