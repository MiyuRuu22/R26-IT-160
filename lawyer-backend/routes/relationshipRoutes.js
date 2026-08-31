const express = require("express");

const {
    getConflicts,
    getClientConnections,
    getRiskAnalysis,
    getGraphData,
    getNetworkData,
    getAlerts,
    getShortestPath,
    getRiskPropagation
} = require("../controllers/relationshipController");

const router = express.Router();

router.get("/conflicts", getConflicts);

router.get(
    "/client-connections/:clientId",
    getClientConnections
);

router.get(
    "/risk-analysis/:clientId",
    getRiskAnalysis
);

router.get(
    "/graph/:entityType/:searchValue",
    getGraphData
);

router.get("/network", getNetworkData);

router.get(
    "/alerts",
    getAlerts
);

router.get(
    "/shortest-path",
    getShortestPath
);

router.get(
    "/risk-propagation/:name",
    getRiskPropagation
);

module.exports = router;
