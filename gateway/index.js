const _ = require('lodash');
const { ApolloServer, gql, makeExecutableSchema } = require('apollo-server');
const { GraphQLDateTime } = require('graphql-iso-date');
const { HttpLink } = require('apollo-link-http');
const fetch = require('node-fetch');
const {
  introspectSchema,
  makeRemoteExecutableSchema,
  mergeSchemas
} = require('graphql-tools');


(async () => {
  const campaignsLink = new HttpLink({ uri: 'http://campaigns:3000', fetch });
  const campaignsRemoteSchema = await introspectSchema(campaignsLink);

  const campaignsSchema = await makeRemoteExecutableSchema({
    schema: campaignsRemoteSchema,
    link: campaignsLink
  });

    // https://www.apollographql.com/docs/graphql-tools/schema-stitching/
  const schema = mergeSchemas({
    schemas: [
      campaignsSchema,
      //advertisersSchema
    ]
  });

  const server = new ApolloServer({
    schema
  });

  server.listen({ port: 3000 }).then(({ url }) => {
    console.log(`🚀 Gateway server ready at ${url}`);
  });
})();


