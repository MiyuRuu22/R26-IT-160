import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  useAnalyzerStore,
  DefenseAnalysisResult,
  WeakWordItem,
  MissingEvidenceItem,
  ContradictionItem,
  LawResult,
  DefenseCaseResult,
  RedFlagItem,
} from '../../store/useAnalyzerStore';

const P = {
  ink: '#0e0e0c', paper: '#f4f1ea', paper2: '#ece8df',
  muted: '#6b685f', border: '#e0dbcb', accent: '#b8412c', white: '#ffffff',
};

const RISK_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  'LOW':       { bg: '#f0fdf4', border: '#4ade80', text: '#14532d' },
  'MEDIUM':    { bg: '#fffbeb', border: '#fbbf24', text: '#92400e' },
  'HIGH':      { bg: '#fff7ed', border: '#fb923c', text: '#9a3412' },
  'VERY HIGH': { bg: '#fef2f2', border: '#f87171', text: '#991b1b' },
};

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? '#14532d' : pct >= 45 ? '#92400e' : '#991b1b';
  const bg = pct >= 70 ? '#f0fdf4' : pct >= 45 ? '#fffbeb' : '#fef2f2';
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: bg, borderWidth: 1, borderColor: color }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color }}>{pct}%</Text>
    </View>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 20 }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, letterSpacing: 1.5, color: P.muted, textTransform: 'uppercase' }}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: P.paper2, borderWidth: 1, borderColor: P.border }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted }}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={{ backgroundColor: P.white, borderWidth: 1, borderColor: P.border, borderRadius: 4, padding: 12, marginBottom: 8, ...style }}>
      {children}
    </View>
  );
}

// ── Detected Issue card ────────────────────────────────────────────────────────
function IssueCard({ r }: { r: DefenseAnalysisResult }) {
  const pct = Math.round(r.confidence * 100);
  return (
    <View style={{ backgroundColor: P.ink, borderRadius: 4, padding: 16, marginBottom: 4 }}>
      <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: 'rgba(244,241,234,0.5)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
        Detected Legal Issue
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: P.paper, flex: 1, letterSpacing: -0.3 }}>
          {r.detected_label}
        </Text>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: '#fb923c' }}>{pct}%</Text>
      </View>
      <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
        <View style={{ height: 3, width: `${pct}%`, backgroundColor: '#fb923c', borderRadius: 2 }} />
      </View>
      {r.matched_keywords.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {r.matched_keywords.map((kw, i) => (
            <View key={i} style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: 'rgba(244,241,234,0.7)' }}>{kw}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Risk card ─────────────────────────────────────────────────────────────────
function RiskCard({ level, label }: { level: string; label: string }) {
  const s = RISK_STYLE[level] ?? RISK_STYLE['HIGH'];
  return (
    <View style={{ backgroundColor: s.bg, borderWidth: 1, borderColor: s.border, borderRadius: 4, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View>
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: s.text, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Prosecution Risk Level</Text>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: s.text }}>{label}</Text>
      </View>
      <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: s.border }}>
        <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 12, color: '#fff' }}>{level}</Text>
      </View>
    </View>
  );
}

// ── Advanced Red Flag ─────────────────────────────────────────────────────────
function RedFlagCard({ item }: { item: RedFlagItem }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card style={{ borderLeftWidth: 3, borderLeftColor: '#ef4444', backgroundColor: '#fef2f2' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10, color: '#fff' }}>!</Text>
          </View>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: '#991b1b', flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {item.title}
          </Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#991b1b' }}>{exp ? '▲' : '▼'}</Text>
        </View>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#7f1d1d', lineHeight: 16 }}>
          {item.description}
        </Text>
        {exp && (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fca5a5' }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 9.5, color: '#991b1b', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Defense Tip</Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#7f1d1d', lineHeight: 16 }}>
              {item.defense_tip}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ── Weak wording ──────────────────────────────────────────────────────────────
function WeakWordCard({ item }: { item: WeakWordItem }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fb923c' }} />
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: '#9a3412', flex: 1 }}>
            "{item.detected_word}"
          </Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: P.muted }}>{exp ? '▲' : '▼'}</Text>
        </View>
        {item.original_sentence ? (
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, fontStyle: 'italic', lineHeight: 15, marginBottom: 4 }} numberOfLines={exp ? undefined : 2}>
            "{item.original_sentence}"
          </Text>
        ) : null}
        {exp && (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: P.border }}>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 16 }}>
              {item.defense_argument}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ── Missing evidence ──────────────────────────────────────────────────────────
function MissingCard({ item }: { item: MissingEvidenceItem }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card style={{ borderLeftWidth: 3, borderLeftColor: '#f87171' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: '#991b1b', flex: 1 }}>{item.label}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: P.muted }}>{exp ? '▲' : '▼'}</Text>
        </View>
        {exp && (
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 16, marginTop: 8 }}>
            {item.defense_argument}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ── Contradictions ────────────────────────────────────────────────────────────
function ContradictionCard({ item }: { item: ContradictionItem }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card style={{ borderLeftWidth: 3, borderLeftColor: '#fbbf24' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 }}>{item.type}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: P.muted }}>{exp ? '▲' : '▼'}</Text>
        </View>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink }}>{item.detected}</Text>
        {exp && item.context ? (
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, fontStyle: 'italic', marginTop: 6, lineHeight: 15 }}>
            Context: "{item.context}"
          </Text>
        ) : null}
        {exp && (
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 16, marginTop: 8 }}>
            {item.argument}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ── Defense considerations ────────────────────────────────────────────────────
function DefenseCard({ items }: { items: string[] }) {
  return (
    <Card>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: i < items.length - 1 ? 10 : 0 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: P.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.paper }}>{i + 1}</Text>
          </View>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.ink, lineHeight: 17, flex: 1 }}>{item}</Text>
        </View>
      ))}
    </Card>
  );
}

// ── Similar case ──────────────────────────────────────────────────────────────
function CaseCard({ item, index }: { item: DefenseCaseResult; index: number }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: P.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color: P.paper }}>{index + 1}</Text>
            </View>
          </View>
          <ScorePill score={item.similarity_score} />
        </View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 13, color: P.ink, lineHeight: 18 }}>
          {item.parties || item.case_id || 'Unknown Case'}
        </Text>
        {item.description ? (
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.muted, lineHeight: 15, marginTop: 4 }} numberOfLines={exp ? undefined : 2}>
            {item.description}
          </Text>
        ) : null}
        {exp && item.keywords ? (
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted, marginTop: 6 }}>
            Keywords: {item.keywords}
          </Text>
        ) : null}
        {exp && item.date_str ? (
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted, marginTop: 3 }}>
            Date: {item.date_str}
          </Text>
        ) : null}
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#b0ad9e', marginTop: 8, textAlign: 'right' }}>
          {exp ? 'Tap to collapse ▲' : 'Tap to expand ▼'}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

// ── Law card ──────────────────────────────────────────────────────────────────
function LawCard({ item, index }: { item: LawResult; index: number }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: P.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color: P.paper }}>{index + 1}</Text>
            </View>
            {item.category ? (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, backgroundColor: P.paper2, borderWidth: 1, borderColor: P.border }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 7.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{item.category}</Text>
              </View>
            ) : null}
          </View>
          <ScorePill score={item.similarity_score} />
        </View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 13, color: P.ink, lineHeight: 18 }}>
          {item.act_name || 'Unknown Act'}
        </Text>
        {item.section ? (
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: P.muted, marginTop: 2 }}>
            Section {item.section}{item.section_title ? ` — ${item.section_title}` : ''}
          </Text>
        ) : null}
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#3d3b35', lineHeight: 15, marginTop: 6 }} numberOfLines={exp ? undefined : 3}>
          {item.law_text}
        </Text>
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#b0ad9e', marginTop: 8, textAlign: 'right' }}>
          {exp ? 'Tap to collapse ▲' : 'Tap to expand ▼'}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export function DefenseResultsScreen() {
  const navigation = useNavigation<any>();
  const { defenseResults, clearResults } = useAnalyzerStore();
  const r = defenseResults;

  if (!r) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: P.paper }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 16, color: P.muted, textAlign: 'center' }}>
            No analysis results.{'\n'}Run a Defense Analysis first.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: P.ink, borderRadius: 4 }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: P.ink }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: P.paper }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: P.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: P.white }}>
        <TouchableOpacity
          onPress={() => { clearResults(); navigation.goBack(); }}
          style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: P.ink, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: P.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: P.ink }}>Defense Analysis</Text>
        <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: P.border, backgroundColor: P.paper2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.ink }}>⚖</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>

        {/* 1. Detected Issue */}
        <IssueCard r={r} />

        {/* 2. Risk Level */}
        <View style={{ marginTop: 8, marginBottom: 4 }}>
          <RiskCard level={r.risk_level} label={r.risk_label} />
        </View>

        {/* 2.5 Critical Vulnerabilities & Red Flags */}
        {r.advanced_red_flags && r.advanced_red_flags.length > 0 && (
          <>
            <SectionHeader label="Critical Vulnerabilities & Red Flags" count={r.advanced_red_flags.length} />
            {r.advanced_red_flags.map((item, i) => <RedFlagCard key={i} item={item} />)}
          </>
        )}

        {/* 3. Weak Legal Wording */}
        {r.weak_wording.length > 0 && (
          <>
            <SectionHeader label="Weak Legal Wording" count={r.weak_wording.length} />
            {r.weak_wording.map((item, i) => <WeakWordCard key={i} item={item} />)}
          </>
        )}

        {/* 4. Missing Evidence */}
        {r.missing_evidence.length > 0 && (
          <>
            <SectionHeader label="Missing Evidence" count={r.missing_evidence.length} />
            {r.missing_evidence.map((item, i) => <MissingCard key={i} item={item} />)}
          </>
        )}

        {/* 5. Contradictions */}
        {r.contradictions.length > 0 && (
          <>
            <SectionHeader label="Contradictions Detected" count={r.contradictions.length} />
            {r.contradictions.map((item, i) => <ContradictionCard key={i} item={item} />)}
          </>
        )}

        {/* 6. Defense Considerations */}
        {r.defense_considerations.length > 0 && (
          <>
            <SectionHeader label="Defense Considerations" />
            <DefenseCard items={r.defense_considerations} />
          </>
        )}

        {/* 7. Similar Cases */}
        {r.similar_cases.length > 0 && (
          <>
            <SectionHeader label="Similar Cases" count={r.similar_cases.length} />
            {r.similar_cases.map((item, i) => <CaseCard key={i} item={item} index={i} />)}
          </>
        )}

        {/* 8. Relevant Laws */}
        {r.similar_laws.length > 0 && (
          <>
            <SectionHeader label="Relevant Laws" count={r.similar_laws.length} />
            {r.similar_laws.map((item, i) => <LawCard key={i} item={item} index={i} />)}
          </>
        )}

        {/* New Analysis button */}
        <TouchableOpacity
          onPress={() => { clearResults(); navigation.goBack(); }}
          style={{ marginTop: 16, paddingVertical: 14, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: P.ink, backgroundColor: 'transparent' }}
        >
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: P.ink }}>← New Analysis</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9, color: P.muted, textAlign: 'center', marginTop: 12, lineHeight: 14 }}>
          Advisory only · Not a substitute for qualified legal advice · Human-in-the-Loop validation required
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
