import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    Scale, ShieldAlert, Crosshair, FileWarning, Search, ChevronDown, ChevronUp,
    AlertTriangle, CheckCircle2, ShieldCheck, Target, Sparkles, FolderInput,
    RefreshCw, FileText, UserCheck, AlertCircle, ArrowRight, MessageSquare,
    Send, Bot, X, Maximize2, Zap
} from 'lucide-react-native';
import { useOpponentStore } from '../store/useOpponentStore';
import { useAnalyzerStore } from '../store/useAnalyzerStore';
import { useAuthStore } from '../store/useAuthStore';
import {
    ChatMessage,
    sendCaseAssistantMessage,
    compileOpponentContextSnapshot
} from '../services/caseAssistantService';

const CollapsibleSection = ({ title, icon: Icon, defaultOpen = false, children, badge }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <View className="mb-4 bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden shadow-sm">
            <TouchableOpacity 
                onPress={() => setIsOpen(!isOpen)}
                className="flex-row items-center justify-between p-4"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <Icon size={18} color="#818cf8" />
                    <Text className="text-white font-semibold text-sm">{title}</Text>
                    {badge && (
                        <View className="bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                            <Text className="text-indigo-300 text-[10px] font-mono">{badge}</Text>
                        </View>
                    )}
                </View>
                {isOpen ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
            </TouchableOpacity>
            {isOpen && (
                <View className="p-4 pt-1 border-t border-gray-800/60 bg-gray-950/40">
                    {children}
                </View>
            )}
        </View>
    );
};

export default function OpponentPredictionScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();

    const {
        charges, defenseArguments, caseType, caseFacts, legalSections,
        incidentDate, incidentLocation, policeStation, accusedPerson, investigatingOfficer,
        physicalEvidenceType, physicalEvidenceQuantity, physicalEvidenceLocation, physicalEvidenceRecoveredBy,
        forensicReportStatus, forensicReportDetails, chainOfCustodyStatus, chainOfCustodyDetails,
        searchWarrantInvolved, searchDetails, arrestCircumstances,
        accusedStatementAvailable, confessionAdmission, statementDetails,
        witnessEvidenceStatus, witnessSummaries, hearingNotes, evidenceSummaries,
        adversarialAnalysis, analysis, predictions, risk, isLoading, error,
        setField, runAnalysis, importFromAnalyzerStore, loadDrugCasePreset, reset
    } = useOpponentStore();

    const analyzerStore = useAnalyzerStore();
    const [activeTab, setActiveTab] = useState<'arguments' | 'theory' | 'attacks' | 'vulnerabilities' | 'evidence' | 'witnesses' | 'procedural' | 'priorities' | 'summary' | 'chat'>('arguments');

    // ── Chatbot State ────────────────────────────────────────────────────────
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [chatConversationId, setChatConversationId] = useState<string | null>(null);
    const chatScrollRef = useRef<ScrollView>(null);

    const adv = adversarialAnalysis;

    const suggestedChatQuestions = [
        "How do we counter the constructive possession argument?",
        "What cross-examination questions should I ask SI Bandara?",
        "How does the missing seal number help our bail application?",
        "What if the prosecution produces the GA report at the next hearing?",
        "What is our biggest vulnerability and how do we patch it?",
        "Explain the legal significance of the 4.65g weight."
    ];

    const handleImportAnalyzer = () => {
        importFromAnalyzerStore(analyzerStore.additionalDetails, analyzerStore.originalInput);
    };

    const handleSendChatMessage = async (textToSend?: string) => {
        const text = (textToSend || chatInput).trim();
        if (!text || chatLoading) return;

        setChatInput('');
        setChatError(null);

        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}-u`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };

        const updatedHistory = [...chatMessages, userMessage];
        setChatMessages(updatedHistory);
        setChatLoading(true);

        const opponentSnapshot = compileOpponentContextSnapshot(useOpponentStore.getState());

        try {
            const response = await sendCaseAssistantMessage({
                caseId: opponentSnapshot.caseId || 'opponent-case',
                message: text,
                conversationId: chatConversationId || undefined,
                conversationHistory: updatedHistory,
                caseContext: opponentSnapshot,
                token: user?.token,
                userId: user?._id,
            });

            if (response.conversationId) {
                setChatConversationId(response.conversationId);
            }

            const assistantMessage: ChatMessage = {
                id: response.message.id || `msg-${Date.now()}-a`,
                sender: 'assistant',
                text: response.message.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sources: response.sources || [],
                disclaimer: response.disclaimer,
                status: 'sent',
            };

            setChatMessages([...updatedHistory, assistantMessage]);
            setTimeout(() => {
                chatScrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (err: any) {
            console.error('[Opponent Chat Error]:', err.message);
            setChatError(err.message || 'Unable to connect to Case Assistant.');
        } finally {
            setChatLoading(false);
        }
    };

    const handleOpenFullScreenChat = () => {
        const opponentSnapshot = compileOpponentContextSnapshot(useOpponentStore.getState());
        navigation.navigate('CaseAssistant', {
            caseId: opponentSnapshot.caseId,
            caseTitle: opponentSnapshot.caseTitle,
            caseContext: opponentSnapshot
        });
        setIsChatModalOpen(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 110 }}>
                {/* ── Screen Header ── */}
                <View className="mb-4">
                    <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center gap-2 flex-1 mr-2">
                            <TouchableOpacity
                                onPress={() => {
                                    if (navigation.canGoBack()) {
                                        navigation.goBack();
                                    } else {
                                        navigation.navigate('DefenderLanding');
                                    }
                                }}
                                className="w-7 h-7 rounded-full border border-gray-700 bg-gray-900 items-center justify-center"
                                accessibilityLabel="Go back to Defender"
                            >
                                <Text className="text-white text-xs font-semibold">←</Text>
                            </TouchableOpacity>
                            <Text className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Fraunces_700Bold' }}>
                                Opponent Prediction
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <TouchableOpacity
                                onPress={() => setIsChatModalOpen(true)}
                                className="bg-indigo-900/80 px-2.5 py-1 rounded-full border border-indigo-700 flex-row items-center gap-1"
                                activeOpacity={0.8}
                            >
                                <Bot size={13} color="#a5b4fc" />
                                <Text className="text-indigo-200 text-xs font-semibold">Chatbot</Text>
                            </TouchableOpacity>
                            <View className="bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-800/80">
                                <Text className="text-indigo-300 text-xs font-semibold">ADVERSARIAL AI</Text>
                            </View>
                        </View>
                    </View>
                    <Text className="text-gray-400 text-xs leading-relaxed">
                        Evidence-aware analysis anticipating prosecution theories, arguments, evidence attacks, and defense vulnerabilities before hearing.
                    </Text>
                </View>

                {/* ── Segmented Navigation Control: [ ⚖ Analyzer ]  [ 🛡 Defense ] ── */}
                <View className="flex-row bg-gray-900/90 p-1 rounded-xl border border-gray-800 mb-4 shadow-sm">
                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate('AnalyzerForm');
                        }}
                        className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg border border-transparent"
                        activeOpacity={0.8}
                        accessibilityRole="tab"
                        accessibilityLabel="Navigate to Defense Analyzer"
                    >
                        <Scale size={16} color="#9ca3af" />
                        <Text className="text-gray-400 font-bold text-xs">
                            Analyzer
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 border border-indigo-400 shadow-sm"
                        activeOpacity={0.9}
                        accessibilityRole="tab"
                        accessibilityLabel="Defense & Opponent Prediction (Active)"
                    >
                        <ShieldCheck size={16} color="#ffffff" />
                        <Text className="text-white font-bold text-xs">
                            Defense
                        </Text>
                    </TouchableOpacity>
                </View>

                {error && (
                    <View className="mb-5 p-3.5 bg-red-950/40 border border-red-500/80 rounded-xl flex-row items-center gap-2.5">
                        <AlertTriangle size={18} color="#ef4444" />
                        <Text className="text-red-300 text-xs flex-1">{error}</Text>
                    </View>
                )}

                {/* ── MODE 1: Input Form (when analysis is not yet run) ── */}
                {!adv && !analysis ? (
                    <View className="gap-3">
                        {/* Preset & Import Bar */}
                        <View className="flex-row gap-2 mb-2">
                            <TouchableOpacity
                                onPress={handleImportAnalyzer}
                                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-900 border border-indigo-700/60 rounded-xl"
                                activeOpacity={0.8}
                            >
                                <FolderInput size={15} color="#a5b4fc" />
                                <Text className="text-indigo-200 text-xs font-semibold">Import from Analyzer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={loadDrugCasePreset}
                                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-950/70 border border-indigo-600 rounded-xl"
                                activeOpacity={0.8}
                            >
                                <Sparkles size={15} color="#c7d2fe" />
                                <Text className="text-indigo-100 text-xs font-bold">Load Test Drug Case</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Required Fields */}
                        <View className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 mb-2">
                            <View className="mb-4">
                                <View className="flex-row items-center justify-between mb-1.5">
                                    <Text className="text-gray-200 font-semibold text-xs uppercase tracking-wider">Charges (Required)</Text>
                                    <Text className="text-indigo-400 text-[11px]">Primary charge</Text>
                                </View>
                                <TextInput
                                    className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs leading-5"
                                    placeholder="e.g. Possession & Trafficking of Methamphetamine under Section 54A..."
                                    placeholderTextColor="#4b5563"
                                    multiline
                                    value={charges}
                                    onChangeText={(val) => setField('charges', val)}
                                />
                            </View>

                            <View>
                                <View className="flex-row items-center justify-between mb-1.5">
                                    <Text className="text-gray-200 font-semibold text-xs uppercase tracking-wider">Defense Arguments (Required)</Text>
                                    <Text className="text-indigo-400 text-[11px]">Key defenses</Text>
                                </View>
                                <TextInput
                                    className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs h-28 leading-5"
                                    placeholder="Enter defense claims, alibis, lack of knowledge/exclusive control, passenger status, procedural objections..."
                                    placeholderTextColor="#4b5563"
                                    multiline
                                    textAlignVertical="top"
                                    value={defenseArguments}
                                    onChangeText={(val) => setField('defenseArguments', val)}
                                />
                            </View>
                        </View>

                        {/* Collapsible Section 1: Physical Evidence & Forensics */}
                        <CollapsibleSection title="Physical Evidence & Forensic Status" icon={Target} badge={physicalEvidenceType ? "Configured" : undefined} defaultOpen={Boolean(physicalEvidenceType)}>
                            <View className="gap-2.5">
                                <View>
                                    <Text className="text-gray-400 text-[11px] mb-1 font-medium">Substance / Physical Evidence Type</Text>
                                    <TextInput
                                        className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white text-xs"
                                        placeholder="e.g. Alleged Methamphetamine / Cash / Weapon"
                                        placeholderTextColor="#4b5563"
                                        value={physicalEvidenceType}
                                        onChangeText={(val) => setField('physicalEvidenceType', val)}
                                    />
                                </View>
                                <View className="flex-row gap-2">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[11px] mb-1 font-medium">Quantity / Gross Weight</Text>
                                        <TextInput
                                            className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white text-xs"
                                            placeholder="e.g. approximately 4.65g"
                                            placeholderTextColor="#4b5563"
                                            value={physicalEvidenceQuantity}
                                            onChangeText={(val) => setField('physicalEvidenceQuantity', val)}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[11px] mb-1 font-medium">Recovery Location</Text>
                                        <TextInput
                                            className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white text-xs"
                                            placeholder="e.g. Underneath passenger seat"
                                            placeholderTextColor="#4b5563"
                                            value={physicalEvidenceLocation}
                                            onChangeText={(val) => setField('physicalEvidenceLocation', val)}
                                        />
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-[11px] mb-1 font-medium">Government Analyst / Forensic Report Status</Text>
                                    <View className="flex-row gap-1.5 mb-1.5">
                                        {['Pending', 'Available', 'Not Available', 'Unknown'].map((st) => (
                                            <TouchableOpacity
                                                key={st}
                                                onPress={() => setField('forensicReportStatus', st)}
                                                className={`py-1.5 px-2.5 rounded-lg border flex-1 items-center ${forensicReportStatus === st ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-900 border-gray-800'}`}
                                            >
                                                <Text className={`text-[10px] font-medium ${forensicReportStatus === st ? 'text-white font-bold' : 'text-gray-400'}`}>{st}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                        placeholder="Forensic details (e.g. pending report, chemical identity unconfirmed)"
                                        placeholderTextColor="#4b5563"
                                        value={forensicReportDetails}
                                        onChangeText={(val) => setField('forensicReportDetails', val)}
                                    />
                                </View>
                            </View>
                        </CollapsibleSection>

                        {/* Collapsible Section 2: Chain of Custody & Search Details */}
                        <CollapsibleSection title="Chain of Custody, Warrant & Search" icon={ShieldAlert} badge={chainOfCustodyStatus !== 'Unknown' ? chainOfCustodyStatus : undefined}>
                            <View className="gap-2.5">
                                <View>
                                    <Text className="text-gray-400 text-[11px] mb-1 font-medium">Chain of Custody Status</Text>
                                    <View className="flex-row gap-1.5 mb-1.5">
                                        {['Incomplete', 'Complete', 'Not Available', 'Unknown'].map((st) => (
                                            <TouchableOpacity
                                                key={st}
                                                onPress={() => setField('chainOfCustodyStatus', st)}
                                                className={`py-1.5 px-2.5 rounded-lg border flex-1 items-center ${chainOfCustodyStatus === st ? 'bg-amber-700/80 border-amber-500' : 'bg-gray-900 border-gray-800'}`}
                                            >
                                                <Text className={`text-[10px] font-medium ${chainOfCustodyStatus === st ? 'text-white font-bold' : 'text-gray-400'}`}>{st}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                        placeholder="Custody details (e.g. missing seal number, transfer gaps)"
                                        placeholderTextColor="#4b5563"
                                        value={chainOfCustodyDetails}
                                        onChangeText={(val) => setField('chainOfCustodyDetails', val)}
                                    />
                                </View>

                                <View className="flex-row gap-2 items-center">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[11px] mb-1 font-medium">Search Warrant Involved?</Text>
                                        <View className="flex-row gap-1.5">
                                            {['No', 'Yes', 'Unknown'].map((w) => (
                                                <TouchableOpacity
                                                    key={w}
                                                    onPress={() => setField('searchWarrantInvolved', w)}
                                                    className={`py-1.5 px-2.5 rounded-lg border flex-1 items-center ${searchWarrantInvolved === w ? 'bg-red-900/60 border-red-500' : 'bg-gray-900 border-gray-800'}`}
                                                >
                                                    <Text className={`text-[10px] font-medium ${searchWarrantInvolved === w ? 'text-white font-bold' : 'text-gray-400'}`}>{w}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <TextInput
                                    className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                    placeholder="Search details (e.g. warrantless roadside vehicle search)"
                                    placeholderTextColor="#4b5563"
                                    value={searchDetails}
                                    onChangeText={(val) => setField('searchDetails', val)}
                                />
                            </View>
                        </CollapsibleSection>

                        {/* Collapsible Section 3: Witnesses & Parties */}
                        <CollapsibleSection title="Witnesses, Parties & Civilian Corroboration" icon={Search} badge={witnessEvidenceStatus !== 'Unknown' ? witnessEvidenceStatus : undefined}>
                            <View className="gap-2.5">
                                <View className="flex-row gap-2">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[11px] mb-1 font-medium">Accused Role / Name</Text>
                                        <TextInput
                                            className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                            placeholder="e.g. Passenger"
                                            placeholderTextColor="#4b5563"
                                            value={accusedPerson}
                                            onChangeText={(val) => setField('accusedPerson', val)}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[11px] mb-1 font-medium">Investigating Officer</Text>
                                        <TextInput
                                            className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                            placeholder="e.g. SI Bandara"
                                            placeholderTextColor="#4b5563"
                                            value={investigatingOfficer}
                                            onChangeText={(val) => setField('investigatingOfficer', val)}
                                        />
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-[11px] mb-1 font-medium">Civilian Witness Status</Text>
                                    <View className="flex-row gap-1.5 mb-1.5">
                                        {['Statements unavailable', 'Witness statements available', 'Unknown'].map((ws) => (
                                            <TouchableOpacity
                                                key={ws}
                                                onPress={() => setField('witnessEvidenceStatus', ws)}
                                                className={`py-1.5 px-2 rounded-lg border flex-1 items-center ${witnessEvidenceStatus === ws ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-900 border-gray-800'}`}
                                            >
                                                <Text className={`text-[9px] font-medium text-center ${witnessEvidenceStatus === ws ? 'text-white font-bold' : 'text-gray-400'}`} numberOfLines={1}>
                                                    {ws === 'Statements unavailable' ? 'No Civilian Wit.' : ws === 'Witness statements available' ? 'Civilian Wit. Avail.' : 'Unknown'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs h-16"
                                        placeholder="Witness summaries (e.g. no independent civilian witness, uncorroborated police testimony)..."
                                        placeholderTextColor="#4b5563"
                                        multiline
                                        textAlignVertical="top"
                                        value={witnessSummaries}
                                        onChangeText={(val) => setField('witnessSummaries', val)}
                                    />
                                </View>
                            </View>
                        </CollapsibleSection>

                        {/* Collapsible Section 4: Case Facts, Statements & Hearing Notes */}
                        <CollapsibleSection title="Incident Details, Statements & Context" icon={Scale}>
                            <View className="gap-2.5">
                                <View className="flex-row gap-2">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[11px] mb-1 font-medium">Incident Location</Text>
                                        <TextInput
                                            className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                            placeholder="e.g. Checkpoint / Highway"
                                            placeholderTextColor="#4b5563"
                                            value={incidentLocation}
                                            onChangeText={(val) => setField('incidentLocation', val)}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[11px] mb-1 font-medium">Police Station</Text>
                                        <TextInput
                                            className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                            placeholder="e.g. Piliyandala Police"
                                            placeholderTextColor="#4b5563"
                                            value={policeStation}
                                            onChangeText={(val) => setField('policeStation', val)}
                                        />
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-[11px] mb-1 font-medium">Accused Statement / Admission</Text>
                                    <TextInput
                                        className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs"
                                        placeholder="e.g. Denied knowledge and possession immediately upon arrest"
                                        placeholderTextColor="#4b5563"
                                        value={statementDetails}
                                        onChangeText={(val) => setField('statementDetails', val)}
                                    />
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-[11px] mb-1 font-medium">Hearing Notes & Court Context</Text>
                                    <TextInput
                                        className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-xs h-16"
                                        placeholder="Notes from previous hearings, bail applications, magistrate directions..."
                                        placeholderTextColor="#4b5563"
                                        multiline
                                        textAlignVertical="top"
                                        value={hearingNotes}
                                        onChangeText={(val) => setField('hearingNotes', val)}
                                    />
                                </View>
                            </View>
                        </CollapsibleSection>

                        {/* Submit Button */}
                        <TouchableOpacity 
                            className={`py-4 rounded-xl items-center mt-3 shadow-lg ${isLoading ? 'bg-indigo-700/60' : 'bg-indigo-600'}`}
                            onPress={runAnalysis}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <View className="flex-row items-center gap-2.5">
                                    <ActivityIndicator color="#ffffff" size="small" />
                                    <Text className="text-white font-bold text-sm">Evaluating Case Evidence & Strategy...</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center gap-2">
                                    <Crosshair size={18} color="#ffffff" />
                                    <Text className="text-white font-bold text-base">Generate Adversarial Analysis</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* ── MODE 2: Comprehensive 14-Section Adversarial Results ── */
                    <View className="gap-5">
                        {/* Top Reset / Re-run Bar */}
                        <View className="flex-row items-center justify-between p-3 bg-gray-900/90 rounded-xl border border-gray-800">
                            <View className="flex-1 pr-2">
                                <Text className="text-white font-bold text-sm" numberOfLines={1}>{charges || 'Case Analysis'}</Text>
                                <Text className="text-gray-400 text-[11px]">{adv ? '14-Section Evidence-Aware Analysis' : 'Standard Analysis'}</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <TouchableOpacity 
                                    onPress={() => setIsChatModalOpen(true)}
                                    className="flex-row items-center gap-1 py-1.5 px-2.5 bg-indigo-950 border border-indigo-700 rounded-lg"
                                    activeOpacity={0.8}
                                >
                                    <MessageSquare size={13} color="#a5b4fc" />
                                    <Text className="text-indigo-200 text-xs font-semibold">Chat</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={reset}
                                    className="flex-row items-center gap-1.5 py-1.5 px-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
                                >
                                    <RefreshCw size={13} color="#9ca3af" />
                                    <Text className="text-gray-300 text-xs font-medium">Edit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── SECTION 1: Overall Risk Assessment ── */}
                        {adv?.overall_risk_assessment && (
                            <View className={`p-4 rounded-2xl border ${
                                adv.overall_risk_assessment.risk_level === 'HIGH' || adv.overall_risk_assessment.risk_level === 'VERY HIGH'
                                    ? 'bg-red-950/20 border-red-500/50'
                                    : adv.overall_risk_assessment.risk_level === 'MODERATE'
                                    ? 'bg-amber-950/25 border-amber-500/60'
                                    : 'bg-emerald-950/20 border-emerald-500/50'
                            }`}>
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center gap-2">
                                        <ShieldAlert size={20} color={adv.overall_risk_assessment.risk_level === 'MODERATE' ? '#f59e0b' : adv.overall_risk_assessment.risk_level === 'LOW' ? '#10b981' : '#ef4444'} />
                                        <Text className="text-base font-bold text-white">Risk Level: {adv.overall_risk_assessment.risk_level}</Text>
                                    </View>
                                    <View className="bg-gray-900/80 px-2.5 py-0.5 rounded-full border border-gray-700">
                                        <Text className="text-gray-300 text-[11px] font-mono">Confidence: {adv.overall_risk_assessment.confidence_score}%</Text>
                                    </View>
                                </View>
                                
                                <Text className="text-gray-300 text-xs leading-relaxed mb-3">
                                    {adv.overall_risk_assessment.short_explanation}
                                </Text>

                                <View className="gap-2 pt-2 border-t border-gray-800/80">
                                    <View>
                                        <Text className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider mb-1">Key Factors Strengthening Prosecution:</Text>
                                        {adv.overall_risk_assessment.prosecution_strength_factors.map((f, i) => (
                                            <View key={i} className="flex-row items-start gap-1.5 mb-1">
                                                <Text className="text-emerald-400 text-xs">•</Text>
                                                <Text className="text-gray-300 text-xs flex-1">{f}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View className="mt-1">
                                        <Text className="text-amber-400 font-semibold text-[11px] uppercase tracking-wider mb-1">Key Factors Weakening Prosecution:</Text>
                                        {adv.overall_risk_assessment.prosecution_weakness_factors.map((f, i) => (
                                            <View key={i} className="flex-row items-start gap-1.5 mb-1">
                                                <Text className="text-amber-400 text-xs">•</Text>
                                                <Text className="text-gray-300 text-xs flex-1">{f}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Navigation Tabs for 14 Sections & Chatbot */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                            {[
                                { id: 'arguments', label: '1. Prosecution Args' },
                                { id: 'theory', label: '2. Theory of Case' },
                                { id: 'attacks', label: '3. Attacks on Defense' },
                                { id: 'vulnerabilities', label: '4. Defense Vulnerabilities' },
                                { id: 'evidence', label: '5. Evidence Analysis' },
                                { id: 'witnesses', label: '6. Witness Analysis' },
                                { id: 'procedural', label: '7. Procedural & Forensics' },
                                { id: 'priorities', label: '8. Top 5 Priorities' },
                                { id: 'summary', label: '9. Adversarial Summary' },
                                { id: 'chat', label: '💬 Strategist Chatbot' },
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id as any)}
                                    className={`py-2 px-3 rounded-xl border ${activeTab === tab.id ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-900 border-gray-800'}`}
                                >
                                    <Text className={`text-xs font-semibold ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>{tab.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* ── TAB CONTENT ── */}

                        {/* TAB 1: Likely Prosecution Arguments (5 to 8 arguments) */}
                        {activeTab === 'arguments' && (
                            <View className="gap-3">
                                <View className="flex-row items-center justify-between mb-1">
                                    <View className="flex-row items-center gap-2">
                                        <Crosshair size={18} color="#a78bfa" />
                                        <Text className="text-sm font-bold text-white uppercase tracking-wider">Likely Prosecution Arguments ({adv?.likely_prosecution_arguments?.length || 0})</Text>
                                    </View>
                                </View>
                                {adv?.likely_prosecution_arguments?.map((arg, idx) => (
                                    <View key={idx} className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2 shadow-sm">
                                        <View className="flex-row items-start justify-between">
                                            <Text className="text-indigo-300 font-bold text-xs flex-1 mr-2">{idx + 1}. {arg.title}</Text>
                                            <View className={`px-2 py-0.5 rounded border ${arg.strength === 'Strong' ? 'bg-red-950/70 border-red-600' : arg.strength === 'Moderate' ? 'bg-amber-950/70 border-amber-600' : 'bg-emerald-950/70 border-emerald-600'}`}>
                                                <Text className={`text-[10px] font-bold ${arg.strength === 'Strong' ? 'text-red-300' : arg.strength === 'Moderate' ? 'text-amber-300' : 'text-emerald-300'}`}>{arg.strength} ({arg.confidence}%)</Text>
                                            </View>
                                        </View>
                                        <Text className="text-gray-200 text-xs leading-5 font-normal">{arg.argument}</Text>
                                        
                                        <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800/80 gap-1.5 mt-1">
                                            <Text className="text-[11px] text-gray-400 font-medium"><Text className="text-indigo-400 font-semibold">Supporting Evidence: </Text>{arg.supporting_evidence}</Text>
                                            <Text className="text-[11px] text-gray-400 font-medium"><Text className="text-amber-400 font-semibold">Prosecution Goal: </Text>{arg.prosecution_objective}</Text>
                                            <Text className="text-[11px] text-gray-300 font-medium"><Text className="text-emerald-400 font-semibold">Expected Defense Response: </Text>{arg.expected_defense_response}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* TAB 2: Prosecution Theory of the Case */}
                        {activeTab === 'theory' && adv?.prosecution_theory_of_case && (
                            <View className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-3">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <Target size={18} color="#818cf8" />
                                    <Text className="text-sm font-bold text-white uppercase tracking-wider">Prosecution Theory of the Case</Text>
                                </View>

                                <View className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/50">
                                    <Text className="text-indigo-200 text-xs font-semibold mb-1">Core Prosecution Narrative</Text>
                                    <Text className="text-gray-300 text-xs leading-relaxed">{adv.prosecution_theory_of_case.narrative}</Text>
                                </View>

                                <View className="gap-2">
                                    <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                                        <Text className="text-gray-400 text-[10px] uppercase font-bold text-indigo-400">Alleged Conduct</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.prosecution_theory_of_case.alleged_conduct}</Text>
                                    </View>
                                    <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                                        <Text className="text-gray-400 text-[10px] uppercase font-bold text-amber-400">Alleged Intent / Knowledge</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.prosecution_theory_of_case.alleged_intent_knowledge}</Text>
                                    </View>
                                    <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                                        <Text className="text-gray-400 text-[10px] uppercase font-bold text-emerald-400">Alleged Possession & Control</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.prosecution_theory_of_case.alleged_possession_control}</Text>
                                    </View>
                                </View>

                                <View className="mt-2">
                                    <Text className="text-gray-300 text-xs font-bold mb-1.5">Projected Evidentiary Chain:</Text>
                                    {adv.prosecution_theory_of_case.evidentiary_chain.map((chain, idx) => (
                                        <View key={idx} className="flex-row items-start gap-2 mb-1.5">
                                            <View className="w-4 h-4 rounded-full bg-indigo-900 items-center justify-center mt-0.5">
                                                <Text className="text-indigo-300 text-[10px] font-bold">{idx + 1}</Text>
                                            </View>
                                            <Text className="text-gray-300 text-xs flex-1">{chain}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View className="mt-2 pt-2 border-t border-gray-800">
                                    <Text className="text-gray-300 text-xs font-bold mb-1">Key Documents / Exhibits:</Text>
                                    {adv.prosecution_theory_of_case.key_documents_exhibits.map((doc, idx) => (
                                        <Text key={idx} className="text-gray-400 text-xs mb-0.5">• {doc}</Text>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* TAB 3: Attacks on the Defense */}
                        {activeTab === 'attacks' && (
                            <View className="gap-3">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <FileWarning size={18} color="#f59e0b" />
                                    <Text className="text-sm font-bold text-white uppercase tracking-wider">Anticipated Attacks on Defense Position</Text>
                                </View>

                                {adv?.attacks_on_defense?.map((atk, idx) => (
                                    <View key={idx} className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2">
                                        <View className="bg-red-950/30 p-2.5 rounded-lg border border-red-900/50">
                                            <Text className="text-red-400 text-[10px] font-bold uppercase">Defense Claim</Text>
                                            <Text className="text-gray-200 text-xs font-medium mt-0.5">{atk.defense_claim}</Text>
                                        </View>

                                        <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 gap-1.5">
                                            <Text className="text-amber-400 text-[10px] font-bold uppercase">Prosecution Counter-Attack</Text>
                                            <Text className="text-gray-300 text-xs leading-5">{atk.prosecution_counterargument}</Text>
                                            <Text className="text-[11px] text-gray-400"><Text className="text-indigo-400 font-semibold">Prosecution Leverage: </Text>{atk.prosecution_leverage_point}</Text>
                                        </View>

                                        <View className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/50">
                                            <Text className="text-emerald-400 text-[10px] font-bold uppercase">Recommended Defense Counter-Strategy</Text>
                                            <Text className="text-emerald-200 text-xs leading-5 mt-0.5">{atk.defense_counter_strategy}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* TAB 4: Detected Defense Vulnerabilities */}
                        {activeTab === 'vulnerabilities' && (
                            <View className="gap-3">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <AlertTriangle size={18} color="#ef4444" />
                                    <Text className="text-sm font-bold text-white uppercase tracking-wider">Detected Defense Vulnerabilities</Text>
                                </View>

                                {adv?.detected_defense_vulnerabilities?.map((vuln, idx) => (
                                    <View key={idx} className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-white font-bold text-xs flex-1 mr-2">{vuln.title}</Text>
                                            <View className={`px-2 py-0.5 rounded border ${vuln.severity === 'Critical' ? 'bg-red-950 border-red-500' : vuln.severity === 'High' ? 'bg-amber-950 border-amber-500' : 'bg-gray-800 border-gray-700'}`}>
                                                <Text className={`text-[10px] font-bold ${vuln.severity === 'Critical' ? 'text-red-400' : vuln.severity === 'High' ? 'text-amber-400' : 'text-gray-300'}`}>{vuln.severity} Severity</Text>
                                            </View>
                                        </View>

                                        <Text className="text-gray-300 text-xs leading-relaxed">{vuln.description}</Text>

                                        <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 gap-1 mt-1">
                                            <Text className="text-[11px] text-gray-400"><Text className="text-indigo-400 font-semibold">Supporting Case Fact: </Text>{vuln.supporting_case_fact}</Text>
                                            <Text className="text-[11px] text-gray-400"><Text className="text-amber-400 font-semibold">Why Exploitable: </Text>{vuln.why_exploitable}</Text>
                                            <Text className="text-[11px] text-emerald-300 font-medium"><Text className="text-emerald-400 font-semibold">Recommended Lawyer Action: </Text>{vuln.recommended_lawyer_review}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* TAB 5: Prosecution Evidence Analysis */}
                        {activeTab === 'evidence' && (
                            <View className="gap-3">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <FileText size={18} color="#818cf8" />
                                    <Text className="text-sm font-bold text-white uppercase tracking-wider">Item-by-Item Evidence Analysis</Text>
                                </View>

                                {adv?.prosecution_evidence_analysis?.map((item, idx) => (
                                    <View key={idx} className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2.5">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-indigo-300 font-bold text-xs flex-1 mr-2">{item.evidence_item}</Text>
                                            <View className="bg-gray-950 px-2 py-0.5 rounded border border-gray-700">
                                                <Text className="text-gray-400 text-[10px]">Reliability: {item.reliability_level}</Text>
                                            </View>
                                        </View>

                                        <View className="gap-2">
                                            <View className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/50">
                                                <Text className="text-emerald-400 text-[10px] font-bold uppercase">What it Proves</Text>
                                                <Text className="text-gray-300 text-xs mt-0.5">{item.what_it_proves}</Text>
                                            </View>
                                            <View className="bg-amber-950/30 p-2 rounded-lg border border-amber-900/50">
                                                <Text className="text-amber-400 text-[10px] font-bold uppercase">What it Does NOT Prove</Text>
                                                <Text className="text-amber-200 text-xs mt-0.5">{item.what_it_does_not_prove}</Text>
                                            </View>
                                        </View>

                                        <View className="bg-gray-950 p-2 rounded-lg border border-gray-800">
                                            <Text className="text-[11px] text-gray-400"><Text className="text-indigo-400 font-semibold">Prosecution Value: </Text>{item.prosecution_value}</Text>
                                            <Text className="text-[11px] text-gray-300 mt-1"><Text className="text-emerald-400 font-semibold">Defense Challenge: </Text>{item.defense_challenge}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* TAB 6: Witness Analysis */}
                        {activeTab === 'witnesses' && (
                            <View className="gap-3">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <UserCheck size={18} color="#818cf8" />
                                    <Text className="text-sm font-bold text-white uppercase tracking-wider">Witness Testimony & Vulnerability Analysis</Text>
                                </View>

                                {adv?.witness_analysis?.map((wit, idx) => (
                                    <View key={idx} className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-white font-bold text-xs flex-1 mr-2">{wit.witness_name_role}</Text>
                                            <View className="bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                                                <Text className="text-indigo-300 text-[10px] font-semibold">{wit.witness_category}</Text>
                                            </View>
                                        </View>

                                        <Text className="text-gray-300 text-xs"><Text className="text-indigo-400 font-semibold">Expected Testimony: </Text>{wit.expected_testimony}</Text>
                                        <Text className="text-gray-400 text-xs"><Text className="text-amber-400 font-semibold">Credibility Factors: </Text>{wit.credibility_reliability}</Text>

                                        <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 mt-1">
                                            <Text className="text-emerald-400 font-semibold text-[11px] mb-1">Likely Cross-Examination Targets:</Text>
                                            {wit.likely_cross_examination_issues.map((issue, i) => (
                                                <Text key={i} className="text-gray-300 text-xs mb-1">• {issue}</Text>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* TAB 7: Procedural, Forensic & Missing Evidence */}
                        {activeTab === 'procedural' && (
                            <View className="gap-4">
                                {/* Search & Procedural */}
                                {adv?.search_arrest_procedural_analysis && (
                                    <View className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2.5">
                                        <View className="flex-row items-center gap-2">
                                            <ShieldAlert size={16} color="#f59e0b" />
                                            <Text className="text-xs font-bold text-white uppercase tracking-wider">Search, Arrest & Procedural Analysis</Text>
                                        </View>
                                        <Text className="text-gray-300 text-xs"><Text className="text-gray-400 font-semibold">Search Circumstances: </Text>{adv.search_arrest_procedural_analysis.search_circumstances}</Text>
                                        <Text className="text-amber-400 text-xs font-semibold"><Text className="text-gray-400 font-normal">Warrant Status: </Text>{adv.search_arrest_procedural_analysis.warrant_status}</Text>
                                        
                                        <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 mt-1">
                                            <Text className="text-red-400 font-bold text-[11px] mb-1">Identified Procedural Issues:</Text>
                                            {adv.search_arrest_procedural_analysis.procedural_issues.map((iss, i) => (
                                                <Text key={i} className="text-red-300 text-xs mb-1">• {iss}</Text>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Forensic & Chain of Custody */}
                                {adv?.forensic_chain_of_custody_analysis && (
                                    <View className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2.5">
                                        <View className="flex-row items-center gap-2">
                                            <Target size={16} color="#818cf8" />
                                            <Text className="text-xs font-bold text-white uppercase tracking-wider">Forensic & Chain of Custody Analysis</Text>
                                        </View>
                                        <View className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/50">
                                            <Text className="text-amber-400 font-bold text-[10px] uppercase">Forensic Report Status</Text>
                                            <Text className="text-white text-xs mt-0.5">{adv.forensic_chain_of_custody_analysis.forensic_report_status}</Text>
                                        </View>
                                        <Text className="text-gray-300 text-xs"><Text className="text-indigo-400 font-semibold">Scientific Confirmation: </Text>{adv.forensic_chain_of_custody_analysis.scientific_confirmation}</Text>
                                        <Text className="text-gray-300 text-xs"><Text className="text-amber-400 font-semibold">Sealing & Seal Number: </Text>{adv.forensic_chain_of_custody_analysis.sealing_and_seal_number}</Text>
                                        <Text className="text-gray-300 text-xs"><Text className="text-gray-400 font-semibold">Transfers & Custody: </Text>{adv.forensic_chain_of_custody_analysis.transfers_and_custody_records}</Text>
                                    </View>
                                )}

                                {/* Missing Evidence */}
                                {adv?.missing_evidence && (
                                    <View className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2">
                                        <Text className="text-xs font-bold text-white uppercase tracking-wider">Missing Evidentiary Items</Text>
                                        {adv.missing_evidence.map((me, i) => (
                                            <View key={i} className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 mb-1">
                                                <View className="flex-row justify-between items-center mb-1">
                                                    <Text className="text-indigo-300 text-xs font-bold">{me.item}</Text>
                                                    <Text className="text-gray-500 text-[10px]">{me.category}</Text>
                                                </View>
                                                <Text className="text-gray-400 text-[11px]"><Text className="text-red-400 font-semibold">Impact on Prosecution: </Text>{me.impact_on_prosecution}</Text>
                                                <Text className="text-emerald-300 text-[11px] mt-0.5"><Text className="text-emerald-400 font-semibold">Defense Leverage: </Text>{me.defense_advantage}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* TAB 8: Top 5 Defense Priorities */}
                        {activeTab === 'priorities' && (
                            <View className="gap-3">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <ShieldCheck size={18} color="#10b981" />
                                    <Text className="text-sm font-bold text-white uppercase tracking-wider">Top 5 Defense Priorities Before Hearing</Text>
                                </View>

                                {adv?.defense_priorities?.map((p) => (
                                    <View key={p.rank} className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-2 shadow-sm">
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center gap-2">
                                                <View className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500 items-center justify-center">
                                                    <Text className="text-emerald-400 text-xs font-bold">{p.rank}</Text>
                                                </View>
                                                <Text className="text-white font-bold text-xs">{p.priority_issue}</Text>
                                            </View>
                                            <View className={`px-2 py-0.5 rounded border ${p.urgency === 'Immediate' ? 'bg-red-950 border-red-600' : 'bg-amber-950 border-amber-600'}`}>
                                                <Text className={`text-[10px] font-bold ${p.urgency === 'Immediate' ? 'text-red-300' : 'text-amber-300'}`}>{p.urgency}</Text>
                                            </View>
                                        </View>

                                        <Text className="text-[11px] text-gray-400"><Text className="text-indigo-400 font-semibold">Tied Evidence: </Text>{p.tied_evidence}</Text>
                                        
                                        <View className="bg-gray-950 p-2.5 rounded-lg border border-gray-800/80 mt-1">
                                            <Text className="text-emerald-300 text-xs font-medium leading-5">{p.action_recommended}</Text>
                                        </View>
                                    </View>
                                ))}

                                {adv?.most_likely_next_prosecution_move && (
                                    <View className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-800/60 gap-2 mt-2">
                                        <Text className="text-indigo-300 font-bold text-xs uppercase tracking-wider">Most Likely Next Prosecution Move</Text>
                                        <Text className="text-white text-xs font-semibold">{adv.most_likely_next_prosecution_move.primary_next_move}</Text>
                                        <Text className="text-gray-300 text-[11px] leading-5">{adv.most_likely_next_prosecution_move.strategic_objective}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* TAB 9: Adversarial Summary */}
                        {activeTab === 'summary' && adv?.overall_adversarial_summary && (
                            <View className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-3">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <FileText size={18} color="#818cf8" />
                                    <Text className="text-sm font-bold text-white uppercase tracking-wider">Overall Adversarial Summary</Text>
                                </View>

                                <View className="gap-2.5">
                                    <View className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <Text className="text-red-400 font-bold text-[10px] uppercase">Strongest Prosecution Point</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.overall_adversarial_summary.strongest_prosecution_point}</Text>
                                    </View>

                                    <View className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <Text className="text-emerald-400 font-bold text-[10px] uppercase">Strongest Defense Point</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.overall_adversarial_summary.strongest_defense_point}</Text>
                                    </View>

                                    <View className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <Text className="text-amber-400 font-bold text-[10px] uppercase">Biggest Evidentiary Uncertainty</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.overall_adversarial_summary.biggest_evidentiary_uncertainty}</Text>
                                    </View>

                                    <View className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <Text className="text-amber-400 font-bold text-[10px] uppercase">Biggest Procedural Uncertainty</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.overall_adversarial_summary.biggest_procedural_uncertainty}</Text>
                                    </View>

                                    <View className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                        <Text className="text-indigo-400 font-bold text-[10px] uppercase">Most Critical Missing Evidence</Text>
                                        <Text className="text-gray-200 text-xs mt-0.5">{adv.overall_adversarial_summary.most_important_missing_evidence}</Text>
                                    </View>

                                    <View className="bg-indigo-950/40 p-3 rounded-lg border border-indigo-800/80">
                                        <Text className="text-indigo-300 font-bold text-[10px] uppercase">Most Important Human Lawyer Review Issue</Text>
                                        <Text className="text-white text-xs mt-0.5 leading-5 font-semibold">{adv.overall_adversarial_summary.most_important_lawyer_review_issue}</Text>
                                    </View>
                                </View>

                                <View className="p-3 bg-gray-950/80 rounded-lg border border-gray-800 mt-2">
                                    <Text className="text-gray-500 text-[10px] leading-relaxed italic text-center">
                                        {adv.overall_adversarial_summary.legal_safety_notice}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* TAB 10: Inline Strategist Chatbot */}
                        {activeTab === 'chat' && (
                            <View className="bg-gray-900 p-4 rounded-xl border border-gray-800 gap-3">
                                <View className="flex-row items-center justify-between border-b border-gray-800 pb-3">
                                    <View className="flex-row items-center gap-2">
                                        <Bot size={20} color="#818cf8" />
                                        <View>
                                            <Text className="text-white font-bold text-sm">Adversarial Case Strategist</Text>
                                            <Text className="text-gray-400 text-[10px]">Grounded in 14-Section Analysis Context</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleOpenFullScreenChat}
                                        className="bg-gray-800 p-1.5 rounded-lg border border-gray-700 flex-row items-center gap-1"
                                    >
                                        <Maximize2 size={13} color="#9ca3af" />
                                        <Text className="text-gray-300 text-[10px]">Full Screen</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Suggested Questions */}
                                <View>
                                    <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-2">Suggested Inquiries:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 pb-1">
                                        {suggestedChatQuestions.map((q, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                onPress={() => handleSendChatMessage(q)}
                                                className="bg-gray-950 border border-gray-800 rounded-full px-3 py-1.5"
                                                activeOpacity={0.8}
                                            >
                                                <Text className="text-indigo-300 text-[11px]">{q}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Chat Message List */}
                                <View className="bg-gray-950/60 rounded-xl p-3 border border-gray-800/80 min-h-[220px] max-h-[360px]">
                                    <ScrollView ref={chatScrollRef} className="flex-1">
                                        {chatMessages.length === 0 ? (
                                            <View className="items-center justify-center py-8">
                                                <Bot size={28} color="#4f46e5" />
                                                <Text className="text-gray-300 font-semibold text-xs mt-2">Ask the Adversarial Strategist</Text>
                                                <Text className="text-gray-500 text-[11px] text-center mt-1 px-4">
                                                    Ask questions about the prosecution's arguments, how to attack specific witnesses, statutory defenses, or bail preparation.
                                                </Text>
                                            </View>
                                        ) : (
                                            chatMessages.map((m) => (
                                                <View key={m.id} className={`mb-3 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                    <View className={`max-w-[88%] p-3 rounded-xl ${m.sender === 'user' ? 'bg-indigo-600 rounded-tr-none' : 'bg-gray-900 border border-gray-800 rounded-tl-none'}`}>
                                                        {m.sender === 'assistant' && (
                                                            <View className="flex-row items-center gap-1 mb-1">
                                                                <Bot size={12} color="#818cf8" />
                                                                <Text className="text-indigo-400 text-[10px] font-bold">Case Strategist</Text>
                                                            </View>
                                                        )}
                                                        <Text className="text-white text-xs leading-5">{m.text}</Text>
                                                        {m.sources && m.sources.length > 0 && (
                                                            <View className="mt-2 pt-1.5 border-t border-gray-800">
                                                                <Text className="text-gray-400 text-[9px] font-semibold uppercase mb-1">Cited Authorities:</Text>
                                                                <View className="flex-row flex-wrap gap-1">
                                                                    {m.sources.map((s, idx) => (
                                                                        <View key={idx} className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                                                                            <Text className="text-indigo-300 text-[9px]">{s.title}</Text>
                                                                        </View>
                                                                    ))}
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                        {chatLoading && (
                                            <View className="items-start mb-2">
                                                <View className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl rounded-tl-none flex-row items-center gap-2">
                                                    <ActivityIndicator size="small" color="#818cf8" />
                                                    <Text className="text-gray-400 text-xs">Strategist is evaluating case record...</Text>
                                                </View>
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>

                                {chatError && (
                                    <Text className="text-red-400 text-[11px]">{chatError}</Text>
                                )}

                                {/* Chat Input Bar */}
                                <View className="flex-row items-center gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
                                    <TextInput
                                        className="flex-1 text-white text-xs px-2.5 py-1.5 max-h-20"
                                        placeholder="Ask a question about this opponent analysis..."
                                        placeholderTextColor="#4b5563"
                                        multiline
                                        value={chatInput}
                                        onChangeText={setChatInput}
                                    />
                                    <TouchableOpacity
                                        onPress={() => handleSendChatMessage()}
                                        disabled={!chatInput.trim() || chatLoading}
                                        className={`p-2 rounded-lg ${chatInput.trim() && !chatLoading ? 'bg-indigo-600' : 'bg-gray-800'}`}
                                    >
                                        <Send size={15} color={chatInput.trim() && !chatLoading ? '#ffffff' : '#6b7280'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Reset button at bottom of results */}
                        <TouchableOpacity 
                            className="py-3.5 border border-gray-700 rounded-xl items-center mt-2 bg-gray-900"
                            onPress={reset}
                            activeOpacity={0.8}
                        >
                            <Text className="text-gray-300 font-semibold text-xs">Reset and Enter New Case</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* ── Floating Chatbot Button (Quick Access Anytime) ── */}
            <TouchableOpacity
                onPress={() => setIsChatModalOpen(true)}
                className="absolute bottom-6 right-4 bg-indigo-600 px-4 py-3 rounded-full flex-row items-center gap-2 shadow-2xl border border-indigo-400 elevation-5"
                activeOpacity={0.85}
            >
                <Bot size={18} color="#ffffff" />
                <Text className="text-white font-bold text-xs">Case Chatbot</Text>
            </TouchableOpacity>

            {/* ── Chatbot Modal (Full Floating Drawer) ── */}
            <Modal
                visible={isChatModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsChatModalOpen(false)}
            >
                <View className="flex-1 bg-black/75 justify-end">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        className="bg-gray-900 rounded-t-3xl border-t border-gray-800 max-h-[85%] min-h-[500px]"
                    >
                        {/* Modal Header */}
                        <View className="p-4 border-b border-gray-800 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2.5">
                                <View className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700 items-center justify-center">
                                    <Bot size={18} color="#818cf8" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-sm">Adversarial Strategist Chatbot</Text>
                                    <Text className="text-gray-400 text-[10px]">Active context: {charges ? charges.slice(0, 35) + '...' : 'Opponent Case'}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center gap-2">
                                <TouchableOpacity
                                    onPress={handleOpenFullScreenChat}
                                    className="p-1.5 bg-gray-800 rounded-lg border border-gray-700"
                                >
                                    <Maximize2 size={16} color="#9ca3af" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setIsChatModalOpen(false)}
                                    className="p-1.5 bg-gray-800 rounded-lg border border-gray-700"
                                >
                                    <X size={16} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Suggested Quick Questions */}
                        <View className="px-4 py-2 bg-gray-950/80 border-b border-gray-800">
                            <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Suggested Questions:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                                {suggestedChatQuestions.map((q, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => handleSendChatMessage(q)}
                                        className="bg-gray-900 border border-gray-800 rounded-full px-3 py-1 mr-1"
                                        activeOpacity={0.8}
                                    >
                                        <Text className="text-indigo-300 text-[10.5px]">{q}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Messages Area */}
                        <ScrollView ref={chatScrollRef} className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 10 }}>
                            {chatMessages.length === 0 ? (
                                <View className="items-center justify-center py-10">
                                    <Bot size={32} color="#4f46e5" />
                                    <Text className="text-white font-bold text-sm mt-3">Adversarial Decision-Support Chat</Text>
                                    <Text className="text-gray-400 text-xs text-center mt-1 px-6 leading-5">
                                        Ask questions regarding opponent moves, cross-examination lines, statutory defenses, or evidentiary gaps.
                                    </Text>
                                </View>
                            ) : (
                                chatMessages.map((m) => (
                                    <View key={m.id} className={`mb-3.5 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <View className={`max-w-[88%] p-3.5 rounded-2xl ${m.sender === 'user' ? 'bg-indigo-600 rounded-tr-none' : 'bg-gray-950 border border-gray-800 rounded-tl-none'}`}>
                                            {m.sender === 'assistant' && (
                                                <View className="flex-row items-center gap-1 mb-1">
                                                    <Bot size={13} color="#818cf8" />
                                                    <Text className="text-indigo-400 text-[10px] font-bold">Case Strategist</Text>
                                                </View>
                                            )}
                                            <Text className="text-white text-xs leading-relaxed">{m.text}</Text>

                                            {m.sources && m.sources.length > 0 && (
                                                <View className="mt-2.5 pt-2 border-t border-gray-800/80">
                                                    <Text className="text-gray-400 text-[9px] font-bold uppercase mb-1">Cited Precedents & Statutes:</Text>
                                                    <View className="flex-row flex-wrap gap-1">
                                                        {m.sources.map((s, idx) => (
                                                            <View key={idx} className="bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                                                                <Text className="text-indigo-300 text-[9.5px]">{s.title}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))
                            )}

                            {chatLoading && (
                                <View className="items-start mb-3">
                                    <View className="bg-gray-950 border border-gray-800 p-3 rounded-2xl rounded-tl-none flex-row items-center gap-2">
                                        <ActivityIndicator size="small" color="#818cf8" />
                                        <Text className="text-gray-400 text-xs">Evaluating case record and precedents...</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {chatError && (
                            <View className="px-4 py-1.5 bg-red-950/40 border-t border-red-900">
                                <Text className="text-red-300 text-[11px]">{chatError}</Text>
                            </View>
                        )}

                        {/* Input Area */}
                        <View className="p-3 bg-gray-950 border-t border-gray-800 flex-row items-center gap-2">
                            <TextInput
                                className="flex-1 bg-gray-900 text-white text-xs px-3 py-2.5 rounded-xl border border-gray-800 max-h-24"
                                placeholder="Ask about defense strategy, evidence, cross-exam..."
                                placeholderTextColor="#4b5563"
                                multiline
                                value={chatInput}
                                onChangeText={setChatInput}
                            />
                            <TouchableOpacity
                                onPress={() => handleSendChatMessage()}
                                disabled={!chatInput.trim() || chatLoading}
                                className={`p-3 rounded-xl ${chatInput.trim() && !chatLoading ? 'bg-indigo-600' : 'bg-gray-800'}`}
                            >
                                <Send size={16} color={chatInput.trim() && !chatLoading ? '#ffffff' : '#6b7280'} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
