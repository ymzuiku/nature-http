const { graphql, buildSchema } = require('graphql');

// const schema = buildSchema(`
//     type Query {
//         hello: String
//     }
// `);

// const root = { hello: () => 'hello world!' };

// graphql(schema, '{hello}', root).then(res => {
//   console.log(res);
// });

function graph(schema, req, body, cb) {
  graphql(buildSchema(schema), req, body).then(res => {
    cb(res);
  });
}

module.exports = graph;
