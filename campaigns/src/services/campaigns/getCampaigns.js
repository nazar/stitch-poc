const _ = require('lodash');

const Campaign = require('../../models/campaign');


module.exports = function({ filter }) {
  return _.tap(Campaign.query(), (query) => {
    const { name } = filter;

    name && query.where({ name });
  })
};
