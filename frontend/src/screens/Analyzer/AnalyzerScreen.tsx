import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAnalyzerStore } from '../../store/useAnalyzerStore';

const CASE_TYPES = ['Criminal', 'Civil', 'Commercial'] as const;
const OUTCOMES   = ['Acquittal', 'Dismissal', 'Bail', 'Settlement'] as const;

const PALETTE = {
  ink:     '#0e0e0c',
  paper:   '#f4f1ea',
  paper2:  '#ece8df',
  muted:   '#6b685f',
  border:  '#e0dbcb',
  accent:  '#b8412c',
  white:   '#ffffff',
};

// ── Reusable label ─────────────────────────────────────────────────────────────
function Label({ text }: { text: string }) {
  return (
    <Text style={{
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 9.5,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: PALETTE.muted,
      marginBottom: 6,
    }}>
      {text}
    </Text>
  );
}

// ── Pill selector ──────────────────────────────────────────────────────────────
function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: active ? PALETTE.ink : PALETTE.border,
              backgroundColor: active ? PALETTE.ink : PALETTE.white,
            }}
          >
            <Text style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 9.5,
              letterSpacing: 0.5,
              color: active ? PALETTE.paper : PALETTE.ink,
            }}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────
function FieldBox({ children }: { children: React.ReactNode }) {
  return <View style={{ marginBottom: 18 }}>{children}</View>;
}

// ── Main screen ────────────────────────────────────────────────────────────────
export function AnalyzerScreen() {
  const navigation = useNavigation<any>();
  const { analyzeDefense, isLoading, error } = useAnalyzerStore();

  const [caseType, setCaseType]     = useState<typeof CASE_TYPES[number]>('Criminal');
  const [caseTitle, setCaseTitle]   = useState('');
  const [legalIssue, setLegalIssue] = useState('');
  const [facts, setFacts]           = useState('');
  const [outcome, setOutcome]       = useState<typeof OUTCOMES[number]>('Acquittal');

  const canAnalyze = legalIssue.trim().length > 0 && !isLoading;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    const success = await analyzeDefense(legalIssue, caseType, facts, outcome, caseTitle);
    if (success) {
      navigation.navigate('DefenseResults');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.paper }} edges={['top']}>
      {/* ── Header ── */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: PALETTE.white,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 32, height: 32, borderRadius: 16,
            borderWidth: 1, borderColor: PALETTE.ink,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: PALETTE.ink }}>←</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: PALETTE.ink }}>
          Defense Analyzer
        </Text>

        <View style={{
          width: 32, height: 32, borderRadius: 16,
          borderWidth: 1, borderColor: PALETTE.border,
          backgroundColor: PALETTE.paper2,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: PALETTE.ink }}>⚖</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 24,
            letterSpacing: -0.5,
            lineHeight: 30,
            color: PALETTE.ink,
          }}>
            {'Analyze your\n'}
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', color: PALETTE.accent }}>
              B Report.
            </Text>
          </Text>
          <Text style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 11,
            lineHeight: 17,
            color: PALETTE.muted,
            marginTop: 6,
          }}>
            Enter the case facts or police B Report text. The AI engine will detect weak wording, missing evidence,
            contradictions, and find similar precedents.
          </Text>
        </View>

        {/* ── Case Type ── */}
        <FieldBox>
          <Label text="Case Type" />
          <PillSelector options={CASE_TYPES} value={caseType} onChange={setCaseType} />
        </FieldBox>

        {/* ── Case Title ── */}
        <FieldBox>
          <Label text="Case Title (Optional)" />
          <View style={{
            backgroundColor: PALETTE.white,
            borderWidth: 1,
            borderColor: PALETTE.border,
            borderRadius: 4,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}>
            <TextInput
              value={caseTitle}
              onChangeText={setCaseTitle}
              placeholder="e.g. The State v. Perera"
              placeholderTextColor="#aaa8a0"
              style={{
                fontFamily: 'InterTight_400Regular',
                fontSize: 12,
                color: PALETTE.ink,
              }}
            />
          </View>
        </FieldBox>

        {/* ── Primary Legal Issue ── */}
        <FieldBox>
          <Label text="Primary Legal Issue *" />
          <View style={{
            backgroundColor: PALETTE.white,
            borderWidth: 1,
            borderColor: legalIssue ? PALETTE.ink : PALETTE.border,
            borderRadius: 4,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}>
            <TextInput
              value={legalIssue}
              onChangeText={setLegalIssue}
              placeholder="e.g. Drug trafficking, Financial fraud, Assault..."
              placeholderTextColor="#aaa8a0"
              style={{
                fontFamily: 'InterTight_400Regular',
                fontSize: 12,
                color: PALETTE.ink,
              }}
            />
          </View>
        </FieldBox>

        {/* ── B Report / Brief Facts ── */}
        <FieldBox>
          <Label text="B Report / Brief Facts" />
          <View style={{
            backgroundColor: PALETTE.white,
            borderWidth: 1,
            borderColor: PALETTE.border,
            borderRadius: 4,
            paddingHorizontal: 12,
            paddingVertical: 10,
            minHeight: 140,
          }}>
            <TextInput
              value={facts}
              onChangeText={setFacts}
              placeholder={
                'Paste the police B Report text or brief facts here...\n\n' +
                'e.g. The accused was allegedly found in possession of 5g of heroin. ' +
                'Police informants tipped off officers at 14:30. No forensic report was filed...'
              }
              placeholderTextColor="#aaa8a0"
              multiline
              textAlignVertical="top"
              style={{
                fontFamily: 'InterTight_400Regular',
                fontSize: 11.5,
                lineHeight: 18,
                color: PALETTE.ink,
                flex: 1,
              }}
            />
          </View>
          <Text style={{
            fontFamily: 'JetBrainsMono_500Medium',
            fontSize: 8.5,
            color: PALETTE.muted,
            marginTop: 4,
          }}>
            {facts.length} characters · Tip: include arrest details, evidence mentions, witness references
          </Text>
        </FieldBox>

        {/* ── Desired Outcome ── */}
        <FieldBox>
          <Label text="Desired Outcome" />
          <PillSelector options={OUTCOMES} value={outcome} onChange={setOutcome} />
        </FieldBox>

        {/* ── Error ── */}
        {error ? (
          <View style={{
            backgroundColor: '#fff3f0',
            borderWidth: 1,
            borderColor: '#f87171',
            borderRadius: 4,
            padding: 12,
            marginBottom: 16,
          }}>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#9a2a1f', lineHeight: 16 }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* ── Analyze Button ── */}
        <View style={{ marginTop: 8 }}>
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            style={{
              backgroundColor: canAnalyze ? PALETTE.ink : '#ccc8bf',
              borderRadius: 4,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={PALETTE.paper} size="small" />
            ) : null}
            <Text style={{
              fontFamily: 'InterTight_600SemiBold',
              fontSize: 14,
              color: canAnalyze ? PALETTE.paper : '#9a9890',
              letterSpacing: 0.3,
            }}>
              {isLoading ? 'Analyzing...' : 'Run Defense Analysis →'}
            </Text>
          </TouchableOpacity>

          <Text style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 9.5,
            color: PALETTE.muted,
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 14,
          }}>
            Advisory only · Not a substitute for legal advice · Human-in-the-Loop validation required
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
