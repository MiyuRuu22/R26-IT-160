const path = require('path');
const dotenv = require('../lawyer-backend/node_modules/dotenv');
const neo4j = require('../lawyer-backend/node_modules/neo4j-driver');

// The AI loaders deliberately share the backend configuration. Switching from
// local Neo4j to Aura is therefore a credentials change, not a code change.
dotenv.config({ path: path.resolve(__dirname, '../lawyer-backend/.env') });

const required = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing Neo4j configuration: ${missing.join(', ')}`);
}

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

const createSession = () => driver.session(
  process.env.NEO4J_DATABASE ? { database: process.env.NEO4J_DATABASE } : undefined
);

module.exports = { driver, createSession };
