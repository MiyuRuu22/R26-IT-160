import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  useAnalyzerStore,
  AdditionalCaseDetails,
  WitnessItem,
  DocumentAttachment,
  countAdditionalDetails,
} from '../../store/useAnalyzerStore';

const P = {
  ink: '#0e0e0c',
  paper: '#f4f1ea',
  paper2: '#ece8df',
  muted: '#6b685f',
  border: '#e0dbcb',
  accent: '#b8412c',
  accentLight: '#fbece9',
  white: '#ffffff',
  green: '#14532d',
  greenBg: '#f0fdf4',
  greenBorder: '#86efac',
  warnBg: '#fffbeb',
  warnBorder: '#fde68a',
  warnText: '#92400e',
};

const CASE_TYPES = [
  'Criminal',
  'Civil',
  'Drug Offense',
  'Theft',
  'Assault',
  'Fraud',
  'Commercial',
  'Other',
] as const;

const LEGAL_ISSUE_OPTIONS = [
  'Possession',
  'Trafficking',
  'Search and Seizure',
  'Identification',
  'Evidence',
  'Confession',
  'Witness Reliability',
  'Forensic Irregularity',
  'Chain of Custody',
  'Arrest Procedure',
];

const FORENSIC_STATUSES = ['Available', 'Not Available', 'Pending', 'Unknown'] as const;
const CUSTODY_STATUSES = ['Complete', 'Incomplete', 'Not Available', 'Unknown'] as const;
const DIGITAL_STATUSES = [
  'Phone extracted',
  'Phone not extracted',
  'Digital evidence available',
  'No digital evidence',
  'Unknown',
] as const;
const CCTV_STATUSES = ['Available', 'Not Available', 'Unknown'] as const;
const WITNESS_STATUSES = ['Witness statements available', 'Statements unavailable', 'Unknown'] as const;
const YES_NO_UNKNOWN = ['Yes', 'No', 'Unknown'] as const;

const DOC_TYPES = [
  'Forensic Report',
  'Medical Report',
  'Police Document',
  'Witness Statement',
  'Court Document',
  'Photo',
  'Other',
] as const;

// ── UI Components ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={{
        backgroundColor: P.white,
        borderWidth: 1,
        borderColor: P.border,
        borderRadius: 6,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen((v) => !v)}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: P.white,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: open ? 1 : 0,
          borderBottomColor: P.border,
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 14, color: P.ink }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: P.muted }}>
          {open ? '▲ Collapse' : '▼ Expand'}
        </Text>
      </TouchableOpacity>
      {open && <View style={{ padding: 16 }}>{children}</View>}
    </View>
  );
}

function FieldLabel({ label, optional = true }: { label: string; optional?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <Text
        style={{
          fontFamily: 'JetBrainsMono_600SemiBold',
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: P.muted,
        }}
      >
        {label}
      </Text>
      {optional && (
        <Text
          style={{
            fontFamily: 'JetBrainsMono_500Medium',
            fontSize: 8,
            color: '#a3a096',
            letterSpacing: 0.5,
          }}
        >
          OPTIONAL
        </Text>
      )}
    </View>
  );
}

function TextInputBox({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  minHeight,
  helperText,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
  helperText?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          backgroundColor: '#fbfaf8',
          borderWidth: 1,
          borderColor: P.border,
          borderRadius: 4,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 8,
          minHeight: minHeight || (multiline ? 80 : 40),
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a8a59c"
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 11.5,
            color: P.ink,
            lineHeight: 17,
            flex: multiline ? 1 : undefined,
          }}
        />
      </View>
      {helperText ? (
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: P.muted, marginTop: 4 }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function SingleSelectPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: active ? P.ink : P.border,
              backgroundColor: active ? P.ink : P.white,
            }}
          >
            <Text
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 9,
                color: active ? P.paper : P.ink,
              }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function AddCaseDetailsScreen() {
  const navigation = useNavigation<any>();
  const { originalInput, defenseResults, additionalDetails, updateAdditionalDetails } = useAnalyzerStore();

  const [form, setForm] = useState<AdditionalCaseDetails>({
    ...additionalDetails,
    caseTitle: additionalDetails.caseTitle || originalInput?.caseTitle || '',
    caseType: additionalDetails.caseType || originalInput?.caseType || 'Criminal',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Modal for adding a witness
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [witnessRole, setWitnessRole] = useState('Eyewitness');
  const [witnessDesc, setWitnessDesc] = useState('');

  // Modal for adding a document
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<typeof DOC_TYPES[number]>('Forensic Report');
  const [docSize, setDocSize] = useState('240 KB');

  const updateForm = (key: keyof AdditionalCaseDetails, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setValidationError(null);
  };

  const handleToggleLegalIssue = (issue: string) => {
    const current = form.relevantLegalIssues;
    if (current.includes(issue)) {
      updateForm('relevantLegalIssues', current.filter((i) => i !== issue));
    } else {
      updateForm('relevantLegalIssues', [...current, issue]);
    }
  };

  const handleAddWitness = () => {
    if (!witnessName.trim()) return;
    const newWitness: WitnessItem = {
      id: 'wit-' + Date.now(),
      name: witnessName.trim(),
      role: witnessRole.trim(),
      description: witnessDesc.trim(),
    };
    updateForm('witnesses', [...form.witnesses, newWitness]);
    setWitnessName('');
    setWitnessRole('Eyewitness');
    setWitnessDesc('');
    setShowWitnessModal(false);
  };

  const handleRemoveWitness = (id: string) => {
    updateForm('witnesses', form.witnesses.filter((w) => w.id !== id));
  };

  const handleAddDocument = () => {
    if (!docName.trim()) return;
    const newDoc: DocumentAttachment = {
      id: 'doc-' + Date.now(),
      name: docName.trim(),
      type: docType,
      size: docSize.trim() || '150 KB',
    };
    updateForm('documents', [...form.documents, newDoc]);
    setDocName('');
    setDocType('Forensic Report');
    setDocSize('240 KB');
    setShowDocModal(false);
  };

  const handleRemoveDocument = (id: string) => {
    updateForm('documents', form.documents.filter((d) => d.id !== id));
  };

  const handleTriggerReanalyze = () => {
    const detailsCount = countAdditionalDetails(form);
    if (detailsCount === 0) {
      setValidationError('No new information added. Please add at least one additional case detail before re-analyzing.');
      return;
    }
    setValidationError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmReanalyze = () => {
    setShowConfirmModal(false);
    updateAdditionalDetails(form);
    navigation.navigate('ReAnalysisLoading', { updatedDetails: form });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: P.paper }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: P.border,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: P.white,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: P.ink,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: P.ink }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: P.ink }}>
            Add Case Details
          </Text>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted }}>
            Add any additional information available about this case.
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current Analysis Info Banner */}
        <View
          style={{
            backgroundColor: P.ink,
            borderRadius: 6,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: 'JetBrainsMono_600SemiBold',
              fontSize: 8.5,
              color: 'rgba(244,241,234,0.6)',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Current Analysis Information
          </Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: P.paper, marginBottom: 6 }}>
            {defenseResults?.detected_label || originalInput?.legalIssue || 'Case Under Review'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {defenseResults?.matched_keywords && defenseResults.matched_keywords.length > 0 ? (
              defenseResults.matched_keywords.map((kw, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 3,
                  }}
                >
                  <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: 'rgba(244,241,234,0.8)' }}>
                    {kw}
                  </Text>
                </View>
              ))
            ) : null}
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                backgroundColor: 'rgba(251,146,60,0.2)',
                borderWidth: 1,
                borderColor: '#fb923c',
              }}
            >
              <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#fb923c' }}>
                Risk: {defenseResults?.risk_level || 'ANALYZING'}
              </Text>
            </View>
          </View>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#ece8df', lineHeight: 15 }}>
            Additional information will be combined with the existing case information for re-analysis.
          </Text>
        </View>

        {/* Section 1 — Case Information */}
        <SectionCard title="1. Case Information" subtitle="Basic identification details">
          <FieldLabel label="Case Title" />
          <TextInputBox
            value={form.caseTitle}
            onChangeText={(v) => updateForm('caseTitle', v)}
            placeholder="e.g. State vs. Kassa"
          />

          <FieldLabel label="Case Number" />
          <TextInputBox
            value={form.caseNumber}
            onChangeText={(v) => updateForm('caseNumber', v)}
            placeholder="e.g. B/2456/2026"
          />

          <FieldLabel label="Case Type" />
          <SingleSelectPills
            options={CASE_TYPES}
            value={form.caseType as any}
            onChange={(v) => updateForm('caseType', v)}
          />

          <FieldLabel label="Relevant Legal Issues" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {LEGAL_ISSUE_OPTIONS.map((opt) => {
              const selected = form.relevantLegalIssues.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleToggleLegalIssue(opt)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected ? P.accent : P.border,
                    backgroundColor: selected ? P.accentLight : P.white,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'InterTight_500Medium',
                      fontSize: 9.5,
                      color: selected ? P.accent : P.ink,
                    }}
                  >
                    {selected ? `✓ ${opt}` : opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* Section 2 — Incident Details */}
        <SectionCard title="2. Incident Details" subtitle="Time, location & incident specifics">
          <FieldLabel label="Date of Incident" />
          <TextInputBox
            value={form.incidentDate}
            onChangeText={(v) => updateForm('incidentDate', v)}
            placeholder="e.g. 2026-08-15"
          />

          <FieldLabel label="Approximate Time" />
          <TextInputBox
            value={form.incidentTime}
            onChangeText={(v) => updateForm('incidentTime', v)}
            placeholder="e.g. 14:30 or Night"
          />

          <FieldLabel label="Location" />
          <TextInputBox
            value={form.location}
            onChangeText={(v) => updateForm('location', v)}
            placeholder="e.g. Pettah, Colombo 11"
          />

          <FieldLabel label="Police Station" />
          <TextInputBox
            value={form.policeStation}
            onChangeText={(v) => updateForm('policeStation', v)}
            placeholder="e.g. Fort Police Station"
          />

          <FieldLabel label="Brief Description of Incident" />
          <TextInputBox
            value={form.incidentDescription}
            onChangeText={(v) => updateForm('incidentDescription', v)}
            placeholder="Describe what happened based on the available case information..."
            multiline
            minHeight={90}
            helperText="Describe what happened based on the available case information."
          />
        </SectionCard>

        {/* Section 3 — Parties Involved */}
        <SectionCard title="3. Parties Involved" subtitle="Accused, officers & witnesses">
          <FieldLabel label="Accused Person" />
          <TextInputBox
            value={form.accusedPerson}
            onChangeText={(v) => updateForm('accusedPerson', v)}
            placeholder="e.g. K. A. Samantha"
          />

          <FieldLabel label="Other Persons Involved" />
          <TextInputBox
            value={form.otherPersons}
            onChangeText={(v) => updateForm('otherPersons', v)}
            placeholder="e.g. Co-suspect 2 (A2), Informant"
            multiline
            minHeight={60}
          />

          <FieldLabel label="Investigating Officer (OIC / SI)" />
          <TextInputBox
            value={form.investigatingOfficer}
            onChangeText={(v) => updateForm('investigatingOfficer', v)}
            placeholder="e.g. SI Senanayake (Badge #4821)"
          />

          <FieldLabel label="Witnesses" />
          {form.witnesses.length > 0 ? (
            <View style={{ marginBottom: 10 }}>
              {form.witnesses.map((w, idx) => (
                <View
                  key={w.id}
                  style={{
                    backgroundColor: P.paper,
                    borderWidth: 1,
                    borderColor: P.border,
                    borderRadius: 4,
                    padding: 10,
                    marginBottom: 6,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.ink }}>
                      {idx + 1}. {w.name} ({w.role})
                    </Text>
                    {w.description ? (
                      <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted, marginTop: 2 }}>
                        {w.description}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveWitness(w.id)}>
                    <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: P.accent }}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => setShowWitnessModal(true)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: P.ink,
              borderRadius: 4,
              alignItems: 'center',
              backgroundColor: P.paper2,
              marginTop: 4,
            }}
          >
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11.5, color: P.ink }}>
              + Add Witness
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Section 4 — Evidence & Investigation */}
        <SectionCard title="4. Evidence & Investigation" subtitle="Forensics, custody, digital & video evidence">
          {/* Physical Evidence Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: P.border,
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.ink }}>
                Physical Evidence Available
              </Text>
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, color: P.muted }}>
                Substances, weapons, or material objects seized
              </Text>
            </View>
            <Switch
              value={form.physicalEvidenceAvailable}
              onValueChange={(val) => updateForm('physicalEvidenceAvailable', val)}
              trackColor={{ false: '#d1cdc4', true: P.ink }}
              thumbColor={P.white}
            />
          </View>

          {form.physicalEvidenceAvailable && (
            <View
              style={{
                backgroundColor: P.paper,
                padding: 12,
                borderRadius: 4,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <FieldLabel label="Evidence Type / Description" />
              <TextInputBox
                value={form.physicalEvidenceType}
                onChangeText={(v) => updateForm('physicalEvidenceType', v)}
                placeholder="e.g. 5g Brown Powder (Alleged Heroin)"
              />

              <FieldLabel label="Quantity" />
              <TextInputBox
                value={form.physicalEvidenceQuantity}
                onChangeText={(v) => updateForm('physicalEvidenceQuantity', v)}
                placeholder="e.g. 5.2 grams"
              />

              <FieldLabel label="Where it was recovered" />
              <TextInputBox
                value={form.physicalEvidenceLocation}
                onChangeText={(v) => updateForm('physicalEvidenceLocation', v)}
                placeholder="e.g. Under the passenger seat of vehicle"
              />

              <FieldLabel label="Who recovered it" />
              <TextInputBox
                value={form.physicalEvidenceRecoveredBy}
                onChangeText={(v) => updateForm('physicalEvidenceRecoveredBy', v)}
                placeholder="e.g. PC 1284"
              />
            </View>
          )}

          {/* Forensic Report */}
          <FieldLabel label="Forensic / GA Report" />
          <SingleSelectPills
            options={FORENSIC_STATUSES}
            value={form.forensicReportStatus}
            onChange={(v) => updateForm('forensicReportStatus', v)}
          />
          {form.forensicReportStatus !== 'Unknown' && form.forensicReportStatus !== 'Not Available' && (
            <TextInputBox
              value={form.forensicReportDetails}
              onChangeText={(v) => updateForm('forensicReportDetails', v)}
              placeholder="Enter relevant GA/Forensic report findings or purity percentage..."
              multiline
              minHeight={70}
            />
          )}

          {/* Chain of Custody */}
          <FieldLabel label="Chain of Custody" />
          <SingleSelectPills
            options={CUSTODY_STATUSES}
            value={form.chainOfCustodyStatus}
            onChange={(v) => updateForm('chainOfCustodyStatus', v)}
          />
          <TextInputBox
            value={form.chainOfCustodyDetails}
            onChangeText={(v) => updateForm('chainOfCustodyDetails', v)}
            placeholder="Details on movement of evidence, seal numbers, custody log..."
          />

          {/* Phone / Digital Evidence */}
          <FieldLabel label="Phone / Digital Evidence" />
          <SingleSelectPills
            options={DIGITAL_STATUSES}
            value={form.digitalEvidenceStatus}
            onChange={(v) => updateForm('digitalEvidenceStatus', v)}
          />
          <TextInputBox
            value={form.digitalEvidenceDetails}
            onChangeText={(v) => updateForm('digitalEvidenceDetails', v)}
            placeholder="Phone make, extraction status, hash value sealing details..."
          />

          {/* CCTV / Video */}
          <FieldLabel label="CCTV / Video Evidence" />
          <SingleSelectPills
            options={CCTV_STATUSES}
            value={form.cctvStatus}
            onChange={(v) => updateForm('cctvStatus', v)}
          />
          <TextInputBox
            value={form.cctvDetails}
            onChangeText={(v) => updateForm('cctvDetails', v)}
            placeholder="Camera locations, timestamps, footage preservation..."
          />

          {/* Witness Evidence */}
          <FieldLabel label="Witness Evidence Status" />
          <SingleSelectPills
            options={WITNESS_STATUSES}
            value={form.witnessEvidenceStatus}
            onChange={(v) => updateForm('witnessEvidenceStatus', v)}
          />
          <TextInputBox
            value={form.witnessEvidenceDetails}
            onChangeText={(v) => updateForm('witnessEvidenceDetails', v)}
            placeholder="Independent eyewitness statements or lack thereof..."
          />
        </SectionCard>

        {/* Section 5 — Arrest & Search Details */}
        <SectionCard title="5. Arrest & Search Details" subtitle="Warrant, procedure & seizure circumstances">
          <FieldLabel label="Arrest Circumstances" />
          <TextInputBox
            value={form.arrestCircumstances}
            onChangeText={(v) => updateForm('arrestCircumstances', v)}
            placeholder="How and when was the arrest conducted? (e.g. During routine check, informant tip...)"
            multiline
            minHeight={70}
          />

          <FieldLabel label="Search Conducted?" />
          <SingleSelectPills
            options={YES_NO_UNKNOWN}
            value={form.searchConducted}
            onChange={(v) => updateForm('searchConducted', v)}
          />

          {form.searchConducted === 'Yes' && (
            <View
              style={{
                backgroundColor: P.paper,
                padding: 12,
                borderRadius: 4,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <FieldLabel label="Search Location" />
              <TextInputBox
                value={form.searchLocation}
                onChangeText={(v) => updateForm('searchLocation', v)}
                placeholder="e.g. Private residence, roadside vehicle..."
              />

              <FieldLabel label="Search Warrant Involved?" />
              <SingleSelectPills
                options={YES_NO_UNKNOWN}
                value={form.searchWarrantInvolved}
                onChange={(v) => updateForm('searchWarrantInvolved', v)}
              />

              <FieldLabel label="Who Conducted the Search" />
              <TextInputBox
                value={form.searchConductedBy}
                onChangeText={(v) => updateForm('searchConductedBy', v)}
                placeholder="e.g. SI and two police constables"
              />

              <FieldLabel label="Relevant Search Details" />
              <TextInputBox
                value={form.searchDetails}
                onChangeText={(v) => updateForm('searchDetails', v)}
                placeholder="Were independent witnesses present during search? Were rights explained?"
                multiline
                minHeight={60}
              />
            </View>
          )}

          <FieldLabel label="Seizure Details" />
          <TextInputBox
            value={form.seizureItems}
            onChangeText={(v) => updateForm('seizureItems', v)}
            placeholder="What was seized? Where found? From whom recovered?"
            multiline
            minHeight={65}
          />
        </SectionCard>

        {/* Section 6 — Statements & Admissions */}
        <SectionCard title="6. Statements & Admissions" subtitle="Accused statements & cautionary notes">
          <FieldLabel label="Accused Statement Available?" />
          <SingleSelectPills
            options={YES_NO_UNKNOWN}
            value={form.accusedStatementAvailable}
            onChange={(v) => updateForm('accusedStatementAvailable', v)}
          />

          <FieldLabel label="Confession / Admission Alleged?" />
          <SingleSelectPills
            options={YES_NO_UNKNOWN}
            value={form.confessionAdmission}
            onChange={(v) => updateForm('confessionAdmission', v)}
          />

          <FieldLabel label="Statement Details" />
          <TextInputBox
            value={form.statementDetails}
            onChangeText={(v) => updateForm('statementDetails', v)}
            placeholder="Enter key quotes or context from statement..."
            multiline
            minHeight={70}
          />

          <View
            style={{
              backgroundColor: '#faf8f5',
              padding: 8,
              borderRadius: 4,
              borderLeftWidth: 3,
              borderLeftColor: P.muted,
            }}
          >
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: P.muted }}>
              Note: Only provide information available from the case record.
            </Text>
          </View>
        </SectionCard>

        {/* Section 7 — Defense Information */}
        <SectionCard title="7. Defense Information" subtitle="Lawyer's theories, supporting & disputed facts">
          <FieldLabel label="Known Defense Arguments" />
          <TextInputBox
            value={form.knownDefenseArguments}
            onChangeText={(v) => updateForm('knownDefenseArguments', v)}
            placeholder="Enter any defense arguments already identified by the lawyer..."
            multiline
            minHeight={70}
          />

          <FieldLabel label="Important Facts Supporting the Defense" />
          <TextInputBox
            value={form.supportingFacts}
            onChangeText={(v) => updateForm('supportingFacts', v)}
            placeholder="Facts establishing alibi, illegal search, or lack of knowledge..."
            multiline
            minHeight={65}
          />

          <FieldLabel label="Disputed Facts" />
          <TextInputBox
            value={form.disputedFacts}
            onChangeText={(v) => updateForm('disputedFacts', v)}
            placeholder="Facts in the police report vigorously disputed by the accused..."
            multiline
            minHeight={65}
          />

          <FieldLabel label="Other Relevant Information" />
          <TextInputBox
            value={form.otherRelevantInfo}
            onChangeText={(v) => updateForm('otherRelevantInfo', v)}
            placeholder="Any other procedural, statutory, or contextual notes..."
            multiline
            minHeight={60}
          />
        </SectionCard>

        {/* Section 8 — Additional Documents */}
        <SectionCard title="8. Additional Documents" subtitle="Attach reports, statements or photos">
          {form.documents.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              {form.documents.map((doc) => (
                <View
                  key={doc.id}
                  style={{
                    backgroundColor: P.paper,
                    borderWidth: 1,
                    borderColor: P.border,
                    borderRadius: 4,
                    padding: 10,
                    marginBottom: 6,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.ink }}>
                      📄 {doc.name}
                    </Text>
                    <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted, marginTop: 2 }}>
                      {doc.type} · {doc.size}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveDocument(doc.id)}>
                    <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: P.accent }}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => setShowDocModal(true)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: P.ink,
              borderRadius: 4,
              alignItems: 'center',
              backgroundColor: P.paper2,
            }}
          >
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11.5, color: P.ink }}>
              + Add Document
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Validation Error */}
        {validationError ? (
          <View
            style={{
              backgroundColor: '#fff3f0',
              borderWidth: 1,
              borderColor: '#f87171',
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: '#9a2a1f', marginBottom: 2 }}>
              No new information added
            </Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#9a2a1f' }}>
              {validationError}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: P.white,
          borderTopWidth: 1,
          borderTopColor: P.border,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 14,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        }}
      >
        <TouchableOpacity
          onPress={handleTriggerReanalyze}
          style={{
            backgroundColor: P.ink,
            borderRadius: 6,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: P.paper, letterSpacing: 0.3 }}>
            Re-analyze Case →
          </Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5, color: P.muted, textAlign: 'center', marginTop: 6 }}>
          The updated information will be combined with the existing case data and analyzed again.
        </Text>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(14,14,12,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: P.white,
              borderRadius: 8,
              padding: 20,
              width: '100%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: P.border,
            }}
          >
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: P.ink, marginBottom: 8 }}>
              Re-analyze this case?
            </Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 12, color: P.muted, lineHeight: 18, marginBottom: 20 }}>
              Additional case information will be included in a new analysis. Your previous analysis will remain available for comparison.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: P.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12.5, color: P.ink }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReanalyze}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 4,
                  backgroundColor: P.ink,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12.5, color: P.paper }}>
                  Re-analyze
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Witness Modal */}
      <Modal visible={showWitnessModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(14,14,12,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: P.white,
              borderRadius: 8,
              padding: 20,
              width: '100%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: P.border,
            }}
          >
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: P.ink, marginBottom: 14 }}>
              Add Witness
            </Text>

            <FieldLabel label="Witness Name" optional={false} />
            <TextInputBox
              value={witnessName}
              onChangeText={setWitnessName}
              placeholder="e.g. M. Sunil Perera"
            />

            <FieldLabel label="Role" />
            <TextInputBox
              value={witnessRole}
              onChangeText={setWitnessRole}
              placeholder="e.g. Eyewitness, Arrest Witness, Neighbor"
            />

            <FieldLabel label="Brief Description / Statement" />
            <TextInputBox
              value={witnessDesc}
              onChangeText={setWitnessDesc}
              placeholder="Brief summary of witness perspective..."
              multiline
              minHeight={60}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                onPress={() => setShowWitnessModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: P.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.ink }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddWitness}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 4,
                  backgroundColor: P.ink,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.paper }}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Document Modal */}
      <Modal visible={showDocModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(14,14,12,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: P.white,
              borderRadius: 8,
              padding: 20,
              width: '100%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: P.border,
            }}
          >
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: P.ink, marginBottom: 14 }}>
              Add Supporting Document
            </Text>

            <FieldLabel label="Document Type" />
            <SingleSelectPills
              options={DOC_TYPES}
              value={docType}
              onChange={(v) => setDocType(v)}
            />

            <FieldLabel label="Document / File Name" optional={false} />
            <TextInputBox
              value={docName}
              onChangeText={setDocName}
              placeholder="e.g. GA_Report_Heroin_Analysis_2026.pdf"
            />

            <FieldLabel label="File Size" />
            <TextInputBox
              value={docSize}
              onChangeText={setDocSize}
              placeholder="e.g. 1.2 MB"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                onPress={() => setShowDocModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: P.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.ink }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddDocument}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 4,
                  backgroundColor: P.ink,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: P.paper }}>
                  Attach
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
