/**
 * caseChatController.js
 * =====================
 * Controller handling authenticated Case Assistant Chatbot interactions,
 * case-level authorization, conversation persistence, and AI response orchestration.
 */

const { conversationStore } = require('../models/CaseConversation');
const { buildStructuredCaseContext } = require('../services/caseContextBuilder');
const { generateCaseResponse } = require('../services/aiService');
const { validateAndSanitizeResponse } = require('../services/responseValidator');
const { formatResponse, formatError } = require('../utils/helper');

/**
 * POST /api/cases/:caseId/chat or POST /api/cases/chat
 * Primary endpoint for querying the Case Assistant.
 */
const handleCaseChat = async (req, res) => {
    try {
        const caseId = req.params.caseId || req.body.caseId || 'active-case';
        const { message, conversationId, conversationHistory = [], caseContext = {} } = req.body;
        const userId = req.user?._id || 'mock-user-1';

        // 1. Validation
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json(formatError('Message is required and cannot be empty.'));
        }

        const trimmedMessage = message.trim();
        const activeConversationId = conversationId || `conv-${caseId}-${userId}`;

        // 2. Case-Level Authorization Check
        let existingConversation = await conversationStore.getById(activeConversationId);
        if (existingConversation) {
            // Ensure the authenticated user owns this conversation
            if (existingConversation.userId && existingConversation.userId !== userId) {
                return res.status(403).json(formatError('Access denied: Unauthorized access to this case conversation.'));
            }
        }

        // 3. Build & Sanitize Case Context
        // Prefer stored context if present, otherwise merge with client-supplied context
        const mergedRawContext = {
            caseId,
            ...(existingConversation?.caseContext || {}),
            ...caseContext
        };

        const structuredContext = buildStructuredCaseContext(mergedRawContext, trimmedMessage);

        // 4. Determine conversation history (prefer stored or validated client history)
        const activeHistory = (existingConversation?.messages || conversationHistory || []).slice(-15);

        // 5. Generate AI Response via Abstraction Layer
        const rawAiResult = await generateCaseResponse({
            caseContext: structuredContext,
            conversationHistory: activeHistory,
            message: trimmedMessage
        });

        // 6. Validate & Sanitize Response (Anti-hallucination & Schema Validation)
        const validatedResponse = validateAndSanitizeResponse(rawAiResult, structuredContext);

        // 7. Construct and Append Messages
        const timestamp = new Date();
        const userMsg = {
            id: `msg-${Date.now()}-u`,
            sender: 'user',
            text: trimmedMessage,
            timestamp
        };

        const assistantMsg = {
            id: `msg-${Date.now() + 1}-a`,
            sender: 'assistant',
            text: validatedResponse.answer,
            timestamp: new Date(timestamp.getTime() + 100),
            sources: validatedResponse.sources,
            disclaimer: validatedResponse.disclaimer
        };

        const updatedMessages = [...(existingConversation?.messages || activeHistory), userMsg, assistantMsg];

        // 8. Persist Conversation
        await conversationStore.save({
            conversationId: activeConversationId,
            userId,
            caseId,
            caseTitle: structuredContext.caseTitle,
            caseContext: mergedRawContext,
            messages: updatedMessages
        });

        // 9. Return structured response to client
        return res.status(200).json(formatResponse({
            conversationId: activeConversationId,
            caseId,
            message: assistantMsg,
            sources: validatedResponse.sources,
            disclaimer: validatedResponse.disclaimer
        }));

    } catch (err) {
        console.error('[handleCaseChat Error]:', err.message);
        return res.status(500).json(formatError('Failed to process case assistant query. Please try again.'));
    }
};

/**
 * GET /api/cases/:caseId/conversation
 * Retrieves persistent conversation history for the authenticated user and case.
 */
const getConversationHistory = async (req, res) => {
    try {
        const caseId = req.params.caseId || req.query.caseId;
        const conversationId = req.query.conversationId;
        const userId = req.user?._id || 'mock-user-1';

        if (!caseId && !conversationId) {
            return res.status(400).json(formatError('caseId or conversationId is required.'));
        }

        let conversation = null;
        if (conversationId) {
            conversation = await conversationStore.getById(conversationId);
            if (conversation && conversation.userId !== userId) {
                return res.status(403).json(formatError('Access denied: Unauthorized access to case history.'));
            }
        } else {
            conversation = await conversationStore.getByUserAndCase(userId, caseId);
        }

        if (!conversation) {
            return res.status(200).json(formatResponse({
                conversationId: null,
                caseId: caseId || 'unknown',
                messages: []
            }));
        }

        return res.status(200).json(formatResponse({
            conversationId: conversation.conversationId,
            caseId: conversation.caseId,
            caseTitle: conversation.caseTitle,
            messages: conversation.messages || []
        }));

    } catch (err) {
        console.error('[getConversationHistory Error]:', err.message);
        return res.status(500).json(formatError('Failed to retrieve conversation history.'));
    }
};


module.exports = {
    handleCaseChat,
    getConversationHistory
};
