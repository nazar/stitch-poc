const NRP = require('node-redis-pubsub');

const nrp = new NRP({
  host: 'redis',
  scope: 'aa-microservices'
});

module.exports = function start({ onUpdate, onDelete }) {
  nrp.on('campaign:update', (data) => {
    onUpdate(data)
  });

  nrp.on('campaign:delete', (data) => {
    onDelete(data)
  });
};
