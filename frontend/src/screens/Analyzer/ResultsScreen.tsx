import React, { useState } from 'react';
import { useAnalyzerStore, LawResult, AnalysisResults } from '../../store/useAnalyzerStore';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Colour palette per legal issue ────────────────────────────────────────────
const ISSUE_PALETTE: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  drug_offense:       { bg: '#fff7ed', border: '#fb923c', text: '#c2410c', dot: '#f97316' },
  financial_fraud:    { bg: '#fffbeb', border: '#fbbf24', text: '#92400e', dot: '#f59e0b' },
  murder:             { bg: '#fef2f2', border: '#f87171', text: '#991b1b', dot: '#ef4444' },
  cybercrime:         { bg: '#eff6ff', border: '#60a5fa', text: '#1e40af', dot: '#3b82f6' },
  human_trafficking:  { bg: '#fdf4ff', border: '#c084fc', text: '#6b21a8', dot: '#a855f7' },
  domestic_violence:  { bg: '#fff1f2', border: '#fb7185', text: '#9f1239', dot: '#f43f5e' },
  corruption:         { bg: '#f0fdf4', border: '#4ade80', text: '#14532d', dot: '#22c55e' },
  theft:              { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', dot: '#fb923c' },
  assault:            { bg: '#fef2f2', border: '#fca5a5', text: '#7f1d1d', dot: '#f87171' },
  terrorism:          { bg: '#fef2f2', border: '#dc2626', text: '#7f1d1d', dot: '#dc2626' },
  civil_dispute:      { bg: '#f0f9ff', border: '#38bdf8', text: '#075985', dot: '#0ea5e9' },
  labour_dispute:     { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#4ade80' },
  general:            { bg: '#f4f1ea', border: '#d6d0bf', text: '#6b685f', dot: '#a09d93' },
};

function getIssuePalette(issue: string) {
  return ISSUE_PALETTE[issue] ?? ISSUE_PALETTE.general;
}

// ── Classification Badge ──────────────────────────────────────────────────────
function ClassificationBadge({ results }: { results: AnalysisResults }) {
  const pal = getIssuePalette(results.detected_case_type);
  const pct = Math.round(results.confidence * 100);
  const isFiltered = results.search_mode === 'filtered';

  return (
    <View style={{
      backgroundColor: pal.bg,
      borderWidth: 1,
      borderColor: pal.border,
      borderRadius: 4,
      padding: 14,
      marginBottom: 12,
    }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pal.dot }} />
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1, color: pal.text, textTransform: 'uppercase' }}>
            Detected Legal Issue
          </Text>
        </View>
        <View style={{ backgroundColor: pal.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color: '#fff' }}>
            {isFiltered ? '⚡ Filtered' : '◎ Full Corpus'}
          </Text>
        </View>
      </View>

      {/* Issue label + confidence */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: pal.text, letterSpacing: -0.3, flex: 1 }}>
          {results.detected_label}
        </Text>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: pal.dot }}>
          {pct}%
        </Text>
      </View>

      {/* Confidence bar */}
      <View style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <View style={{ height: 4, width: `${pct}%`, backgroundColor: pal.dot, borderRadius: 2 }} />
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 11, color: pal.text }}>{results.laws_in_filter.toLocaleString()}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: pal.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Laws in filter</Text>
        </View>
        <View style={{ width: 1, backgroundColor: pal.border }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 11, color: pal.text }}>{results.filtered_category}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: pal.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Categories searched</Text>
        </View>
      </View>

      {/* Matched keywords */}
      {results.matched_keywords.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {results.matched_keywords.map((kw, i) => (
            <View key={i} style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: pal.text }}>
                {kw}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Score pill ─────────────────────────────────────────────────────────────────
function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? '#3a6b3f' : pct >= 45 ? '#c5681e' : '#9a2a1f';
  const bg   = pct >= 70 ? '#f0fdf4' : pct >= 45 ? '#fffcef' : '#fff3f0';
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: bg, borderWidth: 1, borderColor: color }}>
      <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color }}>{pct}% match</Text>
    </View>
  );
}

// ── Result card ────────────────────────────────────────────────────────────────
function ResultCard({ item, index }: { item: LawResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded((v) => !v)}>
      <Card style={{ marginBottom: 8, padding: 12, borderRadius: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0dbcb' }}>
        {/* Row 1: index badge + score pill */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#0e0e0c', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color: '#f4f1ea' }}>{index + 1}</Text>
            </View>
            {item.category ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#f4f1ea', borderWidth: 1, borderColor: '#e0dbcb' }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: '#6b685f', textTransform: 'uppercase', letterSpacing: 0.8 }}>{item.category}</Text>
              </View>
            ) : null}
          </View>
          <ScorePill score={item.similarity_score} />
        </View>

        {/* Act name + section */}
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 13, color: '#0e0e0c', letterSpacing: -0.2, lineHeight: 18 }}>
          {item.act_name || 'Unknown Act'}
        </Text>
        {item.section ? (
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#6b685f', marginTop: 2 }}>
            Section {item.section}{item.section_title ? ` — ${item.section_title}` : ''}
          </Text>
        ) : null}

        {/* Law text preview */}
        <Text
          style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#3d3b35', lineHeight: 15, marginTop: 6 }}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.law_text}
        </Text>

        {/* Expanded: extra metadata */}
        {expanded && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e8e3d6' }}>
            {item.subcategory ? (
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#6b685f', width: 90 }}>SUB-CATEGORY</Text>
                <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: '#0e0e0c', flex: 1 }}>{item.subcategory}</Text>
              </View>
            ) : null}
            {item.legal_system ? (
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#6b685f', width: 90 }}>JURISDICTION</Text>
                <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: '#0e0e0c', flex: 1 }}>{item.legal_system}</Text>
              </View>
            ) : null}
            {item.act_no ? (
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#6b685f', width: 90 }}>ACT NO.</Text>
                <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: '#0e0e0c', flex: 1 }}>{item.act_no}</Text>
              </View>
            ) : null}
          </View>
        )}

        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: '#b0ad9e', marginTop: 8, textAlign: 'right' }}>
          {expanded ? 'Tap to collapse ▲' : 'Tap to expand ▼'}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export function ResultsScreen() {
  const navigation = useNavigation();
  const { results, isLoading, clearResults } = useAnalyzerStore();

  const topScore = results?.results?.[0]?.similarity_score ?? 0;
  const topPct   = Math.round(topScore * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f1ea' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8e3d6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
        <TouchableOpacity
          onPress={() => { clearResults(); navigation.goBack(); }}
          style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#0e0e0c', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: '#0e0e0c' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: '#0e0e0c' }}>Analysis Results</Text>
        <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#0e0e0c', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f1ea' }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: '#0e0e0c' }}>⇅</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {isLoading ? (
          <View>
            <Skeleton height={80} className="mb-3" />
            <Skeleton height={130} className="mb-4" />
            <Skeleton height={100} className="mb-3" />
            <Skeleton height={100} className="mb-3" />
          </View>
        ) : results && results.status === 'success' ? (
          <>
            {/* ── Classification Badge (new) ── */}
            <ClassificationBadge results={results} />

            {/* ── Summary card ── */}
            <View style={{ backgroundColor: '#0e0e0c', padding: 18, borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(251,250,246,0.5)', marginBottom: 6 }}>
                Query
              </Text>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: '#f4f1ea', letterSpacing: -0.3, lineHeight: 24 }}>
                {results.query}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', gap: 12 }}>
                <View>
                  <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: '#c5681e' }}>{topPct}%</Text>
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: 'rgba(251,250,246,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Top Match</Text>
                </View>
                <View style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <View>
                  <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: '#f4f1ea' }}>{results.total_results}</Text>
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: 'rgba(251,250,246,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Laws Found</Text>
                </View>
                <View style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <View>
                  <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: '#f4f1ea' }}>BERT</Text>
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: 'rgba(251,250,246,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Model</Text>
                </View>
              </View>
            </View>

            {/* ── Section label ── */}
            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, letterSpacing: 1.5, color: '#6b685f', textTransform: 'uppercase', marginBottom: 10 }}>
              Relevant Laws — Tap to expand
            </Text>

            {/* ── Result cards ── */}
            {results.results.map((item, idx) => (
              <ResultCard key={idx} item={item} index={idx} />
            ))}

            {/* ── New Search ── */}
            <TouchableOpacity
              onPress={() => { clearResults(); navigation.goBack(); }}
              style={{ marginTop: 12, paddingVertical: 14, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#0e0e0c', backgroundColor: 'transparent' }}
            >
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: '#0e0e0c' }}>← New Search</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 16, color: '#6b685f', textAlign: 'center' }}>
              No results found.{'\n'}Try a different search query.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
