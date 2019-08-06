const NRP = require('node-redis-pubsub');

const nrp = new NRP({
  host: 'redis',
  scope: 'aa-microservices'
});

module.exports.emitCampaignUpdate = function(campaign) {
  nrp.emit('campaign:update', campaign)
};

module.exports.emitCampaignDelete = function(campaign) {
  nrp.emit('campaign:delete', campaign)
};
