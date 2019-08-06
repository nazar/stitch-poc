const RedisSMQ = require("rsmq");


const rsmq = new RedisSMQ( {host: "redis", ns: "aa-microservices"} );

const MAX_MINUTES = 10;
const queueName = 'campaigns';

const intervals = [
  1000,
  2000,
  5000,
  10000,
  20000,
  50000
];

let intervalIdx = 0;

let processed = {};

module.exports = function start(onMessage) {

  messageProcessor();

  ///

  function messageProcessor() {
    setTimeout(() => {
      rsmq.receiveMessage({ qname: queueName, vt: 0 }, (err, res) => {
        console.log('err      ', JSON.stringify(err      , null, 2))
        console.log('res', JSON.stringify(res, null, 2))

        console.log('processed', processed)

        if (isValidMessageResponse(res)) {
          intervalIdx = 0;
          onMessage(JSON.parse(res.message));
          processed[res.id] = (processed[res.id] || 0) + 1;
        } else if (intervalIdx < (intervals.length - 1)) {
          intervalIdx++;
          pruneMessage(res);
        }

        messageProcessor();
      });
    }, intervals[intervalIdx]);
  }

};

function isValidMessageResponse(res) {
  const hasId = res.id;
  const notProcessed = hasId && (processed[res.id] || 0) === 0;

  return hasId && notProcessed;
}

function pruneMessage(res) {
  if (res.rc) { //res.rc number of timees received
    const minutesAgo = ((Date.now() - res.sent) / 1000) / 60;

    if (minutesAgo > MAX_MINUTES) {
      console.log('deleting message', res.id)
      return rsmq.deleteMessageAsync({ qname: queueName, id: res.id })
    }
  }
}
