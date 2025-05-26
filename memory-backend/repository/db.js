require("dotenv").config();
const { Pool } = require("pg");

const postgres = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function connectToDB() {
  try {
    const client = await postgres.connect();
    console.log("Successfully connected to PostgreSQL");
    client.release();
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err.message);
    throw err;
  }
}

module.exports = {
  postgres,
  connectToDB,
};
