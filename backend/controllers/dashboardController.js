const { formatResponse } = require('../utils/helper');

const getDashboardStats = async (req, res) => {
    try {
        const stats = {
            activeCases: 14,
            riskAlerts: 2,
            winProbability: "87%",
            draftsCreated: 31,
            recentAnalyses: [
                { id: 1, title: "TechCorp IP Dispute", similarity: "92%", matchLevel: "High Match" },
                { id: 2, title: "State v. Anderson", similarity: "85%", matchLevel: "High Match" },
                { id: 3, title: "Smith Estate Claim", similarity: "42%", matchLevel: "Low Match" }
            ]
        };
        res.status(200).json(formatResponse(stats));
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error fetching dashboard stats' });
    }
};

module.exports = { getDashboardStats };
