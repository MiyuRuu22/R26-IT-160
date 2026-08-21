const mongoose = require('mongoose');

// Scalable MongoDB Schema for Legal Cases
// Ready for Future MongoDB Integration (Upgrade 2)
const caseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    summary: {
        type: String,
        required: true
    },
    outcome: {
        type: String,
        required: true
    },
    // To be used when mapping vector IDs back to Mongo records
    faissId: {
        type: Number,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Case', caseSchema);
