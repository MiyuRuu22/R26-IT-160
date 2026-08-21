const { formatResponse } = require('../utils/helper');

const assessRisk = async (req, res) => {
    try {
        const riskData = {
            score: 78,
            level: "HIGH RISK",
            indicators: [
                {
                    title: "Financial Inconsistencies",
                    description: "NLP extracted metadata shows 3 discrepancies in offshore holdings.",
                    type: "critical"
                },
                {
                    title: "Historical Litigation",
                    description: "Client has been involved in 4 similar cases in the past 5 years.",
                    type: "warning"
                },
                {
                    title: "Explainable AI Check",
                    description: "Score driven by semantic analysis of public financial records.",
                    type: "info"
                }
            ]
        };
        res.status(200).json(formatResponse(riskData));
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error assessing risk' });
    }
};

module.exports = { assessRisk };
