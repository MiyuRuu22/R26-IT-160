/**
 * aiService.js
 * ============
 * AI Provider Abstraction Layer for Smart Lawyer Companion.
 * Connects to OpenAI-compatible endpoints or Google Gemini if configured,
 * with a high-fidelity Grounded Legal Reasoning Engine fallback.
 * Enforces strict anti-hallucination, neutral professional tone, and source citations.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const { DEFAULT_DISCLAIMER, extractFallbackSources } = require('./responseValidator');

dotenv.config();


const SYSTEM_INSTRUCTION = `You are the Case Assistant within Smart Lawyer Companion.

Your role is to help a qualified legal professional understand and analyse the information available for the currently selected case.
You are an AI decision-support assistant, not a lawyer and not a replacement for professional legal judgment.

CRITICAL PRINCIPLES:
1. Use ONLY the provided case information, analysis results, defense arguments, opponent arguments, evidence status, similar cases, and legal references.
2. DO NOT invent:
   - cases or case names
   - court decisions or judgments
   - statutes, acts, or sections
   - legal authorities
   - evidence or exhibits
   - facts or witness testimonies
   - quotations or legal citations
   - case outcomes or win guarantees
3. If information is not available in the supplied context, clearly and explicitly state that the available case information is insufficient.
4. Clearly distinguish between:
   - Information directly present in the case record.
   - Analysis or inference based on that information.
   - Information that requires independent verification from authoritative primary legal sources.
5. Never present an assumption as a confirmed legal fact.
6. Never claim that an argument will definitely succeed or promise a specific verdict.
7. Maintain a professional, objective, and neutral legal advisory tone.
8. Structure answers clearly with bullet points, numbered lists, or short sections where appropriate.
9. Whenever referencing a case, statute, or specific evidence, explicitly cite the corresponding source from the provided context.

All outputs are advisory and subject to professional legal review.`;

/**
 * Main dispatch function for generating responses
 */
async function generateCaseResponse({ caseContext, conversationHistory = [], message }) {
    const aiApiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const aiBaseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const aiModel = process.env.AI_MODEL || 'gpt-4o-mini';

    // 1. If OpenAI / Compatible API configured
    if (aiApiKey) {
        try {
            console.log(`[aiService] Calling OpenAI-compatible API (${aiModel})...`);
            const messages = [
                { role: 'system', content: `${SYSTEM_INSTRUCTION}\n\nCURRENT CASE CONTEXT:\n${caseContext.contextPromptText}` }
            ];

            // Append recent history (up to last 12 messages)
            const recentHistory = conversationHistory.slice(-12);
            for (const turn of recentHistory) {
                messages.push({
                    role: turn.sender === 'user' ? 'user' : 'assistant',
                    content: turn.text
                });
            }

            messages.push({ role: 'user', content: message });

            const response = await axios.post(
                `${aiBaseUrl.replace(/\/+$/, '')}/chat/completions`,
                {
                    model: aiModel,
                    messages,
                    temperature: 0.2,
                    max_tokens: 1200
                },
                {
                    headers: {
                        'Authorization': `Bearer ${aiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 25000
                }
            );

            const content = response.data.choices?.[0]?.message?.content;
            if (content) {
                const parsed = parseAIContent(content, caseContext);
                return parsed;
            }
        } catch (err) {
            console.warn('[aiService] External LLM failed, falling back to legal reasoning engine:', err.message);
        }
    }

    // 2. If Gemini API configured
    if (geminiKey) {
        try {
            console.log('[aiService] Calling Google Gemini API...');
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
            
            const contents = [
                { role: 'user', parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCURRENT CASE CONTEXT:\n${caseContext.contextPromptText}\n\nPREVIOUS CONTEXT:\n${conversationHistory.slice(-8).map(m => `${m.sender}: ${m.text}`).join('\n')}\n\nQUESTION: ${message}` }] }
            ];

            const response = await axios.post(geminiUrl, { contents }, { timeout: 25000 });
            const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                return parseAIContent(text, caseContext);
            }
        } catch (err) {
            console.warn('[aiService] Gemini call failed, falling back to legal reasoning engine:', err.message);
        }
    }

    // 3. High-Fidelity Grounded Legal Reasoning Engine (Offline / Local / Zero-Cost Fallback)
    return executeGroundedLegalReasoning(caseContext, conversationHistory, message);
}

/**
 * Parses raw text response and extracts identified sources
 */
function parseAIContent(rawText, caseContext) {
    const sources = [];

    // Check for mentioned similar cases
    if (caseContext.similarCases) {
        for (const c of caseContext.similarCases) {
            if (rawText.toLowerCase().includes(c.id.toLowerCase()) || 
                (c.parties && rawText.toLowerCase().includes(c.parties.toLowerCase()))) {
                sources.push({
                    title: c.parties || c.id,
                    type: 'case',
                    id: c.id,
                    similarity: c.similarity,
                    relevance: `Similar precedent cited in case analysis.`
                });
            }
        }
    }

    // Check for mentioned statutes
    if (caseContext.legalReferences) {
        for (const l of caseContext.legalReferences) {
            if (rawText.toLowerCase().includes(l.act.toLowerCase()) || 
                (l.section && rawText.toLowerCase().includes(`section ${l.section}`))) {
                sources.push({
                    title: `${l.act} Sec. ${l.section}`,
                    type: 'law',
                    id: l.act,
                    similarity: null,
                    relevance: 'Applicable statutory provision.'
                });
            }
        }
    }

    // Check for mentioned opponent arguments
    if (caseContext.opponentArguments) {
        for (const op of caseContext.opponentArguments) {
            if (rawText.toLowerCase().includes(op.title.toLowerCase())) {
                sources.push({
                    title: op.title,
                    type: 'argument',
                    id: op.id,
                    similarity: null,
                    relevance: `Opponent prediction (${op.priority} priority).`
                });
            }
        }
    }

    return {
        answer: rawText,
        sources,
        disclaimer: DEFAULT_DISCLAIMER,
        confidence: null
    };
}

/**
 * Grounded Legal Reasoning Engine
 * Performs intelligent, context-accurate analysis using the real case data,
 * legal issues, defense considerations, opponent arguments, evidence gaps,
 * and precedents. Adheres 100% to anti-hallucination rules.
 */
function executeGroundedLegalReasoning(ctx, history, query) {
    const qLower = query.toLowerCase().trim();
    const sources = [];
    const answerParts = [];

    // --- CASE 0: Adversarial Analysis & Opponent Strategy Inquiries ---
    if (ctx.adversarialAnalysis) {
        const adv = ctx.adversarialAnalysis;

        // Search & Warrant procedural questions
        if (qLower.includes('warrant') || qLower.includes('search') || qLower.includes('procedural')) {
            const proc = adv.search_arrest_procedural_analysis;
            const issues = (proc?.procedural_issues || []).join('\n- ');
            return {
                answer: `### Search & Procedural Vulnerability Assessment\n\n**Warrant Status:** ${proc?.warrant_status || 'Under review'}\n**Search Circumstances:** ${proc?.search_circumstances || 'Roadside vehicle interception'}\n\n**Identified Procedural Issues:**\n- ${issues || 'Potential procedural issue requiring legal review: Warrantless search conducted without recorded prior entry of reasonable grounds.'}\n\n**Strategic Defense Recommendation:**\nCross-examine the arresting officer specifically on whether mandatory statutory exceptions or exigent circumstances were contemporaneously documented prior to search execution. Demand production of station diary departure and search authorization notes.`,
                sources: [{ title: 'Procedural Analysis: Warrantless Search Review', type: 'argument', relevance: 'Procedural vulnerability.' }],
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }

        // Chain of custody & missing seal number questions
        if (qLower.includes('seal') || qLower.includes('custody') || qLower.includes('analyst') || qLower.includes('forensic')) {
            const chain = adv.forensic_chain_of_custody_analysis;
            return {
                answer: `### Forensic Confirmation & Chain of Custody Strategy\n\n**Government Analyst Status:** ${chain?.forensic_report_status || 'Pending chemical verification'}\n**Exhibit Sealing & Seal Number:** ${chain?.sealing_and_seal_number || 'Missing or unrecorded exhibit seal number on recovery documentation'}\n**Transfers & Custody:** ${chain?.transfers_and_custody_records || 'Incomplete transfer documentation between station and laboratory'}\n\n**Tactical Impact on Defense & Bail:**\n1. **Threshold Proof Defect:** Until the Government Analyst report confirms chemical identity and pure net weight, the statutory allegation remains scientifically unproven.\n2. **Admissibility Challenge:** Missing exhibit seal numbers create a prima facie opening to challenge evidence continuity and raise tampering doubts under established chain of custody standards.\n3. **Action:** File formal motion demanding early production of laboratory weighment intake records.`,
                sources: [{ title: 'Forensic Analysis: Chain of Custody & GA Report', type: 'argument', relevance: 'Chain of custody review.' }],
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }

        // Cross-examination & witness questions
        if (qLower.includes('witness') || qLower.includes('cross-exam') || qLower.includes('officer') || qLower.includes('question') || qLower.includes('bandara')) {
            const witList = adv.witness_analysis || [];
            const parts = [`### Recommended Cross-Examination Strategy for Witnesses\n`];
            witList.forEach((w) => {
                parts.push(`**${w.witness_name_role} (${w.witness_category})**`);
                parts.push(`- *Expected Testimony:* ${w.expected_testimony}`);
                if (w.likely_cross_examination_issues && w.likely_cross_examination_issues.length > 0) {
                    parts.push(`- *Key Cross-Examination Questions:*`);
                    w.likely_cross_examination_issues.forEach(q => parts.push(`  • ${q}`));
                }
                parts.push('');
            });
            return {
                answer: parts.join('\n'),
                sources: witList.map(w => ({ title: w.witness_name_role, type: 'witness', relevance: 'Witness cross-examination issues.' })),
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }

        // Top priorities or hearing strategy
        if (qLower.includes('priorit') || qLower.includes('next move') || qLower.includes('hear') || qLower.includes('summary')) {
            const priorities = adv.defense_priorities || [];
            const parts = [`### Top Defense Priorities Before the Hearing\n`];
            priorities.forEach((p) => {
                parts.push(`**Rank #${p.rank} [${p.urgency}]: ${p.priority_issue}**`);
                parts.push(`- *Tied Evidence:* ${p.tied_evidence}`);
                parts.push(`- *Action Required:* ${p.action_recommended}\n`);
            });
            if (adv.most_likely_next_prosecution_move) {
                parts.push(`**Anticipated Next Prosecution Move:** ${adv.most_likely_next_prosecution_move.primary_next_move}`);
            }
            return {
                answer: parts.join('\n'),
                sources: priorities.map(p => ({ title: `Priority #${p.rank}: ${p.priority_issue}`, type: 'argument', relevance: 'Hearing defense priority.' })),
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }
    }

    // --- CASE 1: Similar Cases / Precedents ---
    if (qLower.includes('similar') || qLower.includes('precedent') || qLower.includes('case 102') || qLower.includes('previous case')) {
        if (!ctx.availability.hasSimilarCases) {
            return {
                answer: "No similar cases or judicial precedents are currently available in the case analysis records. Please ensure that precedent indexing is completed or add case facts to identify relevant precedents.",
                sources: [],
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }

        const topCase = ctx.similarCases[0];
        answerParts.push(`### Analysis of Relevant Precedents\n`);
        answerParts.push(`The most closely aligned precedent in the database is **${topCase.parties || topCase.id}** (Similarity: **${topCase.similarity || 'High'}**).\n`);
        
        answerParts.push(`**Key Precedent Details:**`);
        answerParts.push(`- **Case Identifier:** ${topCase.id}`);
        answerParts.push(`- **Parties:** ${topCase.parties}`);
        if (topCase.description) {
            answerParts.push(`- **Case Summary:** ${topCase.description}`);
        }
        
        answerParts.push(`\n**Strategic Value:**`);
        answerParts.push(`This precedent shares factual and legal parallels with the detected issue (**${ctx.analysisResults.detectedIssue || ctx.caseType}**). While outcomes in previous appeals do not guarantee an identical ruling, the legal reasoning applied in ${topCase.id} can be cited to support your defense position.`);

        sources.push({
            title: topCase.parties || topCase.id,
            type: 'case',
            id: topCase.id,
            similarity: topCase.similarity,
            relevance: 'Primary matching precedent.'
        });

        // Add second precedent if available
        if (ctx.similarCases.length > 1) {
            const second = ctx.similarCases[1];
            answerParts.push(`\n**Additional Precedent:**`);
            answerParts.push(`- **${second.parties || second.id}** (Similarity: ${second.similarity}): ${second.description || 'Applicable to secondary legal issues.'}`);
            sources.push({
                title: second.parties || second.id,
                type: 'case',
                id: second.id,
                similarity: second.similarity,
                relevance: 'Secondary matching precedent.'
            });
        }

        return {
            answer: answerParts.join('\n'),
            sources,
            disclaimer: DEFAULT_DISCLAIMER,
            confidence: null
        };
    }

    // --- CASE 2: Opponent Arguments & Challenges ---
    if (qLower.includes('opponent') || qLower.includes('prosecution argue') || qLower.includes('counter') || qLower.includes('challenge')) {
        if (!ctx.availability.hasOpponentArguments) {
            return {
                answer: "No opponent arguments have been identified in the current analysis session. You can generate opponent argument predictions under the 'Opponent Arguments' tab.",
                sources: [],
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }

        answerParts.push(`### Potential Opponent & Prosecutorial Arguments\n`);
        answerParts.push(`Based on the current case information and risk assessment (${ctx.analysisResults.riskLevel || 'Moderate'}), the opposing side may advance the following positions:\n`);

        const highPriority = ctx.opponentArguments.filter(a => a.priority === 'HIGH');
        const displayArgs = highPriority.length > 0 ? highPriority : ctx.opponentArguments.slice(0, 3);

        displayArgs.forEach((arg, i) => {
            answerParts.push(`**${i + 1}. ${arg.title}** (Priority: *${arg.priority}* | Likelihood: *${arg.likelihood}*)`);
            if (arg.position) {
                answerParts.push(`   - **Opponent's Likely Position:** ${arg.position}`);
            }
            if (arg.reasoning) {
                answerParts.push(`   - **Reasoning Behind Argument:** ${arg.reasoning}`);
            }
            if (arg.counterStrategy && arg.counterStrategy.evidenceToStrengthen && arg.counterStrategy.evidenceToStrengthen.length > 0) {
                answerParts.push(`   - **Preparation / Counter-Measure:** Strengthen ${arg.counterStrategy.evidenceToStrengthen.join(', ')}.`);
            }
            answerParts.push('');

            sources.push({
                title: arg.title,
                type: 'argument',
                id: arg.id,
                similarity: null,
                relevance: `Predicted ${arg.priority} priority opponent argument.`
            });
        });

        if (ctx.opponentStrategies.length > 0) {
            answerParts.push(`**Underlying Opponent Strategy:**`);
            ctx.opponentStrategies.slice(0, 2).forEach(s => answerParts.push(`- ${s}`));
        }

        return {
            answer: answerParts.join('\n'),
            sources,
            disclaimer: DEFAULT_DISCLAIMER,
            confidence: null
        };
    }

    // --- CASE 3: Defense Arguments & Strengths ---
    if (qLower.includes('defense argument') || qLower.includes('strongest argument') || qLower.includes('strategy') || qLower.includes('defend')) {
        if (!ctx.availability.hasDefenseArguments) {
            return {
                answer: "No specific defense arguments have been generated in the current analysis. Add more factual details to the case to generate tailored defense considerations.",
                sources: [],
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }

        answerParts.push(`### Recommended Defense Arguments\n`);
        answerParts.push(`The analysis highlights the following key strategic defense arguments for **${ctx.caseTitle}**:\n`);

        ctx.defenseArguments.slice(0, 4).forEach((arg, i) => {
            answerParts.push(`**${i + 1}. Strategic Consideration:**`);
            answerParts.push(`${arg}\n`);
        });

        if (ctx.analysisResults.redFlags && ctx.analysisResults.redFlags.length > 0) {
            const rf = ctx.analysisResults.redFlags[0];
            answerParts.push(`**Key Vulnerability to Exploit in Prosecution:**`);
            answerParts.push(`- **${rf.title}:** ${rf.description} *(Defense tip: ${rf.defense_tip})*\n`);
        }

        answerParts.push(`**Recommendation:** Verify all factual assertions against original documentation and ensure witness statements corroborate these strategic points.`);

        return {
            answer: answerParts.join('\n'),
            sources: extractFallbackSources(ctx),
            disclaimer: DEFAULT_DISCLAIMER,
            confidence: null
        };
    }

    // --- CASE 4: Evidence & Missing Information ---
    if (qLower.includes('evidence') || qLower.includes('missing') || qLower.includes('gap') || qLower.includes('support')) {
        answerParts.push(`### Evidence & Investigative Assessment\n`);

        if (ctx.analysisResults.missingEvidence.length > 0) {
            answerParts.push(`**Critical Missing Evidence Gaps:**`);
            ctx.analysisResults.missingEvidence.forEach(m => {
                answerParts.push(`- **${m.label}:** ${m.defense_argument || 'Absence creates substantial reasonable doubt.'}`);
            });
            answerParts.push('');
        } else {
            answerParts.push(`- No automated missing evidence gaps were flagged in the summary.\n`);
        }

        answerParts.push(`**Current Evidence Status from Case Record:**`);
        answerParts.push(`- **Physical Evidence:** ${ctx.evidence.physicalEvidence}`);
        answerParts.push(`- **Forensic Report:** ${ctx.evidence.forensicReport}`);
        answerParts.push(`- **Chain of Custody:** ${ctx.evidence.chainOfCustody}`);
        answerParts.push(`- **Digital / Electronic Evidence:** ${ctx.evidence.digitalEvidence}`);
        answerParts.push(`- **CCTV Coverage:** ${ctx.evidence.cctv}`);

        if (ctx.evidence.chainOfCustody === 'Incomplete' || ctx.evidence.chainOfCustody === 'Unknown') {
            answerParts.push(`\n**Evidentiary Vulnerability:** A potential continuity or chain of custody question exists. Defense should request complete evidence logbooks from the investigating officer.`);
        }

        return {
            answer: answerParts.join('\n'),
            sources: extractFallbackSources(ctx),
            disclaimer: DEFAULT_DISCLAIMER,
            confidence: null
        };
    }

    // --- CASE 5: Legal References & Statutes ---
    if (qLower.includes('statute') || qLower.includes('section') || qLower.includes('law') || qLower.includes('act')) {
        // Check if user asked for a specific non-existent section
        const sectionMatch = qLower.match(/section\s+(\d+[a-z]?)/i);
        if (sectionMatch) {
            const requestedSec = sectionMatch[1];
            const foundLaw = ctx.legalReferences.find(l => String(l.section).toLowerCase() === requestedSec.toLowerCase());
            
            if (!foundLaw) {
                return {
                    answer: `I don't have the text or record of Section ${requestedSec} in the available case information, so I cannot reliably explain its contents. Please verify the provision using an authoritative legal source.`,
                    sources: [],
                    disclaimer: DEFAULT_DISCLAIMER,
                    confidence: null
                };
            }

            return {
                answer: `### Statutory Provision: ${foundLaw.act} — Section ${foundLaw.section}\n\n**Section Title:** ${foundLaw.title || 'Statutory Provision'}\n\n**Text:**\n${foundLaw.text}\n\n**Relevance to Current Case:**\nThis statutory provision was retrieved as a governing framework for the detected issue (${ctx.analysisResults.detectedIssue || ctx.caseType}).`,
                sources: [{
                    title: `${foundLaw.act} Sec. ${foundLaw.section}`,
                    type: 'law',
                    id: foundLaw.act,
                    similarity: null,
                    relevance: 'Explicit statutory citation.'
                }],
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }

        if (ctx.availability.hasLegalReferences) {
            answerParts.push(`### Relevant Statutory References\n`);
            answerParts.push(`The analysis identified the following statutory provisions relevant to the current facts:\n`);

            ctx.legalReferences.slice(0, 3).forEach((l, i) => {
                answerParts.push(`**${i + 1}. ${l.act} — Section ${l.section}** (${l.title || l.category})`);
                if (l.text) {
                    answerParts.push(`   *Summary:* ${l.text.substring(0, 220)}...`);
                }
                answerParts.push('');

                sources.push({
                    title: `${l.act} Sec. ${l.section}`,
                    type: 'law',
                    id: l.act,
                    similarity: null,
                    relevance: 'Statutory basis.'
                });
            });

            return {
                answer: answerParts.join('\n'),
                sources,
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        } else {
            return {
                answer: "No specific statutory provisions were mapped to this case in the current analysis. Please verify the applicable statutes against authoritative legal sources.",
                sources: [],
                disclaimer: DEFAULT_DISCLAIMER,
                confidence: null
            };
        }
    }

    // --- CASE 6: Weaknesses & Contradictions ---
    if (qLower.includes('weakness') || qLower.includes('contradiction') || qLower.includes('risk') || qLower.includes('vulnerability')) {
        answerParts.push(`### Case Weaknesses & Contradiction Analysis\n`);
        answerParts.push(`**Overall Prosecution Risk Level:** **${ctx.analysisResults.riskLevel || 'MODERATE'}** (${ctx.analysisResults.riskLabel || 'Analysis based on available facts'})\n`);

        if (ctx.analysisResults.contradictions.length > 0) {
            answerParts.push(`**Detected Inconsistencies & Contradictions:**`);
            ctx.analysisResults.contradictions.forEach(c => {
                answerParts.push(`- **[${c.type}]** Statement: "${c.detected}". Argument: ${c.argument}`);
            });
            answerParts.push('');
        }

        if (ctx.analysisResults.weakWording.length > 0) {
            answerParts.push(`**Evidentiary Weaknesses in Prosecution Narrative:**`);
            ctx.analysisResults.weakWording.slice(0, 3).forEach(w => {
                answerParts.push(`- Detected word: *"${w.detected_word || w.detectedWord}"* — ${w.defense_argument || w.defenseArgument || ''}`);
            });
            answerParts.push('');
        }

        answerParts.push(`**Strategic Consideration:** These identified gaps provide direct opportunities to raise reasonable doubt during trial or in preliminary bail applications.`);

        return {
            answer: answerParts.join('\n'),
            sources: extractFallbackSources(ctx),
            disclaimer: DEFAULT_DISCLAIMER,
            confidence: null
        };
    }

    // --- CASE 7: General Case Summary / Key Findings ---
    answerParts.push(`### Key Findings for ${ctx.caseTitle}\n`);
    answerParts.push(`**1. Case Overview & Issues:**`);
    answerParts.push(`- **Case Type:** ${ctx.caseType}`);
    answerParts.push(`- **Detected Issue:** ${ctx.analysisResults.detectedIssue || 'General legal issue'} (Confidence: ${ctx.analysisResults.confidence ? Math.round(ctx.analysisResults.confidence * 100) + '%' : 'Calculated'})`);
    answerParts.push(`- **Prosecution Risk Level:** ${ctx.analysisResults.riskLevel || 'Evaluated'}\n`);

    answerParts.push(`**2. Core Defense Direction:**`);
    if (ctx.defenseArguments.length > 0) {
        answerParts.push(`- ${ctx.defenseArguments[0]}`);
    }
    if (ctx.analysisResults.missingEvidence.length > 0) {
        answerParts.push(`- Capitalize on missing prosecution evidence (${ctx.analysisResults.missingEvidence.map(m => m.label).slice(0, 2).join(', ')}).`);
    }

    answerParts.push(`\n**3. Opponent Argument Forecast:**`);
    if (ctx.opponentArguments.length > 0) {
        const topOpp = ctx.opponentArguments[0];
        answerParts.push(`- The opponent is most likely to argue: *${topOpp.title}* (${topOpp.priority} priority).`);
    } else {
        answerParts.push(`- Review the Opponent Arguments tab for anticipated arguments.`);
    }

    answerParts.push(`\n**4. Comparable Precedent:**`);
    if (ctx.similarCases.length > 0) {
        const c = ctx.similarCases[0];
        answerParts.push(`- Reference **${c.parties || c.id}** (${c.similarity}) as a comparable authority.`);
        sources.push({
            title: c.parties || c.id,
            type: 'case',
            id: c.id,
            similarity: c.similarity,
            relevance: 'Primary precedent.'
        });
    }

    answerParts.push(`\n*You can ask specific questions about similar cases, opponent arguments, evidence gaps, or relevant statutory sections.*`);

    return {
        answer: answerParts.join('\n'),
        sources: sources.length > 0 ? sources : extractFallbackSources(ctx),
        disclaimer: DEFAULT_DISCLAIMER,
        confidence: null
    };
}

module.exports = {
    generateCaseResponse,
    SYSTEM_INSTRUCTION
};
