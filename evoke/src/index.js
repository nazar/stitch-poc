const messageConsumer = require('./consumer');


messageConsumer({
  onUpdate: async (c) => console.log('Updating', c),
  onDelete: async (c) => console.log('Deleting', c),
});


