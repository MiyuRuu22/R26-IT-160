import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAnalyzerStore } from '../../store/useAnalyzerStore';

const P = {
  ink: '#0e0e0c',
  paper: '#f4f1ea',
  paper2: '#ece8df',
  muted: '#6b685f',
  border: '#e0dbcb',
  accent: '#b8412c',
  white: '#ffffff',
  green: '#14532d',
};

const STAGES = [
  'Validating case information',
  'Reviewing legal issues & statutes',
  'Comparing relevant case precedents',
  'Reviewing evidence gaps & chain of custody',
  'Updating defense insights & risk assessment',
  'Preparing analysis report',
];

export function ReAnalysisLoadingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reAnalyzeDefense, error } = useAnalyzerStore();

  const [currentStage, setCurrentStage] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Stage progression timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

  // Execution effect
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      const details = route.params?.updatedDetails;
      if (!details) {
        if (isMounted) setLocalError('No case details provided.');
        return;
      }

      // Small deliberate delay for UX transition
      await new Promise((res) => setTimeout(res, 1200));

      const success = await reAnalyzeDefense(details);
      if (isMounted) {
        if (success) {
          navigation.replace('DefenseResults');
        } else {
          setLocalError(error || 'Re-analysis failed. Please check AI Engine connectivity.');
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: P.paper }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {/* Emblem */}
        <Animated.View
          style={{
            opacity: pulseAnim,
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: P.ink,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          <Text style={{ fontSize: 30, color: P.paper }}>⚖</Text>
        </Animated.View>

        {/* Title */}
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 22,
            color: P.ink,
            letterSpacing: -0.3,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          Re-analyzing Case
        </Text>

        <Text
          style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 12,
            color: P.muted,
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          Reviewing the updated case information...
        </Text>

        {/* Stages Checklist */}
        <View
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: P.white,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: P.border,
            padding: 16,
            marginBottom: 24,
          }}
        >
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 7,
                  borderBottomWidth: idx < STAGES.length - 1 ? 1 : 0,
                  borderBottomColor: P.paper2,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: isCompleted ? '#f0fdf4' : isCurrent ? P.ink : P.paper2,
                    borderWidth: 1,
                    borderColor: isCompleted ? '#86efac' : isCurrent ? P.ink : P.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  {isCompleted ? (
                    <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10, color: P.green }}>✓</Text>
                  ) : isCurrent ? (
                    <ActivityIndicator size={10} color={P.paper} />
                  ) : (
                    <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: P.muted }}>
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: isCurrent ? 'InterTight_600SemiBold' : 'InterTight_400Regular',
                    fontSize: 11,
                    color: isCompleted ? P.green : isCurrent ? P.ink : P.muted,
                    flex: 1,
                  }}
                >
                  {stage}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Error Fallback */}
        {localError ? (
          <View
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: '#fff3f0',
              borderWidth: 1,
              borderColor: '#f87171',
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: '#9a2a1f', marginBottom: 4 }}>
              Analysis Interrupted
            </Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 10.5, color: '#9a2a1f', textAlign: 'center', marginBottom: 12 }}>
              {localError}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: P.ink,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.paper }}>
                ← Return to Edit Details
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text
          style={{
            fontFamily: 'InterTight_400Regular',
            fontSize: 9.5,
            color: P.muted,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Decision-support LegalTech engine · Evaluating updated context
        </Text>
      </View>
    </SafeAreaView>
  );
}
