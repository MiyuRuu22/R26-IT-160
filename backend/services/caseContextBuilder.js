/**
 * caseContextBuilder.js
 * =====================
 * Controlled context-building layer for the Smart Lawyer Case Assistant.
 * Maps and sanitizes raw case & analysis data into a structured, token-efficient
 * context block tailored for legal reasoning with anti-hallucination guardrails.
 */

function buildStructuredCaseContext(raw = {}, userQuery = '') {
    const caseId = raw.caseId || raw.caseNumber || 'Current Case';
    const caseTitle = raw.caseTitle || raw.title || 'Active Case Preparation';
    const caseType = raw.caseType || 'Criminal';
    const caseFacts = raw.caseFacts || raw.facts || raw.incidentDescription || raw.caseSummary || '';
    
    // Legal issues
    const legalIssues = Array.isArray(raw.legalIssues) 
        ? raw.legalIssues 
        : (raw.legalIssue ? [raw.legalIssue] : []);

    // Parties
    const parties = Array.isArray(raw.parties) ? raw.parties : [];
    if (parties.length === 0) {
        if (raw.accusedPerson) parties.push(`Accused: ${raw.accusedPerson}`);
        if (raw.otherPersons) parties.push(`Other Parties: ${raw.otherPersons}`);
        if (raw.investigatingOfficer) parties.push(`Investigating Officer: ${raw.investigatingOfficer}`);
    }

    // Analysis results (from Defense Analyzer)
    const analysisResults = {
        detectedIssue: raw.analysisResults?.detectedIssue || raw.detected_label || raw.detected_issue || '',
        confidence: raw.analysisResults?.confidence ?? raw.confidence ?? null,
        riskLevel: raw.analysisResults?.riskLevel || raw.risk_level || '',
        riskLabel: raw.analysisResults?.riskLabel || raw.risk_label || '',
        weakWording: raw.analysisResults?.weakWording || raw.weak_wording || [],
        missingEvidence: raw.analysisResults?.missingEvidence || raw.missing_evidence || [],
        contradictions: raw.analysisResults?.contradictions || raw.contradictions || [],
        defenseConsiderations: raw.analysisResults?.defenseConsiderations || raw.defense_considerations || raw.defenseArguments || [],
        redFlags: raw.analysisResults?.redFlags || raw.advanced_red_flags || []
    };

    // Similar cases
    const similarCases = (raw.similarCases || raw.similar_cases || []).map((c, i) => ({
        index: i + 1,
        id: c.case_id || c.id || `Precedent-${i + 1}`,
        parties: c.parties || c.title || 'Precedent Case',
        description: c.description || c.summary || '',
        similarity: c.similarity || (c.similarity_score ? `${Math.round(c.similarity_score * 100)}%` : '')
    }));

    // Defense arguments
    const defenseArguments = Array.isArray(raw.defenseArguments) && raw.defenseArguments.length > 0
        ? raw.defenseArguments
        : analysisResults.defenseConsiderations;

    // Opponent arguments & strategies
    const rawOpponentArgs = (raw.opponentArguments && raw.opponentArguments.length > 0)
        ? raw.opponentArguments
        : (raw.adversarialAnalysis?.likely_prosecution_arguments || []).map((a, i) => ({
            id: `PROS-ARG-${i + 1}`,
            title: a.title,
            opponentPosition: a.argument,
            reasoningBehind: `Supporting Evidence: ${a.supporting_evidence} | Objective: ${a.prosecution_objective}`,
            priority: a.strength === 'Strong' ? 'HIGH' : a.strength === 'Moderate' ? 'MEDIUM' : 'LOW',
            likelihood: `${a.confidence}%`,
            category: 'Prosecution Strategy',
            counterStrategy: {
                evidenceToStrengthen: [a.expected_defense_response]
            }
        }));

    const opponentArguments = rawOpponentArgs.map((arg, i) => ({
        id: arg.id || `OPP-${i + 1}`,
        title: arg.title || '',
        position: arg.opponentPosition || arg.position || '',
        reasoning: arg.reasoningBehind || arg.reasoning || '',
        priority: arg.priority || 'MEDIUM',
        likelihood: arg.likelihood || 'MEDIUM',
        category: arg.category || 'General',
        counterStrategy: arg.counterStrategy || {}
    }));

    const opponentStrategies = Array.isArray(raw.opponentStrategies) 
        ? raw.opponentStrategies 
        : (raw.opponentStrategy || []);

    // Evidence summary
    const evidence = {
        physicalEvidence: raw.evidence?.physicalEvidence || raw.physicalEvidenceType || (raw.physicalEvidenceAvailable ? 'Physical evidence reported' : 'None explicitly specified'),
        forensicReport: raw.evidence?.forensicReport || raw.forensicReportStatus || 'Unknown',
        chainOfCustody: raw.evidence?.chainOfCustody || raw.chainOfCustodyStatus || 'Unknown',
        digitalEvidence: raw.evidence?.digitalEvidence || raw.digitalEvidenceStatus || 'Unknown',
        cctv: raw.evidence?.cctv || raw.cctvStatus || 'Unknown',
        witnesses: raw.evidence?.witnesses || raw.witnesses || [],
        evidenceAttacks: raw.evidence?.evidenceAttacks || raw.evidenceAttacks || [],
        evidenceGaps: raw.evidence?.evidenceGaps || raw.evidenceGaps || []
    };

    // Legal statutes / references
    const legalReferences = (raw.legalReferences || raw.similar_laws || []).map((l, i) => ({
        index: i + 1,
        act: l.act || l.act_name || '',
        section: l.section || '',
        title: l.title || l.section_title || '',
        category: l.category || '',
        text: l.text || l.law_text || ''
    }));

    // Data availability indicators (critical for anti-hallucination)
    const availability = {
        hasSimilarCases: similarCases.length > 0,
        hasDefenseArguments: defenseArguments.length > 0,
        hasOpponentArguments: opponentArguments.length > 0,
        hasEvidenceData: Boolean(caseFacts || evidence.witnesses.length > 0 || evidence.evidenceGaps.length > 0),
        hasLegalReferences: legalReferences.length > 0,
        hasMissingEvidenceGaps: analysisResults.missingEvidence.length > 0 || evidence.evidenceGaps.length > 0,
        hasContradictions: analysisResults.contradictions.length > 0
    };

    const adversarialAnalysis = raw.adversarialAnalysis || null;

    // Build prompt context string
    const contextPromptText = formatContextForPrompt({
        caseId,
        caseTitle,
        caseType,
        caseFacts,
        legalIssues,
        parties,
        analysisResults,
        similarCases,
        defenseArguments,
        opponentArguments,
        opponentStrategies,
        adversarialAnalysis,
        evidence,
        legalReferences,
        availability
    }, userQuery);

    return {
        caseId,
        caseTitle,
        caseType,
        caseFacts,
        legalIssues,
        parties,
        analysisResults,
        similarCases,
        defenseArguments,
        opponentArguments,
        opponentStrategies,
        adversarialAnalysis,
        evidence,
        legalReferences,
        availability,
        contextPromptText
    };
}

/**
 * Format context text into structured sections for the AI system prompt
 */
function formatContextForPrompt(ctx, userQuery = '') {
    const lines = [];

    lines.push(`=== CASE IDENTIFIERS ===`);
    lines.push(`Case ID: ${ctx.caseId}`);
    lines.push(`Case Title: ${ctx.caseTitle}`);
    lines.push(`Case Type: ${ctx.caseType}`);
    if (ctx.legalIssues.length > 0) {
        lines.push(`Primary Legal Issues: ${ctx.legalIssues.join(', ')}`);
    }
    if (ctx.parties.length > 0) {
        lines.push(`Parties: ${ctx.parties.join('; ')}`);
    }

    lines.push(`\n=== CASE FACTS & NARRATIVE ===`);
    if (ctx.caseFacts) {
        lines.push(ctx.caseFacts);
    } else {
        lines.push(`[No detailed case facts have been provided in the current analysis.]`);
    }

    lines.push(`\n=== DEFENSE ANALYSIS FINDINGS ===`);
    if (ctx.analysisResults.detectedIssue) {
        lines.push(`Detected Legal Issue: ${ctx.analysisResults.detectedIssue} (Confidence: ${ctx.analysisResults.confidence ? Math.round(ctx.analysisResults.confidence * 100) + '%' : 'N/A'})`);
    }
    if (ctx.analysisResults.riskLevel) {
        lines.push(`Prosecution Risk Level: ${ctx.analysisResults.riskLevel} (${ctx.analysisResults.riskLabel || ''})`);
    }

    if (ctx.defenseArguments.length > 0) {
        lines.push(`\nKey Defense Arguments & Considerations:`);
        ctx.defenseArguments.forEach((arg, i) => lines.push(`${i + 1}. ${arg}`));
    }

    if (ctx.analysisResults.weakWording.length > 0) {
        lines.push(`\nWeak Prosecutorial / Factual Phrases Detected:`);
        ctx.analysisResults.weakWording.forEach((w) => {
            lines.push(`- "${w.detected_word || w.detectedWord}": ${w.defense_argument || w.defenseArgument || ''}`);
        });
    }

    if (ctx.analysisResults.missingEvidence.length > 0) {
        lines.push(`\nIdentified Missing Evidence Gaps:`);
        ctx.analysisResults.missingEvidence.forEach((m) => {
            lines.push(`- ${m.label}: ${m.defense_argument || m.defenseArgument || 'Missing from prosecution evidence'}`);
        });
    }

    if (ctx.analysisResults.contradictions.length > 0) {
        lines.push(`\nNarrative Contradictions / Inconsistencies:`);
        ctx.analysisResults.contradictions.forEach((c) => {
            lines.push(`- [${c.type}] "${c.detected}": ${c.argument}`);
        });
    }

    if (ctx.analysisResults.redFlags.length > 0) {
        lines.push(`\nCritical Vulnerabilities & Red Flags:`);
        ctx.analysisResults.redFlags.forEach((r) => {
            lines.push(`- ${r.title}: ${r.description} (Defense Tip: ${r.defense_tip})`);
        });
    }

    lines.push(`\n=== OPPONENT ARGUMENT PREDICTIONS ===`);
    if (ctx.opponentArguments.length > 0) {
        ctx.opponentArguments.forEach((op, i) => {
            lines.push(`${i + 1}. [Priority: ${op.priority} | Likelihood: ${op.likelihood} | Category: ${op.category}] ${op.title}`);
            if (op.position) lines.push(`   Position: ${op.position}`);
            if (op.reasoning) lines.push(`   Reasoning: ${op.reasoning}`);
            if (op.counterStrategy && op.counterStrategy.evidenceToStrengthen) {
                lines.push(`   Counter-Strategy Evidence: ${op.counterStrategy.evidenceToStrengthen.join(', ')}`);
            }
        });
    } else {
        lines.push(`[No specific opponent arguments have been generated in this session.]`);
    }

    if (ctx.opponentStrategies.length > 0) {
        lines.push(`\nOverall Opponent Strategy Patterns:`);
        ctx.opponentStrategies.forEach((s, i) => lines.push(`- ${s}`));
    }

    if (ctx.adversarialAnalysis) {
        const adv = ctx.adversarialAnalysis;
        lines.push(`\n=== 14-SECTION DETAILED ADVERSARIAL OPPONENT ANALYSIS ===`);
        if (adv.overall_risk_assessment) {
            lines.push(`Prosecution Risk Level: ${adv.overall_risk_assessment.risk_level} (Confidence: ${adv.overall_risk_assessment.confidence_score}%)`);
            lines.push(`Risk Assessment Explanation: ${adv.overall_risk_assessment.short_explanation}`);
            if (adv.overall_risk_assessment.prosecution_strength_factors) {
                lines.push(`Factors Strengthening Prosecution: ${adv.overall_risk_assessment.prosecution_strength_factors.join('; ')}`);
            }
            if (adv.overall_risk_assessment.prosecution_weakness_factors) {
                lines.push(`Factors Weakening Prosecution: ${adv.overall_risk_assessment.prosecution_weakness_factors.join('; ')}`);
            }
        }
        if (adv.prosecution_theory_of_case) {
            lines.push(`\nProsecution Theory of the Case:`);
            lines.push(`- Core Narrative: ${adv.prosecution_theory_of_case.narrative}`);
            lines.push(`- Alleged Conduct: ${adv.prosecution_theory_of_case.alleged_conduct}`);
            lines.push(`- Alleged Intent / Knowledge: ${adv.prosecution_theory_of_case.alleged_intent_knowledge}`);
            lines.push(`- Alleged Possession / Control: ${adv.prosecution_theory_of_case.alleged_possession_control}`);
            if (adv.prosecution_theory_of_case.evidentiary_chain) {
                lines.push(`- Projected Evidentiary Chain: ${adv.prosecution_theory_of_case.evidentiary_chain.join(' -> ')}`);
            }
        }
        if (adv.likely_prosecution_arguments && adv.likely_prosecution_arguments.length > 0) {
            lines.push(`\nLikely Prosecution Arguments (${adv.likely_prosecution_arguments.length} specific arguments):`);
            adv.likely_prosecution_arguments.forEach((a, i) => {
                lines.push(`${i + 1}. [${a.strength} | ${a.confidence}%] ${a.title}: ${a.argument}`);
                lines.push(`   Supporting Evidence: ${a.supporting_evidence}`);
                lines.push(`   Prosecution Objective: ${a.prosecution_objective}`);
                lines.push(`   Expected Defense Response: ${a.expected_defense_response}`);
            });
        }
        if (adv.attacks_on_defense && adv.attacks_on_defense.length > 0) {
            lines.push(`\nAnticipated Prosecution Attacks on Defense Position:`);
            adv.attacks_on_defense.forEach((atk, i) => {
                lines.push(`${i + 1}. Defense Claim: "${atk.defense_claim}"`);
                lines.push(`   Prosecution Counterattack: "${atk.prosecution_counterargument}" (Leverage: ${atk.prosecution_leverage_point})`);
                lines.push(`   Recommended Defense Counter-Strategy: ${atk.defense_counter_strategy}`);
            });
        }
        if (adv.detected_defense_vulnerabilities && adv.detected_defense_vulnerabilities.length > 0) {
            lines.push(`\nDetected Defense Vulnerabilities:`);
            adv.detected_defense_vulnerabilities.forEach((v, i) => {
                lines.push(`${i + 1}. [${v.severity} Severity] ${v.title}: ${v.description} (Why Exploitable: ${v.why_exploitable} | Lawyer Review: ${v.recommended_lawyer_review})`);
            });
        }
        if (adv.prosecution_evidence_analysis && adv.prosecution_evidence_analysis.length > 0) {
            lines.push(`\nProsecution Evidence Item-by-Item Breakdown:`);
            adv.prosecution_evidence_analysis.forEach((e) => {
                lines.push(`- ${e.evidence_item}: Proves: "${e.what_it_proves}" | Does NOT Prove: "${e.what_it_does_not_prove}" | Defense Challenge: "${e.defense_challenge}"`);
            });
        }
        if (adv.witness_analysis && adv.witness_analysis.length > 0) {
            lines.push(`\nWitness Analysis:`);
            adv.witness_analysis.forEach((w) => {
                lines.push(`- ${w.witness_name_role} (${w.witness_category}): Expected: ${w.expected_testimony} | Cross-Exam Targets: ${(w.likely_cross_examination_issues || []).join('; ')}`);
            });
        }
        if (adv.search_arrest_procedural_analysis) {
            lines.push(`\nSearch & Procedural Analysis:`);
            lines.push(`- Search Circumstances: ${adv.search_arrest_procedural_analysis.search_circumstances}`);
            lines.push(`- Warrant Status: ${adv.search_arrest_procedural_analysis.warrant_status}`);
            if (adv.search_arrest_procedural_analysis.procedural_issues) {
                lines.push(`- Procedural Issues: ${adv.search_arrest_procedural_analysis.procedural_issues.join('; ')}`);
            }
        }
        if (adv.forensic_chain_of_custody_analysis) {
            lines.push(`\nForensic & Chain of Custody Analysis:`);
            lines.push(`- Forensic Status: ${adv.forensic_chain_of_custody_analysis.forensic_report_status}`);
            lines.push(`- Sealing & Seal Number: ${adv.forensic_chain_of_custody_analysis.sealing_and_seal_number}`);
            lines.push(`- Transfers & Custody: ${adv.forensic_chain_of_custody_analysis.transfers_and_custody_records}`);
        }
        if (adv.defense_priorities && adv.defense_priorities.length > 0) {
            lines.push(`\nTop 5 Defense Priorities Before Hearing:`);
            adv.defense_priorities.forEach((p) => {
                lines.push(`Rank #${p.rank} [${p.urgency}]: ${p.priority_issue} -> Action: ${p.action_recommended}`);
            });
        }
        if (adv.overall_adversarial_summary) {
            lines.push(`\nOverall Adversarial Summary:`);
            lines.push(`- Strongest Prosecution Point: ${adv.overall_adversarial_summary.strongest_prosecution_point}`);
            lines.push(`- Strongest Defense Point: ${adv.overall_adversarial_summary.strongest_defense_point}`);
            lines.push(`- Biggest Evidentiary Uncertainty: ${adv.overall_adversarial_summary.biggest_evidentiary_uncertainty}`);
            lines.push(`- Biggest Procedural Uncertainty: ${adv.overall_adversarial_summary.biggest_procedural_uncertainty}`);
            lines.push(`- Most Critical Missing Evidence: ${adv.overall_adversarial_summary.most_important_missing_evidence}`);
        }
    }

    lines.push(`\n=== EVIDENCE & INVESTIGATION STATUS ===`);
    lines.push(`Physical Evidence: ${ctx.evidence.physicalEvidence}`);
    lines.push(`Forensic Report: ${ctx.evidence.forensicReport}`);
    lines.push(`Chain of Custody: ${ctx.evidence.chainOfCustody}`);
    lines.push(`Digital Evidence: ${ctx.evidence.digitalEvidence}`);
    lines.push(`CCTV Footage: ${ctx.evidence.cctv}`);
    if (ctx.evidence.witnesses && ctx.evidence.witnesses.length > 0) {
        lines.push(`Witnesses Listed: ${ctx.evidence.witnesses.map(w => w.name || w.role).join(', ')}`);
    }

    lines.push(`\n=== SIMILAR PRECEDENTS & RELEVANT CASES ===`);
    if (ctx.similarCases.length > 0) {
        ctx.similarCases.forEach((c) => {
            lines.push(`- ${c.id}: ${c.parties} (Similarity: ${c.similarity})`);
            if (c.description) lines.push(`  Summary: ${c.description}`);
        });
    } else {
        lines.push(`[No similar cases are currently available in the analysis.]`);
    }

    lines.push(`\n=== RELEVANT STATUTORY REFERENCES ===`);
    if (ctx.legalReferences.length > 0) {
        ctx.legalReferences.forEach((l) => {
            lines.push(`- ${l.act} Section ${l.section}${l.title ? ` (${l.title})` : ''}`);
            if (l.text) lines.push(`  Statutory text: ${l.text.substring(0, 300)}...`);
        });
    } else {
        lines.push(`[No specific statutory provisions were mapped to this case.]`);
    }

    return lines.join('\n');
}

module.exports = {
    buildStructuredCaseContext
};
