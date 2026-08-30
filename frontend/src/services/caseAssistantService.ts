/**
 * caseAssistantService.ts
 * =======================
 * API client and context extractor for Case Assistant Chatbot.
 */

import { API_ENDPOINTS } from '../config/api';

export interface ChatSourceReference {
  title: string;
  type: string;
  id?: string;
  similarity?: string;
  relevance?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string | Date;
  sources?: ChatSourceReference[];
  disclaimer?: string;
  status?: 'sending' | 'sent' | 'error';
}

export interface SendMessageParams {
  caseId: string;
  message: string;
  conversationId?: string;
  conversationHistory: ChatMessage[];
  caseContext: any;
  token?: string;
  userId?: string;
}

/**
 * Send question to Case Assistant backend endpoint
 */
export async function sendCaseAssistantMessage(params: SendMessageParams): Promise<{
  conversationId: string;
  message: ChatMessage;
  sources: ChatSourceReference[];
  disclaimer: string;
}> {
  const { caseId, message, conversationId, conversationHistory, caseContext, token, userId } = params;

  const url = API_ENDPOINTS.CASE_CHAT(caseId);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || 'mock-jwt-token-12345'}`,
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  // Format recent history (exclude temporary errors or sending status)
  const cleanHistory = conversationHistory
    .filter(m => m.status !== 'error')
    .slice(-12)
    .map(m => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
    }));

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      conversationId,
      conversationHistory: cleanHistory,
      caseContext,
      userId,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Server responded with status ${res.status}`);
  }

  const data = await res.json();
  if (data.status !== 'success' || !data.data) {
    throw new Error(data.message || 'Invalid response from Case Assistant.');
  }

  return {
    conversationId: data.data.conversationId,
    message: data.data.message,
    sources: data.data.sources || [],
    disclaimer: data.data.disclaimer || '',
  };
}

/**
 * Fetch existing conversation history for a given case
 */
export async function fetchCaseConversationHistory(
  caseId: string,
  token?: string,
  userId?: string
): Promise<{ conversationId: string | null; messages: ChatMessage[] }> {
  const url = API_ENDPOINTS.CASE_CONVERSATION(caseId);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || 'mock-jwt-token-12345'}`,
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  try {
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return { conversationId: null, messages: [] };

    const data = await res.json();
    if (data.status === 'success' && data.data) {
      return {
        conversationId: data.data.conversationId || null,
        messages: (data.data.messages || []).map((m: any) => ({
          ...m,
          status: 'sent' as const,
        })),
      };
    }
  } catch (err) {
    console.warn('[caseAssistantService] History fetch warning:', err);
  }

  return { conversationId: null, messages: [] };
}

/**
 * Compiles a structured, comprehensive case context snapshot from store state
 */
export function compileCaseContextSnapshot(storeState: any) {
  const {
    defenseResults,
    originalInput,
    additionalDetails,
    opponentTabData,
  } = storeState;

  const caseId =
    additionalDetails?.caseNumber ||
    originalInput?.caseTitle ||
    (defenseResults?.detected_issue ? `case-${defenseResults.detected_issue}` : 'active-case');

  const caseTitle =
    additionalDetails?.caseTitle ||
    originalInput?.caseTitle ||
    defenseResults?.detected_label ||
    'Active Legal Case';

  const caseType =
    additionalDetails?.caseType ||
    originalInput?.caseType ||
    'Criminal';

  const caseFacts =
    additionalDetails?.incidentDescription ||
    originalInput?.facts ||
    '';

  const legalIssues = [
    originalInput?.legalIssue,
    ...(additionalDetails?.relevantLegalIssues || []),
  ].filter(Boolean);

  const parties = [
    additionalDetails?.accusedPerson ? `Accused: ${additionalDetails.accusedPerson}` : null,
    additionalDetails?.otherPersons ? `Other Persons: ${additionalDetails.otherPersons}` : null,
    additionalDetails?.investigatingOfficer ? `Investigating Officer: ${additionalDetails.investigatingOfficer}` : null,
  ].filter(Boolean);

  return {
    caseId,
    caseTitle,
    caseType,
    caseFacts,
    legalIssues,
    parties,
    analysisResults: defenseResults ? {
      detectedIssue: defenseResults.detected_label || defenseResults.detected_issue,
      confidence: defenseResults.confidence,
      riskLevel: defenseResults.risk_level,
      riskLabel: defenseResults.risk_label,
      weakWording: defenseResults.weak_wording || [],
      missingEvidence: defenseResults.missing_evidence || [],
      contradictions: defenseResults.contradictions || [],
      defenseConsiderations: defenseResults.defense_considerations || [],
      redFlags: defenseResults.advanced_red_flags || [],
    } : {},
    similarCases: (defenseResults?.similar_cases || []).map((c: any) => ({
      id: c.case_id || c.id,
      parties: c.parties,
      description: c.description,
      similarity: c.similarity_score ? `${Math.round(c.similarity_score * 100)}%` : c.similarity,
    })),
    defenseArguments: defenseResults?.defense_considerations || [],
    opponentArguments: (opponentTabData?.arguments || []).map((arg: any) => ({
      id: arg.id,
      title: arg.title,
      opponentPosition: arg.opponentPosition,
      reasoningBehind: arg.reasoningBehind,
      priority: arg.priority,
      likelihood: arg.likelihood,
      category: arg.category,
      counterStrategy: arg.counterStrategy,
    })),
    opponentStrategies: opponentTabData?.opponentStrategy || [],
    evidence: {
      physicalEvidence: additionalDetails?.physicalEvidenceType || (additionalDetails?.physicalEvidenceAvailable ? 'Physical evidence reported' : 'None explicitly specified'),
      forensicReport: additionalDetails?.forensicReportStatus || 'Unknown',
      chainOfCustody: additionalDetails?.chainOfCustodyStatus || 'Unknown',
      digitalEvidence: additionalDetails?.digitalEvidenceStatus || 'Unknown',
      cctv: additionalDetails?.cctvStatus || 'Unknown',
      witnesses: additionalDetails?.witnesses || [],
      evidenceAttacks: opponentTabData?.evidenceAttacks || [],
      evidenceGaps: opponentTabData?.evidenceGaps || [],
    },
    legalReferences: (defenseResults?.similar_laws || []).map((l: any) => ({
      act: l.act_name || l.act,
      section: l.section,
      title: l.section_title || l.title,
      category: l.category,
      text: l.law_text || l.text,
    })),
  };
}

/**
 * Compiles a structured, comprehensive case context snapshot specifically
 * from the Opponent Prediction store (including all 14 adversarial sections).
 */
export function compileOpponentContextSnapshot(opponentStore: any) {
  const adv = opponentStore.adversarialAnalysis;
  const caseId = opponentStore.sessionId || 'active-opponent-case';
  const caseTitle = opponentStore.charges ? opponentStore.charges.slice(0, 60) : 'Opponent Case Strategy';
  const caseType = opponentStore.caseType || 'Criminal';
  const caseFacts = opponentStore.caseFacts || '';

  const parties = [
    opponentStore.accusedPerson ? `Accused: ${opponentStore.accusedPerson}` : null,
    opponentStore.investigatingOfficer ? `Investigating Officer: ${opponentStore.investigatingOfficer}` : null,
  ].filter(Boolean);

  return {
    caseId,
    caseTitle,
    caseType,
    caseFacts,
    legalIssues: opponentStore.charges ? [opponentStore.charges] : [],
    parties,
    adversarialAnalysis: adv || null,
    analysisResults: {
      detectedIssue: opponentStore.charges,
      riskLevel: adv?.overall_risk_assessment?.risk_level || opponentStore.risk?.riskLevel || 'MODERATE',
      missingEvidence: (adv?.missing_evidence || []).map((m: any) => ({ label: m.item, category: m.category })),
      contradictions: (adv?.contradictions_inconsistencies || []).map((c: any) => ({ type: c.issue, argument: c.explanation })),
      defenseConsiderations: (adv?.defense_priorities || []).map((p: any) => p.action_recommended),
      redFlags: (adv?.detected_defense_vulnerabilities || []).map((v: any) => ({ title: v.title, description: v.description })),
    },
    defenseArguments: [opponentStore.defenseArguments].filter(Boolean),
    opponentArguments: (adv?.likely_prosecution_arguments || []).map((arg: any, i: number) => ({
      id: `ARG-${i + 1}`,
      title: arg.title,
      opponentPosition: arg.argument,
      reasoningBehind: `Supporting evidence: ${arg.supporting_evidence} | Objective: ${arg.prosecution_objective}`,
      priority: arg.strength === 'Strong' ? 'HIGH' : arg.strength === 'Moderate' ? 'MEDIUM' : 'LOW',
      likelihood: `${arg.confidence}%`,
      category: 'Prosecution Strategy',
      counterStrategy: {
        evidenceToStrengthen: [arg.expected_defense_response],
      }
    })),
    opponentStrategies: adv?.prosecution_theory_of_case ? [
      adv.prosecution_theory_of_case.narrative,
      ...(adv.prosecution_theory_of_case.evidentiary_chain || [])
    ] : [],
    evidence: {
      physicalEvidence: opponentStore.physicalEvidenceType ? `${opponentStore.physicalEvidenceQuantity || ''} ${opponentStore.physicalEvidenceType} at ${opponentStore.physicalEvidenceLocation || 'scene'}` : 'None explicitly specified',
      forensicReport: opponentStore.forensicReportStatus || adv?.forensic_chain_of_custody_analysis?.forensic_report_status || 'Unknown',
      chainOfCustody: opponentStore.chainOfCustodyStatus || adv?.forensic_chain_of_custody_analysis?.transfers_and_custody_records || 'Unknown',
      witnesses: (adv?.witness_analysis || []).map((w: any) => ({ name: w.witness_name_role, role: w.witness_category, expected: w.expected_testimony })),
      evidenceGaps: (adv?.missing_evidence || []).map((m: any) => ({ label: m.item, whyItMatters: m.impact_on_prosecution, opponentAdvantage: m.defense_advantage })),
    }
  };
}

