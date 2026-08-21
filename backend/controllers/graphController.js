const { formatResponse } = require('../utils/helper');

const getRelationships = async (req, res) => {
    try {
        const graphData = {
            nodes: [
                { id: "1", label: "Firm A", type: "firm" },
                { id: "2", label: "Client X", type: "client" },
                { id: "3", label: "Defendant", type: "defendant" }
            ],
            edges: [
                { source: "3", target: "1", label: "Affiliated (2018)" },
                { source: "2", target: "1", label: "Litigation" }
            ],
            conflicts: [
                "The Defendant was previously affiliated with Firm A during the 2018 merger. Client X has ongoing litigation with Firm A's subsidiaries."
            ]
        };
        res.status(200).json(formatResponse(graphData));
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error fetching relationships' });
    }
};

module.exports = { getRelationships };
