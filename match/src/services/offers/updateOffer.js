const Offer = require('../../models/offer');


module.exports = function({ input }) {
  return Offer
    .query()
    .patch(input)
    .returning('*')
    .first();
};
