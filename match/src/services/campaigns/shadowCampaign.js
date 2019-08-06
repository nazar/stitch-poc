const _ = require('lodash');

const Campaign = require('../../models/campaign');


module.exports = function({ campaign }) {
  const payload = _.pick(campaign, ['id', 'name']);

  return Campaign
    .query()
    .upsertGraph(payload, { insertMissing: true })
    .returning('*')
    .first()
};
