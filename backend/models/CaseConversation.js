const mongoose = require('mongoose');

// In-memory conversation store for offline / disconnected operation
const fallbackConversations = new Map();

const sourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['case', 'law', 'evidence', 'argument', 'general'], default: 'case' },
    id: { type: String },
    similarity: { type: String },
    relevance: { type: String }
}, { _id: false });

const messageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    sources: [sourceSchema],
    disclaimer: { type: String }
});

const caseConversationSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseTitle: { type: String, default: 'Untitled Case' },
    caseContext: { type: mongoose.Schema.Types.Mixed },
    messages: [messageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const CaseConversationModel = mongoose.models.CaseConversation || mongoose.model('CaseConversation', caseConversationSchema);

/**
 * Persistence layer supporting both MongoDB and in-memory fallback
 */
const conversationStore = {
    /**
     * Retrieve conversation by conversationId
     */
    async getById(conversationId) {
        if (mongoose.connection.readyState === 1) {
            try {
                const doc = await CaseConversationModel.findOne({ conversationId });
                if (doc) return doc.toObject();
            } catch (err) {
                console.warn('[conversationStore DB getById Error]:', err.message);
            }
        }
        return fallbackConversations.get(conversationId) || null;
    },

    /**
     * Retrieve the latest conversation for a given user and case
     */
    async getByUserAndCase(userId, caseId) {
        if (mongoose.connection.readyState === 1) {
            try {
                const doc = await CaseConversationModel.findOne({ userId, caseId }).sort({ updatedAt: -1 });
                if (doc) return doc.toObject();
            } catch (err) {
                console.warn('[conversationStore DB getByUserAndCase Error]:', err.message);
            }
        }
        for (const conv of fallbackConversations.values()) {
            if (conv.userId === userId && conv.caseId === caseId) {
                return conv;
            }
        }
        return null;
    },

    /**
     * Save or update conversation
     */
    async save(conversationData) {
        conversationData.updatedAt = new Date();

        // 1. Save in memory
        fallbackConversations.set(conversationData.conversationId, {
            ...conversationData,
            messages: [...(conversationData.messages || [])]
        });

        // 2. Save in MongoDB if active
        if (mongoose.connection.readyState === 1) {
            try {
                await CaseConversationModel.findOneAndUpdate(
                    { conversationId: conversationData.conversationId },
                    conversationData,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            } catch (err) {
                console.warn('[conversationStore DB Save Warning]:', err.message);
            }
        }

        return conversationData;
    }
};

module.exports = {
    CaseConversation: CaseConversationModel,
    conversationStore
};
