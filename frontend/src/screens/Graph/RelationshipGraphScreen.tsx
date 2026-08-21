import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';

export function RelationshipGraphScreen({ navigation }: any) {
  const { graphData, isLoading, fetchGraph } = useAppStore();
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchGraph();
  }, []);

  const loading = isLoading.graph || !graphData;

  if (showDetail) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="px-4 pt-3 pb-3 border-b border-[#e8e3d6] flex-row justify-between items-center bg-white">
          <TouchableOpacity onPress={() => setShowDetail(false)} className="w-8 h-8 rounded-full border border-ink items-center justify-center">
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, letterSpacing: -0.01 * 16 }} className="text-ink">Conflict Detail</Text>
          <TouchableOpacity className="w-8 h-8 rounded-full bg-paper2 items-center justify-center border border-ink">
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12 }}>⋯</Text>
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-4 py-4">
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, letterSpacing: 0.18 * 9, color: '#9a2a1f', textTransform: 'uppercase' }}>
            Conflict · Severity High
          </Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, letterSpacing: -0.02 * 22, lineHeight: 22 * 1.1, marginTop: 4 }} className="text-ink">
            Indirect tie{'\n'}
            to <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', color: '#b8412c' }}>opposing party.</Text>
          </Text>

          <Card className="border-l-[3px] border-l-[#9a2a1f] mt-6 p-3">
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9.5, letterSpacing: 0.5, color: '#6b685f' }} className="mb-2 uppercase">Path · 3 Hops</Text>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 11.5, lineHeight: 11.5 * 1.7 }} className="text-ink">
              You → Mr. A. Silva (client){'\n'}
              <Text className="text-transparent">You </Text>→ Galle Holdings (Director){'\n'}
              <Text className="text-transparent">You   </Text>→ <Text style={{ color: '#9a2a1f' }}>Opposing Party</Text> (Subsidiary)
            </Text>
          </Card>

          <Card className="p-3 mb-6">
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9.5, letterSpacing: 0.5, color: '#6b685f' }} className="mb-2 uppercase">Source of Evidence</Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, lineHeight: 10.5 * 1.55 }} className="text-ink">
              Discovered via corporate registry filings (RoC dataset, Apr 2024) and Mr. Silva's directorship disclosure.
            </Text>
          </Card>

          <View className="border border-[#e0dbcb] bg-white p-3 mb-6">
            <View className="flex-row items-center mb-2">
              <View className="bg-ink px-2 py-0.5 rounded-[4px] mr-2">
                <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, color: '#f4f1ea' }}>HITL</Text>
              </View>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14 }} className="text-ink">Action required</Text>
            </View>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, lineHeight: 11 * 1.5 }} className="text-muted mb-4">
              This is an algorithmic detection. You must verify and decide. Acknowledging the conflict is mandatory before proceeding with this case.
            </Text>
            <TouchableOpacity className="bg-ink py-2.5 items-center rounded-[4px] mb-2" onPress={() => setShowDetail(false)}>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: '#f4f1ea' }}>Acknowledge & disclose</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-transparent border border-ink py-2.5 items-center rounded-[4px] mb-2">
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12 }} className="text-ink">Mark false positive</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#9a2a1f] border border-[#9a2a1f] py-2.5 items-center rounded-[4px]">
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12, color: '#f4f1ea' }}>Recuse from case</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="px-4 pt-3 pb-3 border-b border-[#e8e3d6] flex-row justify-between items-center bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 rounded-full border border-ink items-center justify-center">
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, letterSpacing: -0.01 * 16 }} className="text-ink">Connections</Text>
        <TouchableOpacity className="w-8 h-8 rounded-full bg-paper2 items-center justify-center border border-ink">
          <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12 }}>⊞</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 bg-paper px-4 py-4">
        {loading ? (
          <Skeleton height={200} className="mb-4" />
        ) : (
          <>
            <View className="bg-[#fff3f0] border border-[#9a2a1f] p-3 mb-4 flex-row items-center rounded-[4px]">
              <View className="w-6 h-6 rounded-full bg-[#9a2a1f] items-center justify-center mr-3">
                <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 12, color: 'white' }}>!</Text>
              </View>
              <View>
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 12 }} className="text-[#9a2a1f]">2 conflicts detected</Text>
                <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10 }} className="text-[#9a2a1f]">Indirect ties to opposing party</Text>
              </View>
            </View>

            <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 9, letterSpacing: 0.15 * 9, color: '#6b685f', textTransform: 'uppercase', marginBottom: 6 }}>
              Network · 12 entities
            </Text>

            <View className="bg-white border border-[#d6d0bf] rounded-[4px] h-[220px] mb-2 relative overflow-hidden">
              {/* Central Client Node */}
              <View className="absolute bg-ink border-2 border-white rounded-full w-10 h-10 items-center justify-center z-20" style={{ left: 140, top: 90 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: '#f4f1ea' }}>YOU</Text>
              </View>
              {/* Nodes */}
              <View className="absolute bg-paper border border-ink rounded-full w-8 h-8 items-center justify-center z-10" style={{ left: 60, top: 40 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 7, color: '#0e0e0c' }}>CL1</Text>
              </View>
              <View className="absolute bg-paper border border-ink rounded-full w-8 h-8 items-center justify-center z-10" style={{ left: 220, top: 40 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 7, color: '#0e0e0c' }}>CL2</Text>
              </View>
              <View className="absolute bg-[#fffcef] border border-[#c5681e] rounded-full w-8 h-8 items-center justify-center z-10" style={{ left: 60, top: 150 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 7, color: '#c5681e' }}>FIRM</Text>
              </View>
              <View className="absolute bg-[#fff3f0] border border-[#9a2a1f] rounded-full w-8 h-8 items-center justify-center z-10" style={{ left: 230, top: 155 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 7, color: '#9a2a1f' }}>OPP</Text>
              </View>
              
              {/* Conceptual edges rendered as lines using View transforms */}
              <View className="absolute bg-ink/30 h-[1px] w-[80px]" style={{ left: 80, top: 75, transform: [{ rotate: '-35deg' }] }} />
              <View className="absolute bg-ink/30 h-[1px] w-[80px]" style={{ left: 160, top: 75, transform: [{ rotate: '35deg' }] }} />
              <View className="absolute bg-ink/30 h-[1px] w-[80px]" style={{ left: 80, top: 130, transform: [{ rotate: '35deg' }] }} />
              <View className="absolute bg-[#9a2a1f] h-[2px] w-[90px]" style={{ left: 160, top: 135, transform: [{ rotate: '-25deg' }] }} />
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 0.05 * 9, color: '#6b685f', textTransform: 'uppercase' }}>
                ● Direct  ─── Indirect  ━━ Conflict
              </Text>
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10, color: '#b8412c' }}>Expand ⤢</Text>
            </View>

            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 14, letterSpacing: -0.01 * 14 }} className="text-ink mb-2">Detected Links</Text>
            
            <TouchableOpacity onPress={() => setShowDetail(true)}>
              <Card className="flex-row items-center border-[#9a2a1f] p-3 mb-2">
                <View className="w-8 h-8 rounded-full bg-[#9a2a1f] items-center justify-center mr-3">
                  <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: 'white' }}>!</Text>
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11 }} className="text-ink">Galle Holdings → Opposing Party</Text>
                  <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10 }} className="text-muted mt-0.5">Through Mr. Silva (your client)</Text>
                </View>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 11 }} className="text-[#9a2a1f]">2°</Text>
              </Card>
            </TouchableOpacity>

            <Card className="flex-row items-center p-3">
              <View className="w-8 h-8 rounded-full bg-paper2 border border-ink items-center justify-center mr-3">
                <Text style={{ fontFamily: 'Fraunces_600SemiBold_Italic', fontSize: 14 }} className="text-ink">P</Text>
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11 }} className="text-ink">Mrs. Dias → Past co-defendant</Text>
                <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10 }} className="text-muted mt-0.5">2018 commercial dispute</Text>
              </View>
              <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 11 }} className="text-ink">3°</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
