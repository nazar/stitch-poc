const Offer = require('../../models/offer');


module.exports = function({ input }) {
  // create the offer
  return Offer
    .query()
    .insert(input)
    .returning('*')
    .first();
};
