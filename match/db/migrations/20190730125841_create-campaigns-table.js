exports.up = function(knex) {
  return knex.schema.createTable('campaigns', (table) => {
    // this id columns isn't an auto-increment field in match-db and is campaigns.id instead
    table.integer('id').unique();

    // shadow name to enable searching when BOTH name AND hasOrders are selected
    table.string('name');

    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('campaigns');
};
