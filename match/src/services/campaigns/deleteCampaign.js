const Campaign = require('../../models/campaign');


module.exports = function({ campaign }) {
  return Campaign
    .query()
    .delete()
    .where({ id: campaign.id })
    .returning('*')
    .first()
};
