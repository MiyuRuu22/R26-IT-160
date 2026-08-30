/**
 * responseValidator.js
 * =====================
 * Validates and sanitizes AI Case Assistant outputs before sending them
 * to the mobile client.
 *
 * Checks for:
 * 1. Required fields (answer, sources, disclaimer, confidence)
 * 2. Strict anti-hallucination compliance
 * 3. Legitimate source references (cross-checked against the case context)
 * 4. Safety & advisory legal disclaimer enforcement
 */

const DEFAULT_DISCLAIMER = "Advisory decision-support only. Final legal strategies and statutory interpretations must be verified by a qualified legal professional.";

function validateAndSanitizeResponse(aiOutput, context) {
    if (!aiOutput || typeof aiOutput !== 'object') {
        return {
            answer: typeof aiOutput === 'string' && aiOutput.trim() 
                ? aiOutput.trim() 
                : "Unable to synthesize an answer from the available case information. Please rephrase or query a specific element of the case analysis.",
            sources: extractFallbackSources(context),
            disclaimer: DEFAULT_DISCLAIMER,
            confidence: null
        };
    }

    let answerText = (aiOutput.answer || '').trim();
    if (!answerText) {
        answerText = "The available case analysis does not contain sufficient details to reliably address this question. Please review the case facts and defense results.";
    }

    // Sanitize source references — cross-check against actual context
    const validSources = [];
    const rawSources = Array.isArray(aiOutput.sources) ? aiOutput.sources : [];

    for (const src of rawSources) {
        if (!src || !src.title) continue;

        const titleLower = src.title.toLowerCase();
        
        // Check against similar cases
        const matchedCase = context.similarCases?.find(c => 
            c.id.toLowerCase().includes(titleLower) || 
            c.parties.toLowerCase().includes(titleLower) ||
            titleLower.includes(c.id.toLowerCase())
        );

        if (matchedCase) {
            validSources.push({
                title: matchedCase.parties || matchedCase.id,
                type: 'case',
                id: matchedCase.id,
                similarity: matchedCase.similarity,
                relevance: src.relevance || 'Identified as a comparable precedent in case analysis.'
            });
            continue;
        }

        // Check against legal statutes
        const matchedLaw = context.legalReferences?.find(l => 
            titleLower.includes(l.act.toLowerCase()) || 
            (l.section && titleLower.includes(`section ${l.section}`))
        );

        if (matchedLaw) {
            validSources.push({
                title: `${matchedLaw.act} (Sec. ${matchedLaw.section})`,
                type: 'law',
                id: matchedLaw.act,
                similarity: null,
                relevance: src.relevance || 'Statutory authority relevant to current case facts.'
            });
            continue;
        }

        // Check against opponent argument
        const matchedOpp = context.opponentArguments?.find(op => 
            op.title.toLowerCase().includes(titleLower) || 
            titleLower.includes(op.title.toLowerCase())
        );

        if (matchedOpp) {
            validSources.push({
                title: matchedOpp.title,
                type: 'argument',
                id: matchedOpp.id,
                similarity: null,
                relevance: src.relevance || `Predicted opponent argument (${matchedOpp.priority} priority).`
            });
            continue;
        }

        // If explicitly generic or marked as case facts
        if (titleLower.includes('case facts') || titleLower.includes('defense') || titleLower.includes('evidence')) {
            validSources.push({
                title: src.title,
                type: src.type || 'evidence',
                id: src.id || 'case-record',
                similarity: null,
                relevance: src.relevance || 'Current case record.'
            });
        }
    }

    return {
        answer: answerText,
        sources: validSources,
        disclaimer: aiOutput.disclaimer || DEFAULT_DISCLAIMER,
        confidence: null // Do not invent an unverified confidence score
    };
}

function extractFallbackSources(context) {
    const sources = [];
    if (context.similarCases && context.similarCases.length > 0) {
        const topCase = context.similarCases[0];
        sources.push({
            title: topCase.parties || topCase.id,
            type: 'case',
            id: topCase.id,
            similarity: topCase.similarity,
            relevance: 'Top similar precedent in case records.'
        });
    }
    if (context.legalReferences && context.legalReferences.length > 0) {
        const topLaw = context.legalReferences[0];
        sources.push({
            title: `${topLaw.act} Sec. ${topLaw.section}`,
            type: 'law',
            id: topLaw.act,
            similarity: null,
            relevance: 'Applicable statutory framework.'
        });
    }
    return sources;
}

module.exports = {
    validateAndSanitizeResponse,
    DEFAULT_DISCLAIMER,
    extractFallbackSources
};

