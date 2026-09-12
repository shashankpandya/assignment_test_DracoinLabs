const { Pool } = require("pg");
const { env } = require("./env");

const db = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

module.exports = { db };
