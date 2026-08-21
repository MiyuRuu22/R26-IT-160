import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// ─── types ────────────────────────────────────────────────────────────────────
interface FormData {
  clientName: string;
  entityType: string;
  jurisdiction: string;
  idType: string;
  idNumber: string;
  conflictSearch: string;
  annualRevenue: string;
  sourceOfFunds: string;
}

interface DriverFactor {
  title: string;
  description: string;
  delta: number;
  type: 'critical' | 'warning' | 'ok';
  expanded: boolean;
}

// ─── constants ────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5;
const STEP_LABELS = [
  'Basic Details',
  'Identity',
  'Conflict Check',
  'Financial',
  'Verdict',
];
const ENTITY_TYPES = ['Individual', 'Corporation', 'Partnership', 'Trust', 'NGO'];
const ID_TYPES = ['National ID', 'Passport', 'Driving Licence', 'Company Reg.'];
const FUND_SOURCES = ['Employment', 'Business', 'Investments', 'Inheritance', 'Other'];

const MOCK_VERDICT = {
  score: 78,
  level: 'HIGH RISK',
  confidence: 87,
};

const INITIAL_DRIVERS: DriverFactor[] = [
  {
    title: 'Financial Inconsistencies',
    description: 'NLP extracted metadata shows 3 discrepancies in offshore holdings. Cross-referencing with public filings reveals mismatches in declared vs actual assets.',
    delta: +24,
    type: 'critical',
    expanded: false,
  },
  {
    title: 'Historical Litigation',
    description: 'Client has been involved in 4 similar cases in the past 5 years. Two resulted in settlements, one in dismissal, one currently pending.',
    delta: +15,
    type: 'warning',
    expanded: false,
  },
  {
    title: 'Explainable AI Check',
    description: 'Score driven by semantic analysis of public financial records. LEGAL-BERT confidence indicates no major adverse media hits.',
    delta: -8,
    type: 'ok',
    expanded: false,
  },
];

// ─── pill color helper ────────────────────────────────────────────────────────
function pillStyle(type: DriverFactor['type']) {
  if (type === 'critical') return { bg: '#fff3f0', border: '#9a2a1f', text: '#9a2a1f' };
  if (type === 'warning')  return { bg: '#fffcef', border: '#c5681e', text: '#c5681e' };
  return                          { bg: '#f0fdf4', border: '#3a6b3f', text: '#3a6b3f' };
}

// ─── sub-components ───────────────────────────────────────────────────────────
function Label({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: '#6b685f', marginBottom: 6, marginTop: 14 }}>
      {children}
    </Text>
  );
}

function Field({
  value, onChangeText, placeholder, keyboardType = 'default',
}: {
  value: string; onChangeText: (t: string) => void; placeholder: string; keyboardType?: any;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor="#b0ad9e"
      style={{
        fontFamily: 'InterTight_400Regular', fontSize: 13, color: '#0e0e0c',
        borderWidth: 1, borderColor: '#e0dbcb', backgroundColor: '#fff',
        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4,
      }}
    />
  );
}

function ChipRow({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const active = o === selected;
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onSelect(o)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
              borderWidth: 1,
              borderColor: active ? '#0e0e0c' : '#e0dbcb',
              backgroundColor: active ? '#0e0e0c' : '#fff',
            }}
          >
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: active ? '#f4f1ea' : '#6b685f' }}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────
export function RiskAssessmentScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [drivers, setDrivers] = useState<DriverFactor[]>(INITIAL_DRIVERS);

  const [form, setForm] = useState<FormData>({
    clientName: '',
    entityType: '',
    jurisdiction: '',
    idType: '',
    idNumber: '',
    conflictSearch: '',
    annualRevenue: '',
    sourceOfFunds: '',
  });

  const set = (key: keyof FormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // ── validation per step ─────────────────────────────────────────────────────
  function validate(): boolean {
    if (step === 1 && (!form.clientName.trim() || !form.entityType || !form.jurisdiction.trim())) {
      Alert.alert('Required', 'Please fill in all fields before continuing.');
      return false;
    }
    if (step === 2 && (!form.idType || !form.idNumber.trim())) {
      Alert.alert('Required', 'Please select an ID type and enter the ID number.');
      return false;
    }
    return true;
  }

  // ── navigation ──────────────────────────────────────────────────────────────
  function goBack() {
    if (step === 1) { navigation.goBack(); return; }
    setStep((s) => s - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function goNext() {
    if (!validate()) return;
    if (step === 4) {
      setAnalyzing(true);
      await new Promise((r) => setTimeout(r, 2000)); // simulate AI
      setAnalyzing(false);
    }
    setStep((s) => s + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handleProceed() {
    Alert.alert('Client Accepted', `${form.clientName || 'Client'} has been approved and added to active cases.`, [
      { text: 'OK', onPress: () => navigation.navigate('Home') },
    ]);
  }

  function handleDecline() {
    Alert.alert('Confirm Decline', 'Are you sure you want to decline this client?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => navigation.navigate('Home') },
    ]);
  }

  function toggleDriver(idx: number) {
    setDrivers((d) => d.map((item, i) => i === idx ? { ...item, expanded: !item.expanded } : item));
  }

  // ── progress bar ────────────────────────────────────────────────────────────
  function ProgressBar() {
    return (
      <View>
        <View style={{ flexDirection: 'row', marginBottom: 8, marginTop: 6 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1, height: 4, marginHorizontal: 2, borderRadius: 2,
                backgroundColor: i < step ? '#0e0e0c' : i === step - 1 ? '#b8412c' : '#e0dbcb',
              }}
            />
          ))}
        </View>
        <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, textAlign: 'center', color: '#0e0e0c', marginBottom: 16 }}>
          Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
        </Text>
      </View>
    );
  }

  // ── steps ───────────────────────────────────────────────────────────────────
  function Step1() {
    return (
      <View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: '#0e0e0c', marginBottom: 4 }}>Basic Details</Text>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 12, color: '#6b685f', marginBottom: 16 }}>Enter the client's primary identifying information.</Text>

        <Label>Client Full Name</Label>
        <Field value={form.clientName} onChangeText={set('clientName')} placeholder="e.g. Arjuna Perera" />

        <Label>Entity Type</Label>
        <ChipRow options={ENTITY_TYPES} selected={form.entityType} onSelect={set('entityType')} />

        <Label>Jurisdiction</Label>
        <Field value={form.jurisdiction} onChangeText={set('jurisdiction')} placeholder="e.g. Sri Lanka, Singapore" />
      </View>
    );
  }

  function Step2() {
    return (
      <View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: '#0e0e0c', marginBottom: 4 }}>Identity Verification</Text>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 12, color: '#6b685f', marginBottom: 16 }}>Verify the client's government-issued identification.</Text>

        <Label>ID Document Type</Label>
        <ChipRow options={ID_TYPES} selected={form.idType} onSelect={set('idType')} />

        <Label>ID / Reference Number</Label>
        <Field value={form.idNumber} onChangeText={set('idNumber')} placeholder="Enter document number" />

        <View style={{ marginTop: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0dbcb', borderRadius: 4, padding: 14 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9.5, color: '#3a6b3f', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>✓ Verification Checklist</Text>
          {['Document not expired', 'Matches client name', 'Not on sanctions list', 'Biometric reference logged'].map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#3a6b3f', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ fontSize: 9, color: '#3a6b3f' }}>✓</Text>
              </View>
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 12, color: '#0e0e0c' }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  function Step3() {
    return (
      <View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: '#0e0e0c', marginBottom: 4 }}>Conflict Check</Text>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 12, color: '#6b685f', marginBottom: 16 }}>Search for prior legal conflicts or adverse relationships.</Text>

        <Label>Search Query (optional override)</Label>
        <Field value={form.conflictSearch} onChangeText={set('conflictSearch')} placeholder={form.clientName || 'Client name auto-filled'} />

        <View style={{ marginTop: 16 }}>
          {[
            { label: 'Internal Case Database', result: '4 matches found', status: 'warning' },
            { label: 'Adverse Party Registry', result: 'No conflicts', status: 'ok' },
            { label: 'Sanctions & PEP Lists', result: 'Not listed', status: 'ok' },
            { label: 'Court Records (Public)', result: '2 civil cases', status: 'warning' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e8e3d6' }}>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: '#0e0e0c' }}>{item.label}</Text>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: item.status === 'warning' ? '#fffcef' : '#f0fdf4', borderWidth: 1, borderColor: item.status === 'warning' ? '#c5681e' : '#3a6b3f' }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: item.status === 'warning' ? '#c5681e' : '#3a6b3f' }}>{item.result}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  function Step4() {
    return (
      <View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: '#0e0e0c', marginBottom: 4 }}>Financial Assessment</Text>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 12, color: '#6b685f', marginBottom: 16 }}>Provide financial details for AI risk scoring.</Text>

        <Label>Estimated Annual Revenue (USD)</Label>
        <Field value={form.annualRevenue} onChangeText={set('annualRevenue')} placeholder="e.g. 500000" keyboardType="numeric" />

        <Label>Primary Source of Funds</Label>
        <ChipRow options={FUND_SOURCES} selected={form.sourceOfFunds} onSelect={set('sourceOfFunds')} />

        <View style={{ marginTop: 20, backgroundColor: '#0e0e0c', padding: 14, borderRadius: 4 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(251,250,246,0.5)', marginBottom: 10 }}>AI Pre-Analysis</Text>
          {[
            { label: 'Revenue Plausibility', value: 'Pending' },
            { label: 'Offshore Exposure', value: 'Detected' },
            { label: 'AML Pattern Match', value: 'Low Signal' },
            { label: 'Asset Declaration', value: 'Incomplete' },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 12, color: 'rgba(251,250,246,0.7)' }}>{row.label}</Text>
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: '#f4f1ea' }}>{row.value}</Text>
            </View>
          ))}
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: 'rgba(251,250,246,0.4)', marginTop: 14, textAlign: 'center' }}>
            Full scoring completes on Continue →
          </Text>
        </View>
      </View>
    );
  }

  function Step5() {
    return (
      <View>
        {/* Score card */}
        <View style={{ backgroundColor: '#0e0e0c', padding: 24, borderRadius: 4, alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 52, letterSpacing: -1, color: '#f4f1ea' }}>
            {MOCK_VERDICT.score}
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 24, color: '#6b685f' }}>/100</Text>
          </Text>
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 14, letterSpacing: 1.4, color: '#c5681e', textTransform: 'uppercase', marginTop: 4 }}>
            {MOCK_VERDICT.level}
          </Text>

          {/* Gradient bar */}
          <View style={{ flexDirection: 'row', width: '100%', height: 6, marginTop: 20, marginBottom: 8, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ flex: 1, backgroundColor: '#3a6b3f' }} />
            <View style={{ flex: 1, backgroundColor: '#c5681e' }} />
            <View style={{ flex: 1, backgroundColor: '#9a2a1f' }} />
          </View>
          {/* Indicator dot */}
          <View style={{ width: '100%', position: 'relative', height: 10 }}>
            <View style={{
              position: 'absolute',
              left: `${MOCK_VERDICT.score}%` as any,
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: '#f4f1ea', marginTop: -4,
              transform: [{ translateX: -5 }],
            }} />
          </View>

          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9.5, color: 'rgba(251,250,246,0.6)', marginTop: 14, textAlign: 'center' }}>
            Confidence {MOCK_VERDICT.confidence}% · Model v2.1 · LEGAL-BERT
          </Text>
        </View>

        {/* Client summary */}
        {form.clientName ? (
          <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0dbcb', borderRadius: 4, padding: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: '#0e0e0c' }}>{form.clientName}</Text>
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#6b685f', marginTop: 2 }}>{form.entityType || 'Unknown'} · {form.jurisdiction || 'Unknown'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#6b685f' }}>ID: {form.idType || '—'}</Text>
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#6b685f', marginTop: 2 }}>{form.idNumber || '—'}</Text>
            </View>
          </View>
        ) : null}

        {/* Driving Factors */}
        <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, letterSpacing: 1.5, color: '#6b685f', textTransform: 'uppercase', marginBottom: 10 }}>
          Driving Factors
        </Text>

        {drivers.map((d, idx) => {
          const ps = pillStyle(d.type);
          const sign = d.delta > 0 ? '+' : '';
          return (
            <TouchableOpacity key={idx} onPress={() => toggleDriver(idx)} activeOpacity={0.85}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#e8e3d6', paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12.5, color: '#0e0e0c' }}>{d.title}</Text>
                    <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#6b685f', marginTop: 3, lineHeight: 15 }} numberOfLines={d.expanded ? undefined : 1}>
                      {d.description}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: ps.bg, borderWidth: 1, borderColor: ps.border }}>
                    <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: ps.text }}>{sign}{d.delta}</Text>
                  </View>
                </View>
                {d.expanded && (
                  <View style={{ marginTop: 8, backgroundColor: '#f4f1ea', borderRadius: 4, padding: 10 }}>
                    <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: '#0e0e0c', lineHeight: 17 }}>{d.description}</Text>
                    <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: '#6b685f', marginTop: 8 }}>
                      Weight in model: {Math.abs(d.delta)}pts · Source: LEGAL-BERT NLP
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f1ea' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8e3d6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={goBack} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#0e0e0c', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: '#0e0e0c' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: '#0e0e0c' }}>Risk Assessment</Text>
        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#0e0e0c', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: '#0e0e0c' }}>⤓</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <ProgressBar />

        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
        {step === 5 && <Step5 />}

        {/* Bottom Buttons */}
        <View style={{ flexDirection: 'row', marginTop: 28, gap: 10 }}>
          {step === 5 ? (
            <>
              <TouchableOpacity onPress={handleDecline} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#0e0e0c', backgroundColor: 'transparent' }}>
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: '#0e0e0c' }}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleProceed} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 4, backgroundColor: '#b8412c' }}>
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: '#fff' }}>Proceed →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {step > 1 && (
                <TouchableOpacity onPress={goBack} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#0e0e0c', backgroundColor: 'transparent' }}>
                  <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: '#0e0e0c' }}>← Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={goNext} disabled={analyzing} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 4, backgroundColor: '#0e0e0c', opacity: analyzing ? 0.7 : 1 }}>
                {analyzing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#f4f1ea" size="small" />
                    <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: '#f4f1ea' }}>Analysing…</Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: '#f4f1ea' }}>
                    {step === 4 ? 'Run AI Analysis →' : 'Continue →'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
