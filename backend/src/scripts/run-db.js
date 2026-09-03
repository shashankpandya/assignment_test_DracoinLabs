const EmbeddedPostgresModule = require('embedded-postgres');
const EmbeddedPostgres = EmbeddedPostgresModule.default || EmbeddedPostgresModule;
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const dataDir = path.resolve(__dirname, '../../.pgdata');
  console.log(`Using database directory: ${dataDir}`);

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    persistent: true,
  });

  if (!fs.existsSync(dataDir)) {
    console.log('Initialising PostgreSQL cluster...');
    await pg.initialise();
  }

  console.log('Starting PostgreSQL server on port 5432...');
  await pg.start();
  console.log('PostgreSQL started successfully.');

  // Create school_mgmt database if it does not exist
  const adminClient = new Client({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
  });
  await adminClient.connect();

  const dbRes = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'school_mgmt'");
  if (dbRes.rows.length === 0) {
    console.log("Database 'school_mgmt' does not exist. Creating...");
    await adminClient.query('CREATE DATABASE school_mgmt');
    console.log("Database 'school_mgmt' created.");
  } else {
    console.log("Database 'school_mgmt' already exists.");
  }
  await adminClient.end();

  // Check if tables exist in school_mgmt
  const appClient = new Client({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'school_mgmt',
  });
  await appClient.connect();

  const tableRes = await appClient.query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");
  if (tableRes.rows.length === 0) {
    console.log('Seeding database tables and data...');
    const tablesSqlPath = path.resolve(__dirname, '../../../seed_db/tables.sql');
    const seedSqlPath = path.resolve(__dirname, '../../../seed_db/seed-db.sql');

    const tablesSql = fs.readFileSync(tablesSqlPath, 'utf-8');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf-8');

    console.log('Executing tables.sql...');
    await appClient.query(tablesSql);
    console.log('Executing seed-db.sql...');
    await appClient.query(seedSql);
    console.log('Database seeded successfully!');
  } else {
    console.log('Database already has tables initialized.');
  }
  await appClient.end();

  console.log('PostgreSQL is running and ready for connections on port 5432.');

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Failed to run PostgreSQL:', err);
  process.exit(1);
});
