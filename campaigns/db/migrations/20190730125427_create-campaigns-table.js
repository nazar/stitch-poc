exports.up = function(knex) {
  return knex.schema.createTable('campaigns', (table) => {
    table.increments().primary();

    table.string('name').notNullable();
    table.date('flight_start_date').notNullable();
    table.date('flight_end_date').notNullable();
    table.float('investment').notNullable();
    table.string('ws_number');
    table.string('datorama_campaign_name');
    table.boolean('user_share').defaultTo(false);

    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('campaigns');
};
