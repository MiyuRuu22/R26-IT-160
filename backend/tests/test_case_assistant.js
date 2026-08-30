/**
 * test_case_assistant.js
 * =======================
 * Automated test suite for Case Assistant Chatbot backend endpoints,
 * authorization controls, context processing, and anti-hallucination safeguards.
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api/cases';
const TEST_TOKEN = 'mock-jwt-token-test';
const USER_A = 'lawyer-alice-101';
const USER_B = 'lawyer-bob-202';
const CASE_ID = `test-case-${Date.now()}`;

const MOCK_CASE_CONTEXT = {
    caseId: CASE_ID,
    caseTitle: 'Republic v. Bandara & Others',
    caseType: 'Criminal',
    facts: 'The accused was arrested near Peliyagoda with suspected illegal substances. Police claim recovery was made during an evening patrol. No civilian witnesses were recorded.',
    legalIssues: ['Poisons, Opium and Dangerous Drugs Ordinance', 'Chain of Custody Vulnerability'],
    parties: ['Accused: Bandara', 'Investigating Officer: SI Perera'],
    analysisResults: {
        detectedIssue: 'Drug Trafficking & Possession',
        confidence: 0.89,
        riskLevel: 'HIGH',
        riskLabel: 'High Prosecution Risk',
        weakWording: [
            { detected_word: 'suspected', defense_argument: 'Mere suspicion without Government Analyst report does not substantiate charge.' }
        ],
        missingEvidence: [
            { label: 'Government Analyst Report', defense_argument: 'Absence of chemical analysis report is fatal to the prosecution.' }
        ],
        contradictions: [
            { type: 'Timeline', detected: 'Patrol log 18:00 vs Arrest memo 20:30', argument: 'Unexplained 2.5 hour gap creates reasonable doubt.' }
        ],
        defenseConsiderations: [
            'Challenge the chain of custody from seizure to court deposit.',
            'Move for discharge if Government Analyst report is not submitted within statutory deadline.'
        ],
        redFlags: [
            { title: 'Recovery in Absence of Civilians', description: 'Search conducted solely by police.', defense_tip: 'Argue planting risk.' }
        ]
    },
    similarCases: [
        { id: 'CA/142/2021', parties: 'Silva v. OIC Peliyagoda', similarity: '91%', description: 'Acquittal due to broken chain of custody in drug seizure.' }
    ],
    opponentArguments: [
        {
            id: 'OPP-1',
            title: 'Immediate recovery presumption',
            opponentPosition: 'Prosecution will claim presumption under Section 54A applies.',
            reasoningBehind: 'Accused was found in physical proximity to the contraband.',
            priority: 'HIGH',
            likelihood: 'HIGH',
            category: 'Legal'
        }
    ],
    legalReferences: [
        { act: 'Poisons, Opium and Dangerous Drugs Ordinance', section: '54A', title: 'Trafficking Presumption', text: 'Where any person is found in possession...' }
    ]
};

async function runTests() {
    console.log('====================================================');
    console.log('🧪 RUNNING CASE ASSISTANT BACKEND TEST SUITE');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Unauthenticated request should return 401
    try {
        await axios.post(`${BASE_URL}/${CASE_ID}/chat`, { message: 'Hello' });
        console.log('❌ Test 1 FAILED: Expected 401 Unauthorized');
        failed++;
    } catch (err) {
        if (err.response?.status === 401) {
            console.log('✅ Test 1 PASSED: Unauthenticated request correctly rejected with 401');
            passed++;
        } else {
            console.log(`❌ Test 1 FAILED: Unexpected status ${err.response?.status}`);
            failed++;
        }
    }

    // Test 2: Empty message should return 400
    try {
        await axios.post(
            `${BASE_URL}/${CASE_ID}/chat`,
            { message: '   ' },
            { headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'x-user-id': USER_A } }
        );
        console.log('❌ Test 2 FAILED: Expected 400 Bad Request');
        failed++;
    } catch (err) {
        if (err.response?.status === 400) {
            console.log('✅ Test 2 PASSED: Empty question correctly rejected with 400');
            passed++;
        } else {
            console.log(`❌ Test 2 FAILED: Unexpected status ${err.response?.status}`);
            failed++;
        }
    }

    // Test 3: Querying similar cases with grounded context
    try {
        const res = await axios.post(
            `${BASE_URL}/${CASE_ID}/chat`,
            {
                message: 'Why is this case considered similar to CA/142/2021?',
                caseContext: MOCK_CASE_CONTEXT
            },
            { headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'x-user-id': USER_A } }
        );

        const data = res.data?.data;
        const answer = data?.message?.text || '';
        const sources = data?.sources || [];

        const mentionsPrecedent = answer.includes('Silva v. OIC Peliyagoda') || answer.includes('CA/142/2021');
        const hasSourceCitation = sources.some(s => s.id === 'CA/142/2021');

        if (res.status === 200 && mentionsPrecedent && hasSourceCitation) {
            console.log('✅ Test 3 PASSED: Precedent analysis answered accurately with source citation');
            passed++;
        } else {
            console.log('❌ Test 3 FAILED: Precedent not properly cited in answer or sources:', answer);
            failed++;
        }
    } catch (err) {
        console.log('❌ Test 3 FAILED with error:', err.response?.data || err.message);
        failed++;
    }

    // Test 4: Opponent argument query
    try {
        const res = await axios.post(
            `${BASE_URL}/${CASE_ID}/chat`,
            {
                message: 'What could the opponent argue against our case?',
                caseContext: MOCK_CASE_CONTEXT
            },
            { headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'x-user-id': USER_A } }
        );

        const answer = res.data?.data?.message?.text || '';
        const mentionsOpponentArg = answer.toLowerCase().includes('presumption') || answer.toLowerCase().includes('immediate recovery');

        if (res.status === 200 && mentionsOpponentArg) {
            console.log('✅ Test 4 PASSED: Opponent argument predicted and analyzed accurately');
            passed++;
        } else {
            console.log('❌ Test 4 FAILED: Opponent argument missing in response:', answer);
            failed++;
        }
    } catch (err) {
        console.log('❌ Test 4 FAILED with error:', err.response?.data || err.message);
        failed++;
    }

    // Test 5: Anti-Hallucination safeguard for non-existent statute
    try {
        const res = await axios.post(
            `${BASE_URL}/${CASE_ID}/chat`,
            {
                message: 'What does Section 999 say in this case?',
                caseContext: MOCK_CASE_CONTEXT
            },
            { headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'x-user-id': USER_A } }
        );

        const answer = res.data?.data?.message?.text || '';
        const handlesMissingGracefully = answer.includes("don't have the text or record of Section 999") || answer.includes("insufficient") || answer.includes("authoritative");

        if (res.status === 200 && handlesMissingGracefully) {
            console.log('✅ Test 5 PASSED: Anti-hallucination safeguard caught non-existent Section 999');
            passed++;
        } else {
            console.log('❌ Test 5 FAILED: Failed anti-hallucination check:', answer);
            failed++;
        }
    } catch (err) {
        console.log('❌ Test 5 FAILED with error:', err.response?.data || err.message);
        failed++;
    }

    // Test 6: Conversation History Retrieval
    try {
        const res = await axios.get(
            `${BASE_URL}/${CASE_ID}/conversation`,
            { headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'x-user-id': USER_A } }
        );

        const messages = res.data?.data?.messages || [];
        if (res.status === 200 && messages.length >= 6) {
            console.log(`✅ Test 6 PASSED: Conversation history verified (${messages.length} messages stored)`);
            passed++;
        } else {
            console.log(`❌ Test 6 FAILED: Expected >= 6 messages in history, got ${messages.length}`);
            failed++;
        }
    } catch (err) {
        console.log('❌ Test 6 FAILED with error:', err.response?.data || err.message);
        failed++;
    }

    // Test 7: Multi-user authorization protection (User B accessing User A's conversation)
    try {
        const userAConversationId = `conv-${CASE_ID}-${USER_A}`;
        await axios.get(
            `${BASE_URL}/${CASE_ID}/conversation?conversationId=${userAConversationId}`,
            { headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'x-user-id': USER_B } }
        );
        console.log('❌ Test 7 FAILED: Expected 403 Forbidden for User B accessing User A conversation');
        failed++;
    } catch (err) {
        if (err.response?.status === 403) {
            console.log('✅ Test 7 PASSED: Cross-user conversation access strictly blocked with 403 Forbidden');
            passed++;
        } else {
            console.log(`❌ Test 7 FAILED: Expected 403 status, got ${err.response?.status}`);
            failed++;
        }
    }


    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
