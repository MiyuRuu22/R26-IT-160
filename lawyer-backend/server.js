const express = require("express");
const cors = require("cors");
require("dotenv").config();

const relationshipRoutes = require("./routes/relationshipRoutes");
const driver = require("./config/neo4j");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", relationshipRoutes);

app.get("/api/health", async (req, res) => {
    const session = driver.createSession();
    try {
        await session.run("RETURN 1 AS connected");
        res.json({ status: "ok", database: process.env.NEO4J_DATABASE || "neo4j" });
    } catch (error) {
        res.status(503).json({ status: "unavailable", error: error.message });
    } finally {
        await session.close();
    }
});

app.get("/", (req, res) => {
    res.send("Lawyer Companion Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
