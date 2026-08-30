import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Scale, Shield, ArrowRight, Sparkles, FileText, Crosshair, Bot, AlertTriangle } from 'lucide-react-native';

const PALETTE = {
  ink: '#0e0e0c',
  paper: '#f4f1ea',
  paper2: '#ece8df',
  muted: '#6b685f',
  border: '#e0dbcb',
  accent: '#b8412c',
  white: '#ffffff',
  indigo: '#4f46e5',
  indigoDark: '#1e1b4b',
};

export function DefenderLandingScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.paper }} edges={['top']}>
      {/* ── Top App Bar ── */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: PALETTE.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={16} color={PALETTE.paper} />
          </View>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: PALETTE.ink }}>
            Defender
          </Text>
        </View>

        <View style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: PALETTE.paper2,
          borderWidth: 1,
          borderColor: PALETTE.border,
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_600SemiBold',
            fontSize: 9.5,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: PALETTE.ink,
          }}>
            Defense Suite
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Title & Subtitle ── */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 26,
            letterSpacing: -0.6,
            lineHeight: 32,
            color: PALETTE.ink,
          }}>
            Defense Preparation{'\n'}
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', color: PALETTE.accent }}>
              & Adversarial Strategy
            </Text>
          </Text>
          <Text style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 12,
            lineHeight: 18,
            color: PALETTE.muted,
            marginTop: 6,
          }}>
            Access two specialized defense workflows: analyze police B-Reports for weak wording and missing evidence, or anticipate prosecutorial arguments and prepare cross-examination.
          </Text>
        </View>

        {/* ── CARD 1: Defense Analyzer ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate('AnalyzerForm')}
          activeOpacity={0.88}
          style={{
            backgroundColor: PALETTE.white,
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: PALETTE.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: PALETTE.paper2,
                borderWidth: 1,
                borderColor: PALETTE.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Scale size={22} color={PALETTE.ink} />
              </View>
              <View>
                <Text style={{
                  fontFamily: 'Fraunces_600SemiBold',
                  fontSize: 17,
                  color: PALETTE.ink,
                }}>
                  Defense Analyzer
                </Text>
                <Text style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 9.5,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: PALETTE.muted,
                  marginTop: 2,
                }}>
                  B-Report & Evidence Analysis
                </Text>
              </View>
            </View>
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: PALETTE.paper2,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ArrowRight size={14} color={PALETTE.ink} />
            </View>
          </View>

          <Text style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 12,
            lineHeight: 18,
            color: PALETTE.ink,
            marginBottom: 14,
          }}>
            Analyze police B-reports, detect weak wording, missing physical evidence, and contradictions. Retrieve matching judicial precedents to build your primary defense theory.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {['B-Report Analysis', 'Red Flags', 'Precedent Search', 'Missing Evidence'].map((tag) => (
              <View key={tag} style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: PALETTE.paper2,
                borderWidth: 1,
                borderColor: PALETTE.border,
              }}>
                <Text style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 9,
                  color: PALETTE.muted,
                }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: PALETTE.ink,
            gap: 6,
          }}>
            <Text style={{
              fontFamily: 'InterTight_600SemiBold',
              fontSize: 12,
              color: PALETTE.paper,
            }}>
              Launch Defense Analyzer
            </Text>
            <ArrowRight size={14} color={PALETTE.paper} />
          </View>
        </TouchableOpacity>

        {/* ── CARD 2: Opponent Prediction / Adversarial Analysis ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate('OpponentPrediction')}
          activeOpacity={0.88}
          style={{
            backgroundColor: '#0c0f17',
            borderRadius: 16,
            padding: 18,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#1e293b',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#1e1b4b',
                borderWidth: 1,
                borderColor: '#4338ca',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Shield size={22} color="#a5b4fc" />
              </View>
              <View>
                <Text style={{
                  fontFamily: 'Fraunces_600SemiBold',
                  fontSize: 17,
                  color: '#ffffff',
                }}>
                  Opponent Prediction
                </Text>
                <Text style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 9.5,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  marginTop: 2,
                }}>
                  Adversarial Strategy & Chatbot
                </Text>
              </View>
            </View>
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#1e293b',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ArrowRight size={14} color="#a5b4fc" />
            </View>
          </View>

          <Text style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 12,
            lineHeight: 18,
            color: '#cbd5e1',
            marginBottom: 14,
          }}>
            Evidence-aware 14-section adversarial reasoning anticipating prosecution theories, attacks on defense arguments, chain of custody gaps, and police witness cross-examination.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {['14-Section Analysis', 'Prosecution Theories', 'Cross-Exam Targets', 'Case Chatbot'].map((tag) => (
              <View key={tag} style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: '#1e1b4b',
                borderWidth: 1,
                borderColor: '#3730a3',
              }}>
                <Text style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 9,
                  color: '#c7d2fe',
                }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: '#4f46e5',
            gap: 6,
          }}>
            <Text style={{
              fontFamily: 'InterTight_600SemiBold',
              fontSize: 12,
              color: '#ffffff',
            }}>
              Launch Opponent Predictor
            </Text>
            <ArrowRight size={14} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* ── Workflow Guide ── */}
        <View style={{
          backgroundColor: PALETTE.white,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: PALETTE.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={14} color={PALETTE.accent} />
            <Text style={{
              fontFamily: 'InterTight_600SemiBold',
              fontSize: 11,
              color: PALETTE.ink,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Seamless Defense Workflow
            </Text>
          </View>
          <Text style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 11,
            lineHeight: 16,
            color: PALETTE.muted,
          }}>
            Start by analyzing case facts in Defense Analyzer. Once completed, tap "Import from Analyzer" in Opponent Prediction to instantly carry all details into your 14-section adversarial strategy session.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
