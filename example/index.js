const nature = require('../src');
const staticPath = nature.resolve(process.cwd(), './example/public');

nature.pages['404'] = '/api/test?bbb=222';

nature.listenThreads(4100, ctx => {
  ctx.get('/api/test', data => {
    ctx.res.end(JSON.stringify(data));
  });
  ctx.static(nature.resolve(staticPath));
});
