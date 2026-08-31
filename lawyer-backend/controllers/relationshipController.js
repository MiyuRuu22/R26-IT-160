const driver = require("../config/neo4j");

// ================= CONFLICT DETECTION =================

const getConflicts = async (req, res) => {

    const session = driver.createSession();

    try {

        const result = await session.run(`
        
        MATCH (c1:Client)-[:WORKS_FOR]->(o:Organization)<-[:WORKS_FOR]-(c2:Client)

        WHERE c1 <> c2

        RETURN
        c1.name AS Client1,
        c2.name AS Client2,
        o.name AS SharedOrganization,
        "HIGH RISK" AS Risk
        
        `);

        const conflicts = result.records.map(record => ({
            client1: record.get("Client1"),
            client2: record.get("Client2"),
            organization: record.get("SharedOrganization"),
            risk: record.get("Risk")
        }));

        res.json(conflicts);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        await session.close();
    }
};

// ================= CLIENT CONNECTION ANALYZER =================

const getClientConnections = async (req, res) => {

    const session = driver.createSession();

    const { clientId } = req.params;

    try {

        const result = await session.run(

            `
            MATCH path = (c:Client {clientId: $clientId})-[*1..4]-(connected)

            RETURN path
            LIMIT 20
            `,
            { clientId }

        );

        const explainedPaths = result.records.map(record => {

            const path = record.get("path");

            const segments = [];

            for (let i = 0; i < path.segments.length; i++) {

                const segment = path.segments[i];

                const startNode =
                    segment.start.properties.name ||
                    segment.start.properties.title ||
                    segment.start.properties.clientId;

                const relationship =
                    segment.relationship.type;

                const endNode =
                    segment.end.properties.name ||
                    segment.end.properties.title ||
                    segment.end.properties.clientId;

                segments.push({
                    from: startNode,
                    relationship,
                    to: endNode
                });
            }

            return {
                pathLength: path.length,
                explanation: segments
            };
        });

        res.json(explainedPaths);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        await session.close();
    }
};

// ================= RISK ANALYSIS =================

const getRiskAnalysis = async (req, res) => {

    const session = driver.createSession();

    const { clientId } = req.params;

    try {

        const result = await session.run(

            `
            MATCH path = (c:Client {clientId: $clientId})-[*1..5]-(connected)

            RETURN path
            LIMIT 30
            `,
            { clientId }

        );

        const analysis = result.records.map(record => {

            const path = record.get("path");

            const segments = [];

            for (let i = 0; i < path.segments.length; i++) {

                const segment = path.segments[i];

                const startNode =
                    segment.start.properties.name ||
                    segment.start.properties.title ||
                    segment.start.properties.clientId;

                const relationship =
                    segment.relationship.type;

                const endNode =
                    segment.end.properties.name ||
                    segment.end.properties.title ||
                    segment.end.properties.clientId;

                segments.push({
                    from: startNode,
                    relationship,
                    to: endNode
                });
            }

            let riskLevel = "LOW";

            if (path.length <= 2) {

                riskLevel = "HIGH";
            }

            else if (path.length <= 4) {

                riskLevel = "MEDIUM";
            }

            return {

                riskLevel,

                pathLength: path.length,

                alert:
                    `Potential ${riskLevel} risk connection detected for client ${clientId}`,

                explanation: segments
            };
        });

        res.json(analysis);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        await session.close();
    }
};

// ================= GRAPH DATA =================

const getGraphData = async (req, res) => {

    const session = driver.createSession();

    try {

        const { entityType, searchValue } = req.params;
        const allowedTypes = ["Person", "Organization", "Case"];
        const requestedDepth = Number.parseInt(req.query.depth, 10);
        const depth = Number.isInteger(requestedDepth)
            ? Math.min(Math.max(requestedDepth, 1), 4)
            : 3;

        if (!allowedTypes.includes(entityType)) {
            return res.status(400).json({ error: "Unsupported entity type" });
        }

        // Return a bounded neighbourhood, not only the first adjacent node.
        // This makes indirect links visible while keeping searches responsive.
        const result = await session.run(`
            MATCH (start)
            WHERE $entityType IN labels(start)
              AND (
                (start.name IS NOT NULL AND toLower(start.name) CONTAINS toLower($searchValue))
                OR
                (start.case_number IS NOT NULL AND toLower(start.case_number) CONTAINS toLower($searchValue))
              )
            MATCH path = (start)-[*1..${depth}]-(connected)
            RETURN path
            LIMIT 80
        `, { entityType, searchValue });

        const nodes = [];
        let edges = [];

        const addedNodes = new Set();
        const addedEdges = new Set();
        const distanceByNode = new Map();

        const relationshipRisk = (type) => ({
            PARTNER_OF: 90,
            // Employment and procedural participation identify context, not
            // a conflict by themselves. Keep their visual weight restrained.
            EMPLOYED_BY: 20,
            PETITIONER_IN: 35,
            RESPONDENT_IN: 35,
            APPELLANT_IN: 35,
            DEFENDANT_IN: 35,
            INDICTED_IN: 50
        }[type] || 20);

        const riskLevel = (score) => {
            if (score >= 90) return "CRITICAL";
            if (score >= 70) return "HIGH";
            if (score >= 40) return "MEDIUM";
            return "LOW";
        };

        result.records.forEach((record) => {

            const path = record.get("path");

            const pathNodes = [
                path.start,
                ...path.segments.map((segment) => segment.end)
            ];

            pathNodes.forEach((node, index) => {

                if (
                    !node ||
                    addedNodes.has(node.elementId)
                ) {
                    return;
                }

                addedNodes.add(node.elementId);

                const hops = index;
                const existingDistance = distanceByNode.get(node.elementId);
                const distance = existingDistance === undefined
                    ? hops
                    : Math.min(existingDistance, hops);
                distanceByNode.set(node.elementId, distance);

                nodes.push({

                    id: node.elementId,

                    label:
                        node.properties.name ||
                        node.properties.case_number,

                    type: node.labels[0],

                    properties: node.properties,
                    distance
                });
            });

            path.segments.forEach((segment, index) => {
                const relationship = segment.relationship;
                const edgeId = relationship.elementId;

                if (addedEdges.has(edgeId)) return;
                addedEdges.add(edgeId);

                // Longer, indirect paths receive an additional risk premium.
                const score = Math.min(100, relationshipRisk(relationship.type) + index * 10);
                edges.push({
                    id: edgeId,
                    source: relationship.startNodeElementId,
                    target: relationship.endNodeElementId,
                    label: relationship.type,
                    hops: index + 1,
                    riskScore: score,
                    riskLevel: riskLevel(score)
                });
            });
        });

        // Banks are useful context for a searched person, but expanding every
        // employee of a shared bank makes a focused investigation misleading.
        // Keep that hub expansion for the intentional Extended (3+ hop) view.
        if (depth < 3) {
            const bankNodeIds = new Set(
                nodes
                    .filter((node) => node.type === "Organization" && /\b(bank|banking)\b/i.test(node.label || ""))
                    .map((node) => node.id)
            );
            const rootId = nodes[0]?.id;
            edges = edges.filter((edge) => {
                const isEmploymentEdge = edge.label === "EMPLOYED_BY";
                const touchesBank = bankNodeIds.has(edge.source) || bankNodeIds.has(edge.target);
                const touchesRoot = edge.source === rootId || edge.target === rootId;
                return !(isEmploymentEdge && touchesBank && !touchesRoot);
            });

            const connectedNodeIds = new Set([rootId]);
            edges.forEach((edge) => {
                connectedNodeIds.add(edge.source);
                connectedNodeIds.add(edge.target);
            });
            for (let index = nodes.length - 1; index >= 0; index -= 1) {
                if (!connectedNodeIds.has(nodes[index].id)) nodes.splice(index, 1);
            }
        }

        nodes.forEach((node) => {
            const incidentRisk = edges
                .filter((edge) => edge.source === node.id || edge.target === node.id)
                .reduce((highest, edge) => Math.max(highest, edge.riskScore), 0);
            node.riskScore = incidentRisk;
            node.riskLevel = riskLevel(incidentRisk);
        });

        res.json({
            nodes,
            edges,
            search: { entityType, searchValue, depth }
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        await session.close();
    }
};

// ================= ALERTS =================

const getAlerts = async (req, res) => {

    const session = driver.createSession();

    const { search } = req.query;

    try {

        const result = await session.run(

        `
        MATCH (a)-[r]->(b)

        WHERE

        (
            $search = ""

            OR

            (
                a.name IS NOT NULL
                AND
                toLower(a.name)
                CONTAINS toLower($search)
            )

            OR

            (
                b.name IS NOT NULL
                AND
                toLower(b.name)
                CONTAINS toLower($search)
            )
        )

        RETURN
        a.name AS source,
        type(r) AS relationship,
        b.name AS target

        LIMIT 100
        `,
        {
            search: search || ""
        }

        );

        const alerts = result.records.map(record => {

            const relationship =
                record.get("relationship");

            let riskScore = 20;

            let riskLevel = "LOW";

            // =========================
            // RISK SCORING
            // =========================

            if (relationship === "PARTNER_OF") {

                riskScore = 90;
                riskLevel = "CRITICAL";
            }

            else if (relationship === "EMPLOYED_BY") {

                riskScore = 70;
                riskLevel = "HIGH";
            }

            else if (relationship === "PETITIONER_IN") {

                riskScore = 50;
                riskLevel = "MEDIUM";
            }

            else if (relationship === "RESPONDENT_IN") {

                riskScore = 50;
                riskLevel = "MEDIUM";
            }

            return {

                title:
                    `${relationship} Relationship Detected`,

                description:
                    `${record.get("source")}
                     is connected to
                     ${record.get("target")}
                     through
                     ${relationship}`,

                relationship,

                riskScore,

                risk: riskLevel
            };
        });

        res.json(alerts);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        await session.close();
    }
};

// ================= SHORTEST PATH =================

const getShortestPath = async (req, res) => {

    const session = driver.createSession();

    try {

        const {
            entity1,
            entity2
        } = req.query;

        const result = await session.run(`

        MATCH (start),
              (end)

        WHERE
        (
            start.name = $entity1 OR
            start.case_number = $entity1
        )

        AND

        (
            end.name = $entity2 OR
            end.case_number = $entity2
        )

        MATCH path =
        shortestPath((start)-[*..6]-(end))

        RETURN path

        `,
        {
            entity1,
            entity2
        });

        if (result.records.length === 0) {

            return res.json({
                nodes: [],
                edges: []
            });
        }

        const path =
            result.records[0].get("path");

        const nodes = [];
        const edges = [];

        const addedNodes = new Set();

        path.segments.forEach((segment) => {

            const start = segment.start;
            const end = segment.end;
            const relationship =
                segment.relationship;

            if (!addedNodes.has(start.elementId)) {

                addedNodes.add(start.elementId);

                nodes.push({

                    id: start.elementId,

                    label:
                        start.properties.name ||
                        start.properties.case_number,

                    type: start.labels[0]
                });
            }

            if (!addedNodes.has(end.elementId)) {

                addedNodes.add(end.elementId);

                nodes.push({

                    id: end.elementId,

                    label:
                        end.properties.name ||
                        end.properties.case_number,

                    type: end.labels[0]
                });
            }

            edges.push({

                source: start.elementId,
                target: end.elementId,

                label: relationship.type
            });
        });

        res.json({
            nodes,
            edges
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        await session.close();
    }
};

const getRiskPropagation = async (req, res) => {

    const session = driver.createSession();

    try {

        const { name } = req.params;

        const result = await session.run(

        `
        MATCH path =
        (start)-[*1..4]-(connected)

        WHERE
        start.name = $name

        RETURN path

        LIMIT 20
        `,
        {
            name
        }

        );

        const risks = result.records.map(record => {

            const path = record.get("path");

            const segments = [];

            let totalRisk = 0;

            path.segments.forEach((segment, index) => {

                const relationship =
                    segment.relationship.type;

                let risk = 10;

                if (relationship === "PARTNER_OF") {

                    risk = 90;
                }

                else if (relationship === "EMPLOYED_BY") {

                    risk = 70;
                }

                else if (relationship === "PETITIONER_IN") {

                    risk = 50;
                }

                else if (relationship === "RESPONDENT_IN") {

                    risk = 50;
                }

                // An indirect connection is more significant than the same
                // relationship directly connected to the searched entity.
                risk += index * 10;
                totalRisk += risk;

                segments.push({

                    from:
                        segment.start.properties.name ||
                        segment.start.properties.case_number,

                    relationship,

                    to:
                        segment.end.properties.name ||
                        segment.end.properties.case_number,

                    risk
                });
            });

            let level = "LOW";

            if (totalRisk >= 150) {

                level = "CRITICAL";
            }

            else if (totalRisk >= 100) {

                level = "HIGH";
            }

            else if (totalRisk >= 50) {

                level = "MEDIUM";
            }

            return {

                totalRisk,

                level,

                explanation: segments
            };
        });

        res.json(risks);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        await session.close();
    }
};

// ================= WHOLE NETWORK VIEW =================

const getNetworkData = async (req, res) => {
    const session = driver.createSession();

    try {
        const parsedNodeLimit = Number.parseInt(req.query.nodeLimit, 10);
        const parsedEdgeLimit = Number.parseInt(req.query.edgeLimit, 10);
        const nodeLimit = Number.isInteger(parsedNodeLimit) ? Math.min(Math.max(parsedNodeLimit, 1), 120) : 120;
        const edgeLimit = Number.isInteger(parsedEdgeLimit) ? Math.min(Math.max(parsedEdgeLimit, 1), 180) : 180;

        // All entities are retained for this bounded overview. Connected
        // entities are ordered first so the visual centre is meaningful.
        const nodeResult = await session.run(`
            MATCH (node)
            OPTIONAL MATCH (node)-[relationship]-()
            WITH node, count(relationship) AS degree
            RETURN node
            ORDER BY degree DESC, coalesce(node.name, node.case_number, '') ASC
            LIMIT ${nodeLimit}
        `);

        const nodes = nodeResult.records.map((record) => {
            const node = record.get("node");
            return {
                id: node.elementId,
                label: node.properties.name || node.properties.case_number || node.elementId,
                type: node.labels[0] || "Entity",
                properties: node.properties,
                distance: 0,
                riskScore: 0,
                riskLevel: "LOW"
            };
        });
        const nodeIds = nodes.map((node) => node.id);
        const edgeResult = nodeIds.length
            ? await session.run(`
                MATCH (source)-[relationship]-(target)
                WHERE elementId(source) IN $nodeIds AND elementId(target) IN $nodeIds
                WITH CASE WHEN elementId(source) < elementId(target) THEN source ELSE target END AS sourceNode,
                     CASE WHEN elementId(source) < elementId(target) THEN target ELSE source END AS targetNode,
                     type(relationship) AS relationshipType,
                     min(elementId(relationship)) AS relationshipId
                RETURN sourceNode AS source, targetNode AS target, relationshipType, relationshipId
                ORDER BY relationshipType ASC
                LIMIT ${edgeLimit}
            `, { nodeIds })
            : { records: [] };

        const relationshipRisk = (type) => ({
            PARTNER_OF: 90, EMPLOYED_BY: 20, PETITIONER_IN: 35,
            RESPONDENT_IN: 35, APPELLANT_IN: 35, DEFENDANT_IN: 35, INDICTED_IN: 50
        }[type] || 20);
        const riskLevel = (score) => score >= 90 ? "CRITICAL" : score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
        const edges = edgeResult.records.map((record) => {
            const label = record.get("relationshipType");
            const riskScore = relationshipRisk(label);
            return {
                id: record.get("relationshipId"),
                source: record.get("source").elementId,
                target: record.get("target").elementId,
                label,
                hops: 1,
                riskScore,
                riskLevel: riskLevel(riskScore)
            };
        });

        nodes.forEach((node) => {
            const highestRisk = edges
                .filter((edge) => edge.source === node.id || edge.target === node.id)
                .reduce((highest, edge) => Math.max(highest, edge.riskScore), 0);
            node.riskScore = highestRisk;
            node.riskLevel = riskLevel(highestRisk);
        });

        res.json({ nodes, edges, network: { nodeLimit, edgeLimit } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
};

module.exports = {
    getConflicts,
    getClientConnections,
    getRiskAnalysis,
    getGraphData,
    getNetworkData,
    getAlerts,
    getShortestPath,
    getRiskPropagation
};
