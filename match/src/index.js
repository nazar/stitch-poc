const _ = require('lodash');
const Bluebird = require('bluebird');
const { ApolloServer, gql, makeExecutableSchema } = require('apollo-server');
const { GraphQLDateTime } = require('graphql-iso-date');
const { HttpLink } = require('apollo-link-http');
const fetch = require('node-fetch');
const { Model } = require('objection');
const {
  introspectSchema,
  makeRemoteExecutableSchema,
  mergeSchemas
} = require('graphql-tools');

const getCampaigns = require('./services/campaigns/getCampaigns');
const shadowCampaign = require('./services/campaigns/shadowCampaign');
const deleteCampaign = require('./services/campaigns/deleteCampaign');

const createOffer = require('./services/offers/createOffer');
const updateOffer = require('./services/offers/updateOffer');
const getCampaignOffers = require('./services/offers/getCampaignOffers');

const { authTypeDefs, authResolvers } = require('./directives/auth');

const Offer = require('./models/offer');
const getOffers = require('./services/offers/getOffers');
const knex = require('./services/knex');

const loader = require('./loader');

const messageConsumer = require('./consumer');

messageConsumer({
  onUpdate: async (campaign) => shadowCampaign({ campaign }),
  onDelete: async (campaign) => deleteCampaign({ campaign })
});


Model.knex(knex);

const typeDefs = gql`
  type Query { 
    offers: [Offer] 
  }
  
  type Mutation {
    createOffer(input: MutateOfferInput!): Offer!
    updateOffer(id: ID!, input: MutateOfferInput!): Offer!
  }

  scalar GraphQLDateTime
  
  type Offer {
    id: ID!
    campaignId: ID!
    name: String!
    closed: Boolean
  }
  
  input MutateOfferInput {
    name: String!
    campaignId: ID!
    closed: Boolean
  }  
`;

// extend the downstream Campaign microservice
const extendedSchemaForStitching = gql`
  extend type Offer {
    Campaign: Campaign!
  }

  extend type Campaign {
    Offers: [Campaign!]
  }
  
  extend input CampaignFilterInput {
    hasOffers: Boolean
  }
`;


const resolvers = {
  Query: {
    offers: async () => getOffers()
  },
  Mutation: {
    createOffer: async (obj, { input }) => createOffer({ input }),
    updateOffer: async (obj, { id, input }) => updateOffer({ id, input })
  },
  GraphQLDateTime
};

(async () => {
  const gatewayLink = new HttpLink({ uri: 'http://gateway:3000', fetch });
  const gatewayRemoteSchema = await introspectSchema(gatewayLink);

  const gatewaySchema = await makeRemoteExecutableSchema({
    schema: gatewayRemoteSchema,
    link: gatewayLink
  });

  const matchSchema = makeExecutableSchema({
    typeDefs: [typeDefs, authTypeDefs],
    resolvers,
    directiveResolvers: authResolvers
  });

// these are extended queries, types inputs that extend both Match and Campaign schemas
  const extendedResolvers = {
    Query: {
      campaigns: async (obj, { filter }, context, info) => {
        // delegate to getCampaigns ONLY IF filter.hasOffers is true
        if (filter.hasOffers) {
          return Bluebird.resolve(getCampaigns({ filter }))
            // technically we don't need a shadow table here as the campaign IDS can be
            // inferred from select distinct offers.campaignId
            // Keeping shadow table logic here for example
            .mapSeries((campaign) => campaign.id)
            .then(campaignIds => info.mergeInfo.delegateToSchema({
              schema: gatewaySchema,
              operation: 'query',
              fieldName: 'campaigns',
              args: {
                filter: {
                  ids: campaignIds,
                  name: filter.name
                }
              },
              context,
              info
            }))
        } else {
          return info.mergeInfo.delegateToSchema({
            schema: gatewaySchema,
            operation: 'query',
            fieldName: 'campaigns',
            args: {
              filter: {
                name: filter.name
              }
            },
            context,
            info
          })
        }
      }
    },
    Campaign: {
      Offers: (campaign) => getCampaignOffers({ campaign }) // this should use dataLoader but keeping it simple here
    },
    Offer: {
      Campaign: (offer, vars, context, info) => info.mergeInfo.delegateToSchema({
        schema: gatewaySchema,
        operation: 'query',
        fieldName: 'campaign',
        args: {
          id: offer.campaignId
        },
        context,
        info
      })
    }
  };

  const schema = mergeSchemas({
    schemas: [
      matchSchema,
      gatewaySchema,
      extendedSchemaForStitching
    ],
    resolvers: extendedResolvers
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
      req,
      loader: loader()
    })
  });

  server.listen({ port: 3000 }).then(({ url }) => {
    console.log(`🚀 Match server ready at ${url}`);
  });
})();

