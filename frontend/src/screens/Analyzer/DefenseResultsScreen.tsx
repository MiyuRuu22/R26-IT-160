import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
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
  AnalysisVersionItem,
  DiffSummary,
  OpponentArgument,
  OpponentEvidenceAttack,
  OpponentEvidenceGap,
  OpponentContradiction,
  OpponentCaseReference,
  OpponentTabData,
  ArgumentPriority,
} from '../../store/useAnalyzerStore';
import { useOpponentStore } from '../../store/useOpponentStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const P = {
  ink: '#0e0e0c',
  paper: '#f4f1ea',
  paper2: '#ece8df',
  muted: '#6b685f',
  border: '#e0dbcb',
  accent: '#b8412c',
  white: '#ffffff',
};

const RISK_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  'LOW':       { bg: '#f0fdf4', border: '#4ade80', text: '#14532d' },
  'MEDIUM':    { bg: '#fffbeb', border: '#fbbf24', text: '#92400e' },
  'HIGH':      { bg: '#fff7ed', border: '#fb923c', text: '#9a3412' },
  'VERY HIGH': { bg: '#fef2f2', border: '#f87171', text: '#991b1b' },
};

const PRIORITY_STYLE: Record<ArgumentPriority, { bg: string; border: string; text: string; label: string }> = {
  HIGH:   { bg: '#fef2f2', border: '#f87171', text: '#991b1b', label: 'HIGH PRIORITY' },
  MEDIUM: { bg: '#fffbeb', border: '#fbbf24', text: '#92400e', label: 'MEDIUM PRIORITY' },
  LOW:    { bg: '#f0fdf4', border: '#4ade80', text: '#14532d', label: 'LOW PRIORITY' },
};

// ── Shared ────────────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? '#14532d' : pct >= 45 ? '#92400e' : '#991b1b';
  const bg    = pct >= 70 ? '#f0fdf4' : pct >= 45 ? '#fffbeb' : '#fef2f2';
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: bg, borderWidth: 1, borderColor: color }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color }}>{pct}%</Text>
    </View>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 20 }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, letterSpacing: 1.5, color: P.muted, textTransform: 'uppercase' }}>{label}</Text>
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

// ── Analysis Results Tab components (original) ────────────────────────────────

function VersionHistoryBar({ history, currentIndex, onSelect }: { history: AnalysisVersionItem[]; currentIndex: number; onSelect: (idx: number) => void }) {
  if (history.length <= 1) return null;
  return (
    <View style={{ marginBottom: 12, backgroundColor: P.white, borderWidth: 1, borderColor: P.border, borderRadius: 6, padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase', color: P.muted }}>Analysis History</Text>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted }}>{history.length} versions generated</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {history.map((v, i) => {
          const active = i === currentIndex;
          return (
            <TouchableOpacity key={i} onPress={() => onSelect(i)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderWidth: 1, borderColor: active ? P.ink : P.border, backgroundColor: active ? P.ink : P.paper, minWidth: 125 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 12, color: active ? P.paper : P.ink }}>Version {v.version} {i === 0 ? '(Initial)' : '(Updated)'}</Text>
                {active && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fb923c' }} />}
              </View>
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: active ? 'rgba(244,241,234,0.7)' : P.muted, marginTop: 4 }}>{v.formattedDate}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function AnalysisUpdatedBanner({ diff, versionNumber }: { diff?: DiffSummary; versionNumber: number }) {
  if (!diff || versionNumber <= 1) return null;
  return (
    <View style={{ backgroundColor: '#fcfaf6', borderWidth: 1, borderColor: '#e8dcbe', borderLeftWidth: 4, borderLeftColor: '#fb923c', borderRadius: 6, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 14, color: P.ink }}>Analysis Updated</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: '#fef3c7' }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: '#92400e' }}>Version {versionNumber}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.muted, marginBottom: 10, lineHeight: 16 }}>
        Analysis updated using {diff.additionalDetailsCount > 0 ? `${diff.additionalDetailsCount} additional case details` : 'new case information'}.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {diff.missingEvidenceCountChange && (
          <View style={{ backgroundColor: P.white, borderWidth: 1, borderColor: P.border, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase' }}>Missing Evidence</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.ink }}>{diff.missingEvidenceCountChange.from} → {diff.missingEvidenceCountChange.to}</Text>
          </View>
        )}
        {diff.riskChange && (
          <View style={{ backgroundColor: P.white, borderWidth: 1, borderColor: P.border, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase' }}>Risk Level</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.ink }}>{diff.riskChange.from} → {diff.riskChange.to}</Text>
          </View>
        )}
        {diff.confidenceChange && (
          <View style={{ backgroundColor: P.white, borderWidth: 1, borderColor: P.border, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase' }}>Confidence</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.ink }}>{diff.confidenceChange.from}% → {diff.confidenceChange.to}%</Text>
          </View>
        )}
      </View>
      {diff.resolvedMissingEvidence && diff.resolvedMissingEvidence.length > 0 && (
        <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee6d3' }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: '#15803d', marginBottom: 4 }}>RESOLVED EVIDENCE GAPS:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {diff.resolvedMissingEvidence.map((item, i) => (
              <View key={i} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 3, backgroundColor: '#dcfce7' }}>
                <Text style={{ fontFamily: 'InterTight_500Medium', fontSize: 9, color: '#166534' }}>✓ {item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function IssueCard({ r }: { r: DefenseAnalysisResult }) {
  const pct = Math.round(r.confidence * 100);
  return (
    <View style={{ backgroundColor: P.ink, borderRadius: 4, padding: 16, marginBottom: 4 }}>
      <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: 'rgba(244,241,234,0.5)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Detected Legal Issue</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: P.paper, flex: 1, letterSpacing: -0.3 }}>{r.detected_label}</Text>
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

function NewDefenseConsiderationsCard({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Card style={{ borderLeftWidth: 3, borderLeftColor: '#3b82f6', backgroundColor: '#f0f9ff' }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>New Defense Considerations (Advisory)</Text>
      {items.map((item, i) => (
        <View key={i} style={{ marginBottom: i < items.length - 1 ? 8 : 0 }}>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#1e3a8a', lineHeight: 16 }}>• {item}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#60a5fa', marginTop: 2 }}>Review required: Lawyer</Text>
        </View>
      ))}
    </Card>
  );
}

function RedFlagCard({ item }: { item: RedFlagItem }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card style={{ borderLeftWidth: 3, borderLeftColor: '#ef4444', backgroundColor: '#fef2f2' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10, color: '#fff' }}>!</Text>
          </View>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: '#991b1b', flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.title}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#991b1b' }}>{exp ? '▲' : '▼'}</Text>
        </View>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#7f1d1d', lineHeight: 16 }}>{item.description}</Text>
        {exp && (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fca5a5' }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 9.5, color: '#991b1b', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Defense Tip</Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#7f1d1d', lineHeight: 16 }}>{item.defense_tip}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function WeakWordCard({ item }: { item: WeakWordItem }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fb923c' }} />
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: '#9a3412', flex: 1 }}>"{item.detected_word}"</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: P.muted }}>{exp ? '▲' : '▼'}</Text>
        </View>
        {item.original_sentence ? (
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, fontStyle: 'italic', lineHeight: 15, marginBottom: 4 }} numberOfLines={exp ? undefined : 2}>
            "{item.original_sentence}"
          </Text>
        ) : null}
        {exp && (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: P.border }}>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 16 }}>{item.defense_argument}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function MissingCard({ item }: { item: MissingEvidenceItem }) {
  const [exp, setExp] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExp(v => !v)}>
      <Card style={{ borderLeftWidth: 3, borderLeftColor: '#f87171' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: '#991b1b', flex: 1 }}>{item.label}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: P.muted }}>{exp ? '▲' : '▼'}</Text>
        </View>
        {exp && <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 16, marginTop: 8 }}>{item.defense_argument}</Text>}
      </Card>
    </TouchableOpacity>
  );
}

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
        {exp && item.context ? <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, fontStyle: 'italic', marginTop: 6, lineHeight: 15 }}>Context: "{item.context}"</Text> : null}
        {exp && <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 16, marginTop: 8 }}>{item.argument}</Text>}
      </Card>
    </TouchableOpacity>
  );
}

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
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 13, color: P.ink, lineHeight: 18 }}>{item.parties || item.case_id || 'Unknown Case'}</Text>
        {item.description ? <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.muted, lineHeight: 15, marginTop: 4 }} numberOfLines={exp ? undefined : 2}>{item.description}</Text> : null}
        {exp && item.keywords ? <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted, marginTop: 6 }}>Keywords: {item.keywords}</Text> : null}
        {exp && item.date_str ? <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted, marginTop: 3 }}>Date: {item.date_str}</Text> : null}
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#b0ad9e', marginTop: 8, textAlign: 'right' }}>{exp ? 'Tap to collapse ▲' : 'Tap to expand ▼'}</Text>
      </Card>
    </TouchableOpacity>
  );
}

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
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 13, color: P.ink, lineHeight: 18 }}>{item.act_name || 'Unknown Act'}</Text>
        {item.section ? <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: P.muted, marginTop: 2 }}>Section {item.section}{item.section_title ? ` — ${item.section_title}` : ''}</Text> : null}
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#3d3b35', lineHeight: 15, marginTop: 6 }} numberOfLines={exp ? undefined : 3}>{item.law_text}</Text>
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#b0ad9e', marginTop: 8, textAlign: 'right' }}>{exp ? 'Tap to collapse ▲' : 'Tap to expand ▼'}</Text>
      </Card>
    </TouchableOpacity>
  );
}

// ── Opponent Arguments Tab components ─────────────────────────────────────────

const LOADING_STEPS = [
  'Reviewing case facts',
  'Reviewing legal issues',
  'Identifying potential opponent arguments',
  'Reviewing evidence weaknesses',
  'Comparing relevant cases',
  'Preparing counter-strategy',
];

function OpponentLoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentStep(prev => { if (prev < LOADING_STEPS.length - 1) return prev + 1; clearInterval(id); return prev; });
    }, 180);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <View style={{ alignItems: 'flex-start', width: '100%', maxWidth: 320 }}>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 15, color: P.ink, marginBottom: 4 }}>Analyzing opposing-side possibilities...</Text>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.muted, marginBottom: 20, lineHeight: 16 }}>Generating potential opponent arguments from current case data.</Text>
        {LOADING_STEPS.map((step, i) => {
          const done = i < currentStep; const active = i === currentStep;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: done ? '#14532d' : active ? P.ink : P.paper2, borderWidth: 1, borderColor: done ? '#4ade80' : active ? P.ink : P.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: done ? '#fff' : active ? P.paper : P.muted }}>{done ? '✓' : active ? '⟳' : '○'}</Text>
              </View>
              <Text style={{ fontFamily: done ? 'InterTight_600SemiBold' : 'InterTight_400Regular', fontSize: 11, color: done ? '#14532d' : active ? P.ink : P.muted }}>{step}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function OpponentSummaryRow({ summary }: { summary: OpponentTabData['summary'] }) {
  const items = [
    { label: 'Arguments',      value: summary.totalArguments,          color: '#fb923c' },
    { label: 'High Priority',  value: summary.highPriority,            color: '#991b1b' },
    { label: 'Evidence Risks', value: summary.evidenceRisks,           color: '#9a3412' },
    { label: 'Contradictions', value: summary.potentialContradictions, color: '#92400e' },
    { label: 'Evidence Gaps',  value: summary.evidenceGaps,            color: '#92400e' },
  ];
  return (
    <View style={{ backgroundColor: P.ink, borderRadius: 6, padding: 14, marginBottom: 16 }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: 'rgba(244,241,234,0.5)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Opponent Argument Assessment</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item, i) => (
          <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, minWidth: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: item.color }}>{item.value}</Text>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 7.5, color: 'rgba(244,241,234,0.55)', marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9, color: 'rgba(244,241,234,0.4)', marginTop: 10, lineHeight: 14 }}>
        Figures represent system-identified potential risks. Review required by a qualified legal professional.
      </Text>
    </View>
  );
}

function PriorityBadge({ priority }: { priority: ArgumentPriority }) {
  const s = PRIORITY_STYLE[priority];
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, backgroundColor: s.bg, borderWidth: 1, borderColor: s.border }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 7.5, color: s.text }}>{s.label}</Text>
    </View>
  );
}

function CategoryBadge({ category }: { category: OpponentArgument['category'] }) {
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 3, backgroundColor: P.paper2, borderWidth: 1, borderColor: P.border }}>
      <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 7.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{category}</Text>
    </View>
  );
}

function OpponentArgumentCard({ arg, defaultExpanded = false }: { arg: OpponentArgument; defaultExpanded?: boolean }) {
  const [exp, setExp]           = useState(defaultExpanded);
  const [showCounter, setShowCounter] = useState(false);
  const s = PRIORITY_STYLE[arg.priority];
  const toggle = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExp(v => !v); if (exp) setShowCounter(false); };
  return (
    <View style={{ backgroundColor: P.white, borderWidth: 1, borderColor: P.border, borderLeftWidth: 3, borderLeftColor: s.border, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
      <TouchableOpacity activeOpacity={0.85} onPress={toggle} style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1, marginRight: 8 }}>
            <PriorityBadge priority={arg.priority} />
            <CategoryBadge category={arg.category} />
          </View>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: P.muted }}>{exp ? '▲' : '▼'}</Text>
        </View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 14, color: P.ink, lineHeight: 19 }}>{arg.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 3, backgroundColor: s.bg, borderWidth: 1, borderColor: s.border }}>
            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 7.5, color: s.text }}>POTENTIAL LIKELIHOOD: {arg.likelihood}</Text>
          </View>
        </View>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: P.muted, marginTop: 4, lineHeight: 14 }}>{arg.likelihoodExplanation}</Text>
      </TouchableOpacity>
      {exp && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <View style={{ height: 1, backgroundColor: P.border, marginBottom: 12 }} />
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Opponent's Likely Position</Text>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.ink, lineHeight: 17, marginBottom: 12 }}>{arg.opponentPosition}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Why They May Raise This</Text>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.ink, lineHeight: 17, marginBottom: 12 }}>{arg.reasoningBehind}</Text>
          {arg.legalBasis.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Supporting Legal Basis</Text>
              {arg.legalBasis.map((lb, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: '#7c6f5b' }}>§</Text>
                  <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, flex: 1, lineHeight: 15 }}>{lb}</Text>
                </View>
              ))}
            </View>
          )}
          {arg.evidenceTheyMayChallenge.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Evidence They May Challenge</Text>
              {arg.evidenceTheyMayChallenge.map((ev, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 3 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#ef4444' }}>↳</Text>
                  <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#7f1d1d', flex: 1, lineHeight: 15 }}>{ev}</Text>
                </View>
              ))}
            </View>
          )}
          {arg.weaknessesTheyExploit.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Weaknesses They May Exploit</Text>
              {arg.weaknessesTheyExploit.map((w, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 3 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#fbbf24' }}>⚠</Text>
                  <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, flex: 1, lineHeight: 15 }}>{w}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity activeOpacity={0.85} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowCounter(v => !v); }} style={{ backgroundColor: showCounter ? P.ink : P.paper2, borderRadius: 4, paddingVertical: 9, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: showCounter ? P.ink : P.border }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: showCounter ? P.paper : P.ink }}>Recommended Counter-Strategy</Text>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: showCounter ? P.paper : P.muted }}>{showCounter ? '▲ Hide' : '▼ Show'}</Text>
          </TouchableOpacity>
          {showCounter && (
            <View style={{ backgroundColor: '#f8f7f4', borderWidth: 1, borderColor: P.border, borderTopWidth: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, padding: 12 }}>
              {arg.counterStrategy.evidenceToStrengthen.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#14532d', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Evidence to Strengthen / Collect</Text>
                  {arg.counterStrategy.evidenceToStrengthen.map((e, i) => <Text key={i} style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15, marginBottom: 2 }}>• {e}</Text>)}
                </View>
              )}
              {arg.counterStrategy.factsToVerify.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Facts to Verify</Text>
                  {arg.counterStrategy.factsToVerify.map((f, i) => <Text key={i} style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15, marginBottom: 2 }}>• {f}</Text>)}
                </View>
              )}
              {arg.counterStrategy.legalAuthoritiesToReview.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Legal Authorities to Review</Text>
                  {arg.counterStrategy.legalAuthoritiesToReview.map((l, i) => <Text key={i} style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15, marginBottom: 2 }}>§ {l}</Text>)}
                </View>
              )}
              {arg.counterStrategy.questionsToInvestigate.length > 0 && (
                <View>
                  <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Questions to Investigate</Text>
                  {arg.counterStrategy.questionsToInvestigate.map((q, i) => <Text key={i} style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15, marginBottom: 2 }}>? {q}</Text>)}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function EvidenceAttackCard({ item }: { item: OpponentEvidenceAttack }) {
  const riskS = PRIORITY_STYLE[item.risk];
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.ink, flex: 1, marginRight: 8, lineHeight: 15 }}>{item.evidence}</Text>
        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 3, backgroundColor: riskS.bg, borderWidth: 1, borderColor: riskS.border }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 7.5, color: riskS.text }}>{item.risk}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Possible Attack</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#7f1d1d', lineHeight: 15, marginBottom: 8 }}>{item.possibleAttack}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Preparation</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15 }}>{item.preparation}</Text>
    </Card>
  );
}

function EvidenceGapCard({ item }: { item: OpponentEvidenceGap }) {
  return (
    <Card style={{ borderLeftWidth: 3, borderLeftColor: '#fbbf24' }}>
      <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.ink, marginBottom: 6 }}>{item.label}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Why it matters</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15, marginBottom: 8 }}>{item.whyItMatters}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Opponent advantage</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#92400e', lineHeight: 15, marginBottom: 8 }}>{item.opponentAdvantage}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Preparation</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15 }}>{item.preparation}</Text>
    </Card>
  );
}

function OpponentContradictionCard({ item }: { item: OpponentContradiction }) {
  return (
    <Card style={{ borderLeftWidth: 3, borderLeftColor: '#fbbf24', backgroundColor: '#fffef7' }}>
      <View style={{ marginBottom: 6 }}>
        <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Potential Inconsistency Detected</Text>
        <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10.5, color: P.ink }}>A: {item.statementA}</Text>
        <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10.5, color: P.ink, marginTop: 2 }}>B: {item.statementB}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: '#fde68a', marginBottom: 8 }} />
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Why inconsistent</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15, marginBottom: 8 }}>{item.whyInconsistent}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Potential opponent argument</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#92400e', lineHeight: 15, marginBottom: 8 }}>{item.potentialArgument}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Recommended clarification</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15 }}>{item.recommendedClarification}</Text>
    </Card>
  );
}

function OpponentCaseCard({ item }: { item: OpponentCaseReference }) {
  const pct = Math.round(item.similarityScore * 100);
  const color = pct >= 70 ? '#14532d' : pct >= 45 ? '#92400e' : '#991b1b';
  const bg    = pct >= 70 ? '#f0fdf4' : pct >= 45 ? '#fffbeb' : '#fef2f2';
  return (
    <Card style={{ borderLeftWidth: 3, borderLeftColor: '#f87171' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted }}>{item.caseId}</Text>
        <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: bg, borderWidth: 1, borderColor: color }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color }}>{pct}% similar</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 13, color: P.ink, lineHeight: 18, marginBottom: 4 }}>{item.parties}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Relevant issue</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: P.ink, lineHeight: 15, marginBottom: 8 }}>{item.relevantIssue}</Text>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Why it may help the opponent</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#7f1d1d', lineHeight: 15, marginBottom: 8 }}>{item.whyHelpsOpponent}</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, lineHeight: 15, fontStyle: 'italic' }}>{item.relevantArgument}</Text>
    </Card>
  );
}

type FilterType = 'All' | 'High' | 'Medium' | 'Low' | 'Evidence' | 'Legal' | 'Procedural' | 'Witness' | 'Documentation';
const FILTER_CHIPS: FilterType[] = ['All', 'High', 'Medium', 'Low', 'Evidence', 'Legal', 'Procedural', 'Witness', 'Documentation'];

function FilterBar({ active, onSelect, searchText, onSearch }: { active: FilterType; onSelect: (f: FilterType) => void; searchText: string; onSearch: (t: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ backgroundColor: P.white, borderWidth: 1, borderColor: P.border, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: P.muted }}>⌕</Text>
        <TextInput value={searchText} onChangeText={onSearch} placeholder="Search arguments..." placeholderTextColor={P.muted} style={{ flex: 1, fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.ink, padding: 0 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 2 }}>
        {FILTER_CHIPS.map(chip => {
          const isActive = active === chip;
          return (
            <TouchableOpacity key={chip} onPress={() => onSelect(chip)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: isActive ? P.ink : P.border, backgroundColor: isActive ? P.ink : P.white }}>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10, color: isActive ? P.paper : P.muted }}>{chip}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ProfessionalDisclaimer() {
  return (
    <View style={{ backgroundColor: '#fcfaf6', borderWidth: 1, borderColor: P.border, borderRadius: 4, padding: 14, marginTop: 16, marginBottom: 4 }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Professional Review Required</Text>
      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, lineHeight: 15 }}>
        The arguments presented are potential opposing positions inferred from the available case information and relevant legal patterns. They are not predictions of actual court arguments or legal advice. A qualified legal professional must verify all facts, legal authorities, evidence, and conclusions before relying on them.
      </Text>
    </View>
  );
}

function OpponentArgumentsTab({ navigation }: { navigation: any }) {
  const { defenseResults, opponentTabData, opponentTabLoading, opponentTabError, generateOpponentArguments } = useAnalyzerStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [searchText, setSearchText]     = useState('');

  useEffect(() => { generateOpponentArguments(); }, []);

  if (opponentTabLoading) {
    return <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 50 }}><OpponentLoadingScreen /></ScrollView>;
  }

  if (opponentTabError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 15, color: P.ink, marginBottom: 6, textAlign: 'center' }}>Unable to Complete Analysis</Text>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.muted, textAlign: 'center', marginBottom: 20, lineHeight: 16 }}>{opponentTabError}</Text>
        <TouchableOpacity onPress={() => generateOpponentArguments()} style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4, borderWidth: 1, borderColor: P.ink }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.ink }}>Retry Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.muted }}>Return to Case Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!defenseResults) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 15, color: P.muted, textAlign: 'center', lineHeight: 22 }}>
          Insufficient Case Information{'\n'}
          <Text style={{ fontSize: 11 }}>Run a defense analysis first to generate opponent arguments.</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4, borderWidth: 1, borderColor: P.ink }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.ink }}>Return to Case Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!opponentTabData) return null;

  const filteredArgs = opponentTabData.arguments.filter(arg => {
    const matchesFilter =
      activeFilter === 'All'    ||
      (activeFilter === 'High'   && arg.priority === 'HIGH')   ||
      (activeFilter === 'Medium' && arg.priority === 'MEDIUM') ||
      (activeFilter === 'Low'    && arg.priority === 'LOW')    ||
      arg.category === activeFilter;
    const matchesSearch =
      searchText.trim() === '' ||
      arg.title.toLowerCase().includes(searchText.toLowerCase()) ||
      arg.opponentPosition.toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <OpponentSummaryRow summary={opponentTabData.summary} />

      <TouchableOpacity
        onPress={() => {
          const { additionalDetails, originalInput } = useAnalyzerStore.getState();
          useOpponentStore.getState().importFromAnalyzerStore(additionalDetails, originalInput);
          navigation.navigate('OpponentPrediction');
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0e0e0c',
          borderRadius: 6,
          padding: 12,
          marginBottom: 14,
        }}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 13, color: '#f4f1ea', marginBottom: 2 }}>
            Deep 14-Section Adversarial Analysis
          </Text>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: 'rgba(244,241,234,0.7)' }}>
            Switch to Opponent Predictor with all current case evidence and forensic data.
          </Text>
        </View>
        <Text style={{ color: '#fb923c', fontSize: 16 }}>→</Text>
      </TouchableOpacity>

      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: P.muted, lineHeight: 14, marginBottom: 14, backgroundColor: '#fffef7', borderWidth: 1, borderColor: '#fde68a', borderRadius: 4, padding: 10 }}>
        These are system-generated potential arguments based on the available case information and relevant legal patterns. They are advisory and must be reviewed and validated by a qualified legal professional.
      </Text>

      <SectionHeader label="Potential Opponent Arguments" count={opponentTabData.summary.totalArguments} />
      <FilterBar active={activeFilter} onSelect={setActiveFilter} searchText={searchText} onSearch={setSearchText} />

      {filteredArgs.length === 0 ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.muted }}>No arguments match the current filter.</Text>
        </View>
      ) : (
        filteredArgs.map((arg, i) => <OpponentArgumentCard key={arg.id} arg={arg} defaultExpanded={arg.priority === 'HIGH' && i < 2} />)
      )}

      {opponentTabData.evidenceAttacks.length > 0 && (
        <>
          <SectionHeader label="Evidence the Opponent May Attack" count={opponentTabData.evidenceAttacks.length} />
          {opponentTabData.evidenceAttacks.map((item, i) => <EvidenceAttackCard key={i} item={item} />)}
        </>
      )}

      {opponentTabData.evidenceGaps.length > 0 && (
        <>
          <SectionHeader label="Evidence Gaps" count={opponentTabData.evidenceGaps.length} />
          {opponentTabData.evidenceGaps.map((item, i) => <EvidenceGapCard key={i} item={item} />)}
        </>
      )}

      {opponentTabData.contradictions.length > 0 && (
        <>
          <SectionHeader label="Potential Contradictions" count={opponentTabData.contradictions.length} />
          {opponentTabData.contradictions.map((item, i) => <OpponentContradictionCard key={i} item={item} />)}
        </>
      )}

      {opponentTabData.opponentStrategy.length > 0 && (
        <>
          <SectionHeader label="Possible Opponent Strategy" />
          <Card>
            {opponentTabData.opponentStrategy.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: i < opponentTabData.opponentStrategy.length - 1 ? 10 : 0 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: P.paper2, borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted }}>{i + 1}</Text>
                </View>
                <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.ink, lineHeight: 17, flex: 1 }}>{s}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {opponentTabData.opponentSupportingCases.length > 0 && (
        <>
          <SectionHeader label="Cases That May Support the Opponent" count={opponentTabData.opponentSupportingCases.length} />
          {opponentTabData.opponentSupportingCases.map((item, i) => <OpponentCaseCard key={i} item={item} />)}
        </>
      )}

      <ProfessionalDisclaimer />
    </ScrollView>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
type ActiveTab = 'results' | 'opponent';

function TabBar({ active, onSelect }: { active: ActiveTab; onSelect: (t: ActiveTab) => void }) {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: P.border, backgroundColor: P.white, paddingHorizontal: 16, paddingTop: 4 }}>
      {(['results', 'opponent'] as ActiveTab[]).map(tab => {
        const isActive = active === tab;
        const label    = tab === 'results' ? 'Analysis Results' : 'Opponent Arguments';
        return (
          <TouchableOpacity key={tab} onPress={() => onSelect(tab)} activeOpacity={0.8} style={{ paddingVertical: 10, paddingHorizontal: 4, marginRight: 20, borderBottomWidth: 2, borderBottomColor: isActive ? P.ink : 'transparent' }}>
            <Text style={{ fontFamily: isActive ? 'InterTight_600SemiBold' : 'InterTight_400Regular', fontSize: 12.5, color: isActive ? P.ink : P.muted }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function DefenseResultsScreen() {
  const navigation = useNavigation<any>();
  const { defenseResults, analysisHistory, currentVersionIndex, switchVersion, clearResults } = useAnalyzerStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('results');

  const r = defenseResults;
  const currentVersionItem = analysisHistory[currentVersionIndex];

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
        <TouchableOpacity onPress={() => { clearResults(); navigation.goBack(); }} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: P.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: P.ink }}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: P.ink }}>Defense Analysis</Text>
          {currentVersionItem && (
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted }}>v{currentVersionItem.version} · {currentVersionItem.formattedDate}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CaseAssistant', {
              caseId: currentVersionItem?.version ? `v${currentVersionItem.version}` : 'active-case',
              caseTitle: r.detected_label || 'Current Case',
            })}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: P.ink,
              backgroundColor: P.paper,
            }}
          >
            <Text style={{ fontSize: 11 }}>💬</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10.5, color: P.ink }}>
              Assistant
            </Text>
          </TouchableOpacity>

          <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: P.border, backgroundColor: P.paper2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.ink }}>⚖</Text>
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <TabBar active={activeTab} onSelect={setActiveTab} />

      {/* Tab 1: Analysis Results */}
      {activeTab === 'results' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>
          <VersionHistoryBar history={analysisHistory} currentIndex={currentVersionIndex} onSelect={switchVersion} />

          {currentVersionItem && (
            <AnalysisUpdatedBanner diff={currentVersionItem.diffSummary} versionNumber={currentVersionItem.version} />
          )}

          <IssueCard r={r} />

          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <RiskCard level={r.risk_level} label={r.risk_label} />
          </View>

          {currentVersionItem?.diffSummary?.newDefenseConsiderations &&
            currentVersionItem.diffSummary.newDefenseConsiderations.length > 0 && (
              <>
                <SectionHeader label="New Defense Considerations" />
                <NewDefenseConsiderationsCard items={currentVersionItem.diffSummary.newDefenseConsiderations} />
              </>
            )}

          {r.advanced_red_flags && r.advanced_red_flags.length > 0 && (
            <>
              <SectionHeader label="Critical Vulnerabilities & Red Flags" count={r.advanced_red_flags.length} />
              {r.advanced_red_flags.map((item, i) => <RedFlagCard key={i} item={item} />)}
            </>
          )}

          {r.weak_wording.length > 0 && (
            <>
              <SectionHeader label="Weak Legal Wording" count={r.weak_wording.length} />
              {r.weak_wording.map((item, i) => <WeakWordCard key={i} item={item} />)}
            </>
          )}

          {r.missing_evidence.length > 0 && (
            <>
              <SectionHeader label="Missing Evidence" count={r.missing_evidence.length} />
              {r.missing_evidence.map((item, i) => <MissingCard key={i} item={item} />)}
            </>
          )}

          {r.contradictions.length > 0 && (
            <>
              <SectionHeader label="Contradictions Detected" count={r.contradictions.length} />
              {r.contradictions.map((item, i) => <ContradictionCard key={i} item={item} />)}
            </>
          )}

          {r.defense_considerations.length > 0 && (
            <>
              <SectionHeader label="Defense Considerations" />
              <DefenseCard items={r.defense_considerations} />
            </>
          )}

          {r.similar_cases.length > 0 && (
            <>
              <SectionHeader label="Similar Cases" count={r.similar_cases.length} />
              {r.similar_cases.map((item, i) => <CaseCard key={i} item={item} index={i} />)}
            </>
          )}

          {r.similar_laws.length > 0 && (
            <>
              <SectionHeader label="Relevant Laws" count={r.similar_laws.length} />
              {r.similar_laws.map((item, i) => <LawCard key={i} item={item} index={i} />)}
            </>
          )}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('AddCaseDetails')}
            style={{ backgroundColor: P.accent, borderRadius: 6, paddingVertical: 14, paddingHorizontal: 16, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: P.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, color: P.white, fontWeight: '700' }}>+</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: P.white, letterSpacing: -0.2 }}>Add More Case Details & Re-analyze</Text>
                <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 13 }}>Have additional facts, documents, or evidence? Add them to improve the analysis.</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: P.white }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { clearResults(); navigation.goBack(); }} style={{ marginTop: 10, paddingVertical: 12, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: P.ink, backgroundColor: 'transparent' }}>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12.5, color: P.ink }}>← Start New Analysis</Text>
          </TouchableOpacity>

          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9, color: P.muted, textAlign: 'center', marginTop: 14, lineHeight: 14 }}>
            Decision-support only. Final legal decisions remain with the qualified legal professional.
          </Text>
        </ScrollView>
      )}

      {/* Tab 2: Opponent Arguments */}
      {activeTab === 'opponent' && (
        <OpponentArgumentsTab navigation={navigation} />
      )}

      {/* Floating Case Assistant Action Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => navigation.navigate('CaseAssistant', {
          caseId: currentVersionItem?.version ? `v${currentVersionItem.version}` : 'active-case',
          caseTitle: r.detected_label || 'Current Case',
        })}
        style={{
          position: 'absolute',
          bottom: 18,
          right: 16,
          backgroundColor: P.ink,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 15,
          borderRadius: 24,
          gap: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
          elevation: 6,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          zIndex: 999,
        }}
      >
        <Text style={{ fontSize: 13 }}>💬</Text>
        <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11.5, color: P.paper }}>
          Case Assistant
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}
