const { queryAIEngine } = require('../services/pythonService');
const { formatResponse, formatError } = require('../utils/helper');

/**
 * @desc    Process a legal query and search for similar cases via AI
 * @route   POST /api/cases/search
 */
const searchCases = async (req, res) => {
    try {
        const { query, case_type, outcome, year } = req.body;

        if (!query) {
            return res.status(400).json(formatError('Legal case description (query) is required.'));
        }

        console.log(`[AI Search Initiated]: Query received -> "${query}"`);

        // Execute API call to AI Engine
        const aiResult = await queryAIEngine(query, { case_type, outcome, year });

        // aiResult structure: { status: "success", matches: [ ... ] }
        if (aiResult.status !== "success" || !aiResult.matches) {
            throw new Error("Invalid response format from AI Engine");
        }

        // Generate a combined strategy from the top match (if any)
        const topMatch = aiResult.matches[0];
        const recommendedStrategy = topMatch ? topMatch.recommendation.strategy : "No similar precedents found. Analyze case specifics thoroughly.";

        // Map the results back to a clean frontend-ready structure
        const formattedResults = {
            status: "success",
            recommendedStrategy: recommendedStrategy,
            precedents: aiResult.matches.map(match => ({
                title: match.case_name,
                summary: match.summary,
                outcome: match.outcome,
                match: match.similarity_percentage,
                reasons: match.recommendation.reasons
            }))
        };

        console.log(`[AI Search Complete]: Returned ${aiResult.matches.length} similar cases.`);
        res.status(200).json(formattedResults);

    } catch (error) {
        console.error(`[AI Search Error]:`, error.message);
        res.status(500).json(formatError('Failed to process AI search. Make sure the AI Engine FastAPI server is running.'));
    }
};

module.exports = { searchCases };
