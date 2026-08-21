import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scale, ShieldAlert, Crosshair, FileWarning, Search, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useOpponentStore } from '../store/useOpponentStore';

const CollapsibleSection = ({ title, icon: Icon, children }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <View className="mb-4 bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <TouchableOpacity 
                onPress={() => setIsOpen(!isOpen)}
                className="flex-row items-center justify-between p-4"
            >
                <View className="flex-row items-center gap-3">
                    <Icon size={20} color="#9ca3af" />
                    <Text className="text-white font-medium">{title}</Text>
                </View>
                {isOpen ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
            </TouchableOpacity>
            {isOpen && (
                <View className="p-4 pt-0 border-t border-gray-700/50">
                    {children}
                </View>
            )}
        </View>
    );
};

export default function OpponentPredictionScreen() {
    const { 
        defenseArguments, charges, hearingNotes, witnessSummaries, evidenceSummaries,
        setField, runAnalysis, analysis, predictions, risk, isLoading, error
    } = useOpponentStore();

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Fraunces_700Bold' }}>
                        Opponent Prediction
                    </Text>
                    <Text className="text-gray-400">Anticipate prosecution strategies and identify defense vulnerabilities before the hearing.</Text>
                </View>

                {error && (
                    <View className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
                        <Text className="text-red-400">{error}</Text>
                    </View>
                )}

                {!analysis ? (
                    <View className="gap-4 mb-8">
                        <View>
                            <Text className="text-gray-300 mb-2 font-medium">Charges (Required)</Text>
                            <TextInput
                                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-white"
                                placeholder="e.g. Drug Trafficking under Section..."
                                placeholderTextColor="#4b5563"
                                value={charges}
                                onChangeText={(val) => setField('charges', val)}
                            />
                        </View>
                        <View>
                            <Text className="text-gray-300 mb-2 font-medium">Defense Arguments (Required)</Text>
                            <TextInput
                                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-white h-32"
                                placeholder="Enter main arguments, alibis, or claims..."
                                placeholderTextColor="#4b5563"
                                multiline
                                textAlignVertical="top"
                                value={defenseArguments}
                                onChangeText={(val) => setField('defenseArguments', val)}
                            />
                        </View>
                        
                        <CollapsibleSection title="Hearing Notes & Context" icon={Scale}>
                            <TextInput
                                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-white h-24"
                                placeholder="Notes from previous hearings..."
                                placeholderTextColor="#4b5563"
                                multiline
                                textAlignVertical="top"
                                value={hearingNotes}
                                onChangeText={(val) => setField('hearingNotes', val)}
                            />
                        </CollapsibleSection>

                        <CollapsibleSection title="Evidence & Witnesses" icon={Search}>
                            <TextInput
                                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-white h-20 mb-3"
                                placeholder="Evidence summaries..."
                                placeholderTextColor="#4b5563"
                                multiline
                                textAlignVertical="top"
                                value={evidenceSummaries}
                                onChangeText={(val) => setField('evidenceSummaries', val)}
                            />
                            <TextInput
                                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-white h-20"
                                placeholder="Witness summaries..."
                                placeholderTextColor="#4b5563"
                                multiline
                                textAlignVertical="top"
                                value={witnessSummaries}
                                onChangeText={(val) => setField('witnessSummaries', val)}
                            />
                        </CollapsibleSection>

                        <TouchableOpacity 
                            className={`py-4 rounded-xl items-center mt-4 ${isLoading ? 'bg-indigo-600/50' : 'bg-indigo-600'}`}
                            onPress={runAnalysis}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Generate Predictions</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="gap-6">
                        {risk && (
                            <View className={`p-5 rounded-2xl border ${risk.riskLevel === 'HIGH' ? 'bg-red-900/20 border-red-500/50' : risk.riskLevel === 'MEDIUM' ? 'bg-orange-900/20 border-orange-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
                                <View className="flex-row items-center gap-3 mb-2">
                                    <ShieldAlert size={24} color={risk.riskLevel === 'HIGH' ? '#ef4444' : '#10b981'} />
                                    <Text className="text-xl font-bold text-white">Risk Level: {risk.riskLevel}</Text>
                                </View>
                                <Text className="text-gray-300 leading-relaxed">{risk.vulnerabilityAnalysis}</Text>
                            </View>
                        )}

                        <View className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                            <View className="flex-row items-center gap-3 mb-4">
                                <Crosshair size={20} color="#a78bfa" />
                                <Text className="text-lg font-bold text-white">Likely Opponent Arguments</Text>
                            </View>
                            {predictions?.likelyOpponentArguments.map((arg, idx) => (
                                <View key={idx} className="bg-gray-800/50 p-3 rounded-lg mb-2 border border-gray-700/50">
                                    <Text className="text-gray-200">{arg}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                            <View className="flex-row items-center gap-3 mb-4">
                                <FileWarning size={20} color="#fbbf24" />
                                <Text className="text-lg font-bold text-white">Detected Weaknesses</Text>
                            </View>
                            {analysis?.weaknesses.map((w, idx) => (
                                <View key={idx} className="flex-row gap-3 mb-3">
                                    <View className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                                    <Text className="text-gray-300 flex-1">{w.reason} <Text className="text-gray-500 italic">({w.pattern})</Text></Text>
                                </View>
                            ))}
                            {analysis?.missingEvidence.map((ev, idx) => (
                                <View key={`ev-${idx}`} className="flex-row gap-3 mb-3">
                                    <View className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                                    <Text className="text-red-300 flex-1">{ev}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity 
                            className="py-4 border border-gray-700 rounded-xl items-center mt-4 bg-gray-900"
                            onPress={() => useOpponentStore.getState().reset()}
                        >
                            <Text className="text-gray-300 font-medium">Reset Analysis</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
