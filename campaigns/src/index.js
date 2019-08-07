const { ApolloServer, gql, makeExecutableSchema } = require('apollo-server');
const { GraphQLDateTime } = require('graphql-iso-date');
const { Model } = require('objection');
const Bluebird = require('bluebird');

const createCampaign = require('./services/campaigns/createCampaign');
const deleteCampaign = require('./services/campaigns/deleteCampaign');
const updateCampaign = require('./services/campaigns/updateCampaign');
const getCampaigns = require('./services/campaigns/getCampaigns');

const { authTypeDefs, authResolvers } = require('./directives/auth');
const { emitCampaignUpdate, emitCampaignDelete } = require('./publisher');

const knex = require('./services/knex');

const loader = require('./loader');


Model.knex(knex);


const typeDefs = gql`
  type Query {
    # TODO - this might not work - see Campaign Required field Definitions in main README.md
    campaign(id: ID!): Campaign! @auth
    campaigns(filter: CampaignFilterInput): [Campaign]
  }
  
  type Mutation {
    createCampaign(input: MutateCampaignInput!): Campaign! @auth
    updateCampaign(id: ID!, input: MutateCampaignInput!): Campaign! @auth
    deleteCampaign(id: ID!): Campaign! @auth
  }

  scalar GraphQLDateTime
  
  type Campaign {
    id: ID!
    name: String!
    flightStartDate: GraphQLDateTime!
    flightEndDate: GraphQLDateTime!
    investment: Float!
  }
  
  input CampaignFilterInput {
    ids: [ID!]
    name: String
  }
  
  input MutateCampaignInput {
    name: String!
    flightStartDate: GraphQLDateTime!
    flightEndDate: GraphQLDateTime!
    investment: Float!
  }
`;

const resolvers = {
  Query: {
    campaign: async (obj, { id }, { loader }) => loader.campaignsById.load(id),
    campaigns: async (obj, { filter }) => getCampaigns({ filter })
  },
  Mutation: {
    createCampaign: async (obj, { input }) => Bluebird.resolve(createCampaign({ input })).tap(emitCampaignUpdate),
    updateCampaign: async (obj, { id, input }) => Bluebird.resolve(updateCampaign({ id, input })).tap(emitCampaignUpdate),
    deleteCampaign: async (obj, { id }) => Bluebird.resolve(deleteCampaign({ id })).tap(emitCampaignDelete)
  },
  GraphQLDateTime
};

const schema = makeExecutableSchema({
  typeDefs: [typeDefs, authTypeDefs],
  resolvers,
  directiveResolvers: authResolvers
});

const server = new ApolloServer({
  schema,
  context: ({ req }) => ({
    req,
    loader: loader()
  })
});

server.listen({ port: 3000 }).then(({ url }) => {
  console.log(`🚀 Campaigns server ready at ${url}`);
});
