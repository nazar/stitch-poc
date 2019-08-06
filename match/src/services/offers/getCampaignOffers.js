const Offer = require('../../models/offer');


module.exports = function({ campaign }) {
  return Offer
    .query()
    .where({ campaignId: campaign.id });
};
