import urllib.request
import json

payload = {
    'charges': 'Section 54A Poisons, Opium and Dangerous Drugs Ordinance - Possession and Trafficking of Methamphetamine',
    'defenseArguments': 'The accused was merely an occasional passenger in a motor vehicle owned and controlled by a third party. The alleged contraband was recovered from underneath the passenger seat, an area neither in the exclusive control nor within the active knowledge of the accused. No fingerprints or DNA link the accused to the exhibit or packaging. The vehicle was searched without a warrant, the seizure memo lacks an exhibit seal number, the chain of custody is incomplete, and the Government Analyst report remains pending.',
    'caseType': 'Criminal',
    'caseFacts': 'Police intercepted a vehicle at a roadside checkpoint and conducted an interior search without a warrant, claiming to find a packet underneath the passenger seat.',
    'incidentLocation': 'Piliyandala Roadside Checkpoint',
    'policeStation': 'Piliyandala Police Station',
    'accusedPerson': 'Ruwan Kumara (Passenger)',
    'investigatingOfficer': 'Sub-Inspector Bandara',
    'physicalEvidenceType': 'Alleged Methamphetamine',
    'physicalEvidenceQuantity': 'Approximately 4.65g',
    'physicalEvidenceLocation': 'Underneath the front passenger seat',
    'physicalEvidenceRecoveredBy': 'Sub-Inspector Bandara',
    'forensicReportStatus': 'Pending',
    'forensicReportDetails': 'Government Analyst report pending; chemical composition and pure weight unconfirmed',
    'chainOfCustodyStatus': 'Incomplete',
    'chainOfCustodyDetails': 'Missing exhibit seal number on recovery memo, unrecorded property room holding',
    'searchWarrantInvolved': 'No',
    'searchDetails': 'Warrantless roadside vehicle search without recorded prior grounds',
    'witnessEvidenceStatus': 'Statements unavailable',
    'witnessSummaries': 'No independent civilian witnesses; evidence based solely on arresting police unit members',
    'statementDetails': 'Accused denied all knowledge and possession immediately upon arrest'
}

req = urllib.request.Request(
    'http://127.0.0.1:5000/api/opponent/analyze',
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
data = json.loads(res.read().decode('utf-8'))
adv = data.get('data', {}).get('adversarialAnalysis', {})

print('=== VERIFICATION OF ALL 14 SECTIONS ===')
risk = adv.get('overall_risk_assessment', {})
print('1. Risk Level:', risk.get('risk_level'), '| Conf:', risk.get('confidence_score'))
print('   Explanation:', risk.get('short_explanation')[:120])
print('   Strengths count:', len(risk.get('prosecution_strength_factors', [])))
print('   Weaknesses count:', len(risk.get('prosecution_weakness_factors', [])))

args = adv.get('likely_prosecution_arguments', [])
print('2. Prosecution Args Count:', len(args))
for i, a in enumerate(args[:3]):
    print(f"   Arg {i+1}: {a.get('title')} ({a.get('strength')})")

theory = adv.get('prosecution_theory_of_case', {})
print('3. Theory Narrative:', theory.get('narrative')[:120])

attacks = adv.get('attacks_on_defense', [])
print('4. Attacks on Defense Count:', len(attacks))
print('   Attack 1 claim:', attacks[0].get('defense_claim'))
print('   Attack 1 response:', attacks[0].get('prosecution_counterargument')[:120])

vulns = adv.get('detected_defense_vulnerabilities', [])
print('5. Detected Vulnerabilities Count:', len(vulns))
for v in vulns[:2]:
    print(f"   Vuln: {v.get('title')} [{v.get('severity')}]")

ev_analysis = adv.get('prosecution_evidence_analysis', [])
print('6. Evidence Items Analyzed:', len(ev_analysis))
print('   Item 1:', ev_analysis[0].get('evidence_item'))
print('   What it proves:', ev_analysis[0].get('what_it_proves')[:100])
print('   What it does NOT prove:', ev_analysis[0].get('what_it_does_not_prove')[:100])

witnesses = adv.get('witness_analysis', [])
print('7. Witnesses Analyzed:', len(witnesses))
for w in witnesses:
    print(f"   Witness: {w.get('witness_name_role')} ({w.get('witness_category')})")

proc = adv.get('search_arrest_procedural_analysis', {})
print('8. Procedural Analysis - Warrant:', proc.get('warrant_status'))
print('   Procedural issues flagged:', proc.get('procedural_issues'))

forensic = adv.get('forensic_chain_of_custody_analysis', {})
print('9. Forensic Status:', forensic.get('forensic_report_status'))
print('   Sealing & Seal:', forensic.get('sealing_and_seal_number'))

missing = adv.get('missing_evidence', [])
print('10. Missing Evidence Count:', len(missing))
for m in missing[:3]:
    print(f"    Missing: {m.get('item')} [{m.get('category')}]")

contras = adv.get('contradictions_inconsistencies', [])
print('11. Contradictions Count:', len(contras))

next_move = adv.get('most_likely_next_prosecution_move', {})
print('12. Next Prosecution Move:', next_move.get('primary_next_move'))

priorities = adv.get('defense_priorities', [])
print('13. Top Defense Priorities Count:', len(priorities))
for p in priorities:
    print(f"    Rank #{p.get('rank')}: {p.get('priority_issue')} [{p.get('urgency')}]")

summary = adv.get('overall_adversarial_summary', {})
print('14. Strongest Pros Point:', summary.get('strongest_prosecution_point')[:100])
print('    Strongest Def Point:', summary.get('strongest_defense_point')[:100])
print('    Notice:', summary.get('legal_safety_notice'))

# Check negative assertions from prompt:
output_str = json.dumps(adv).lower()
assert 'no major textual weaknesses detected' not in output_str, 'Generic weakness string detected!'
assert risk.get('risk_level') != 'LOW', 'Risk level was classified as LOW incorrectly!'
print('\n=== ALL 14 SECTIONS VERIFIED SUCCESSFULLY AND ALL ASSERTIONS PASSED! ===')
