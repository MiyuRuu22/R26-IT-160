import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../components/ui/Card';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/useAuthStore';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const { dashboardData, isLoading, fetchDashboard } = useAppStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const loading = isLoading.dashboard || !dashboardData;

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="px-4 pt-3 pb-3 border-b border-[#e8e3d6] flex-row justify-between items-center bg-white">
        <TouchableOpacity className="w-8 h-8 rounded-full bg-paper2 items-center justify-center border border-ink">
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14 }}>☰</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, letterSpacing: -0.01 * 16 }} className="text-ink">Lex.</Text>
        <TouchableOpacity onPress={logout} className="w-8 h-8 rounded-full bg-paper2 items-center justify-center border border-ink">
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12 }}>⌖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 bg-paper px-4 py-4">
        <View className="mb-4">
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, letterSpacing: -0.02 * 24, lineHeight: 24 * 1.1 }} className="text-ink">
            Good morning,{'\n'}
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', color: '#b8412c' }}>
              {user?.displayName ? `Mr. ${user.displayName.split(' ').pop()}` : 'Counsel'}
            </Text>
          </Text>
          <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 0.15 * 10, textTransform: 'uppercase' }} className="text-muted mt-1.5">
            {dateStr} · 3 hearings today
          </Text>
        </View>

        <View className="flex-row border border-ink bg-white mt-2 mb-4">
          <View className="flex-1 border-r border-ink p-2 items-center justify-center">
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22 }} className="text-ink">
              {loading ? '-' : dashboardData.activeCases}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, letterSpacing: 0.1 * 8.5, textTransform: 'uppercase' }} className="text-muted mt-0.5">
              Active
            </Text>
          </View>
          <View className="flex-1 border-r border-ink p-2 items-center justify-center">
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22 }} className="text-ink">
              {loading ? '-' : dashboardData.riskAlerts}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, letterSpacing: 0.1 * 8.5, textTransform: 'uppercase' }} className="text-muted mt-0.5">
              Urgent
            </Text>
          </View>
          <View className="flex-1 p-2 items-center justify-center">
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22 }} className="text-ink">
              {loading ? '-' : dashboardData.draftsCreated}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, letterSpacing: 0.1 * 8.5, textTransform: 'uppercase' }} className="text-muted mt-0.5">
              Drafts
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-baseline mt-4 mb-2">
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 14, letterSpacing: -0.01 * 14 }} className="text-ink">Modules</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Risk')}>
          <Card className="flex-row items-center p-3 mb-2 rounded-none border border-[#e0dbcb] bg-white">
            <View className="w-10 h-10 bg-paper2 border border-ink items-center justify-center mr-3">
              <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 18 }} className="text-ink">i</Text>
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, letterSpacing: -0.01 * 12 }} className="text-ink">Client Verification</Text>
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, lineHeight: 10 * 1.3 }} className="text-muted mt-0.5">Risk-screen new intake</Text>
            </View>
            <Text className="text-ink text-lg">→</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Drafts')}>
          <Card className="flex-row items-center p-3 mb-2 rounded-none border border-[#e0dbcb] bg-white">
            <View className="w-10 h-10 bg-paper2 border border-ink items-center justify-center mr-3">
              <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 18 }} className="text-ink">ii</Text>
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, letterSpacing: -0.01 * 12 }} className="text-ink">Drafting Assistant</Text>
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, lineHeight: 10 * 1.3 }} className="text-muted mt-0.5">3 drafts in progress</Text>
            </View>
            <Text className="text-ink text-lg">→</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Defender', { screen: 'AnalyzerForm' })}>
          <Card className="flex-row items-center p-3 mb-2 rounded-none border border-[#e0dbcb] bg-white">
            <View className="w-10 h-10 bg-paper2 border border-ink items-center justify-center mr-3">
              <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 18 }} className="text-ink">iii</Text>
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, letterSpacing: -0.01 * 12 }} className="text-ink">Defense Analyzer</Text>
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10, lineHeight: 10 * 1.3 }} className="text-muted mt-0.5">Find similar cases</Text>
            </View>
            <Text className="text-ink text-lg">→</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Graph')}>
          <Card className="flex-row items-center p-3 mb-8 rounded-none border border-[#e0dbcb] bg-white">
            <View className="w-10 h-10 bg-paper2 border border-ink items-center justify-center mr-3">
              <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 18 }} className="text-ink">iv</Text>
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, letterSpacing: -0.01 * 12 }} className="text-ink">Connections Map</Text>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10, lineHeight: 10 * 1.3 }} className="text-danger mt-0.5">2 alerts pending</Text>
            </View>
            <Text className="text-ink text-lg">→</Text>
          </Card>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
