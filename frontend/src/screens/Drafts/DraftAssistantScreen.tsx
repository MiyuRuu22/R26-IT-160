import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Card } from '../../components/ui/Card';
import { SafeAreaView } from 'react-native-safe-area-context';

export function DraftAssistantScreen({ navigation }: any) {
  const [content, setContent] = useState('The Plaintiff states that the Defendant did, on or about 14 March 2024, occupy the said premises...\n\nPursuant to § 4 of the Prescription Ordinance, the Plaintiff claims...\n\nFurthermore, the Defendant has failed to ');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { draftSuggestion, generateDraft, isLoading } = useAppStore();

  const handleFetchDraft = async (text: string) => {
    setContent(text);
    if (text.endsWith(' ')) {
      await generateDraft(text);
      setShowSuggestions(true);
    }
  };

  const simulateAiTyping = () => {
    if (draftSuggestion) {
      setContent(content + draftSuggestion + ' ');
      setShowSuggestions(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="px-4 pt-3 pb-3 border-b border-[#e8e3d6] flex-row justify-between items-center bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 rounded-full border border-ink items-center justify-center">
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, letterSpacing: -0.01 * 16 }} className="text-ink">Plaint · Silva v. GMC</Text>
        <TouchableOpacity className="w-8 h-8 rounded-full bg-paper2 items-center justify-center border border-ink">
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-4 py-4"
      >
        <View className="flex-1 bg-white border border-[#d6d0bf] rounded-[4px] overflow-hidden flex-col">
          <View className="flex-row items-center gap-4 px-4 py-2 border-b border-[#e8e3d6] bg-paper2">
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 13 }}>B</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold_Italic', fontSize: 13 }}>I</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, textDecorationLine: 'underline' }}>U</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13 }}>"</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13 }}>§</Text>
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13 }}>↺</Text>
          </View>

          <View className="px-4 py-4 border-b border-dashed border-[#e8e3d6]">
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20 }} className="text-ink">Plaint</Text>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' }} className="text-muted mt-1">
              D.C. Galle · Saved 12s ago
            </Text>
          </View>

          <TextInput
            className="flex-1 p-4 text-ink"
            style={{ fontFamily: 'InterTight_400Regular', fontSize: 13, lineHeight: 13 * 1.6 }}
            multiline
            placeholder="Start drafting..."
            placeholderTextColor="#94a3b8"
            textAlignVertical="top"
            value={content}
            onChangeText={handleFetchDraft}
          />
          
          {showSuggestions && (
            <View className="bg-paper border-t border-ink p-3 rounded-b-[4px]">
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' }} className="text-ink">
                  Suggestions · 1
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9.5, color: '#b8412c' }}>
                  AI · 91%
                </Text>
              </View>

              <Card className="mb-0 border-ink shadow-none">
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 0.5, color: '#6b685f', textTransform: 'uppercase' }} className="mb-1.5">
                  Statute · Civil Procedure
                </Text>
                <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 12.5, lineHeight: 12.5 * 1.5, color: '#0e0e0c' }}>
                  "…{isLoading.draft ? "Thinking..." : draftSuggestion || 'provide adequate compensation as prescribed under § 7'}…"
                </Text>
                <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-[#e8e3d6]">
                  <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 9.5 }} className="text-muted">Tap to insert</Text>
                  <TouchableOpacity onPress={simulateAiTyping}>
                    <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, color: '#b8412c', letterSpacing: 0.5 }}>+ INSERT</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
