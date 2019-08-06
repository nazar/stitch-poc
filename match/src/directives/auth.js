const _ = require('lodash');
const { ForbiddenError } = require('apollo-server');

const logger = require('../services/logger');

module.exports.authTypeDefs = `
  directive @auth on QUERY | FIELD_DEFINITION
`;

module.exports.authResolvers = {
  auth: (next) => {
    logger.info('I haz authz!');
    return next();
  }

};
