import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Scale, BrainCircuit, ShieldCheck, Zap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LandingScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <ScrollView className="flex-1 bg-paper">
        {/* Header */}
        <View className="px-4 py-4 flex-row justify-between items-center border-b border-[#e8e3d6] bg-white">
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, letterSpacing: -0.01 * 20 }} className="text-ink">Lex.</Text>
          <Button 
            label="Sign In" 
            variant="secondary" 
            onPress={() => navigation.navigate('Login')} 
            className="py-1 px-4 h-auto"
            textClassName="text-sm"
          />
        </View>

        {/* Hero Section */}
        <View className="px-6 py-16 items-center">
          <View className="bg-paper2 px-4 py-1.5 rounded-full border border-ink mb-6">
            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase' }} className="text-ink">
              Next-Gen LegalTech AI
            </Text>
          </View>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 42, letterSpacing: -0.02 * 42, lineHeight: 42 * 1.1, textAlign: 'center' }} className="text-ink mb-4">
            Win Cases with{'\n'}
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', color: '#b8412c' }}>AI Precision</Text>
          </Text>
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 14, lineHeight: 14 * 1.5, textAlign: 'center' }} className="text-muted mb-10 px-2">
            The ultimate AI-assisted ecosystem for modern lawyers. Analyze case defenses, detect hidden relationships, and draft documents in seconds.
          </Text>
          <Button 
            label="Request Early Access  →" 
            onPress={() => navigation.navigate('Register')} 
            className="w-full md:w-auto px-6 h-[48px]"
          />
        </View>

        {/* Footer */}
        <View className="p-6 bg-white border-t border-[#e8e3d6] items-center">
          <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11 }} className="text-muted">© 2026 Lex Legal Companion. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
