const neo4j = require("neo4j-driver");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD)
);

// Aura normally uses the `neo4j` database, but keeping this in one place lets
// an integrator select a database without changing every controller.
driver.createSession = () => driver.session(
  process.env.NEO4J_DATABASE ? { database: process.env.NEO4J_DATABASE } : undefined
);

module.exports = driver;
