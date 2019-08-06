const Offer = require('../../models/offer');


module.exports = function() {
  return Offer
    .query();
};
