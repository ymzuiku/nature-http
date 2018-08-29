const $n = require('../src');
const staticPath = $n.path.resolve(process.cwd(), './public');
$n.listen(4100, (req, res) => {
  $n.serverStatic(res, $n.path.resolve(staticPath, req.url));
});