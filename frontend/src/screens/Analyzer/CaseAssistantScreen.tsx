import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAnalyzerStore } from '../../store/useAnalyzerStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ChatMessage,
  ChatSourceReference,
  sendCaseAssistantMessage,
  fetchCaseConversationHistory,
  compileCaseContextSnapshot,
} from '../../services/caseAssistantService';

const P = {
  ink: '#0e0e0c',
  paper: '#f4f1ea',
  paper2: '#ece8df',
  muted: '#6b685f',
  border: '#e0dbcb',
  accent: '#b8412c',
  white: '#ffffff',
};

export function CaseAssistantScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const analyzerStore = useAnalyzerStore();
  const { user } = useAuthStore();

  const caseContextSnapshot = compileCaseContextSnapshot(analyzerStore);
  const routeCaseId = route.params?.caseId || caseContextSnapshot.caseId || 'active-case';
  const routeCaseTitle = route.params?.caseTitle || caseContextSnapshot.caseTitle || 'Current Case';

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<ChatSourceReference | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Pulsing animation for loading state
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0.4);
    }
  }, [isLoading]);

  // Load existing conversation on mount
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const history = await fetchCaseConversationHistory(routeCaseId, user?.token, user?._id);
        if (isMounted && history.messages.length > 0) {
          setConversationId(history.conversationId);
          setMessages(history.messages);
        }
      } catch (err) {
        console.warn('[CaseAssistant] History load warning:', err);
      }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, [routeCaseId, user]);

  // Scroll to bottom when messages update
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Dynamic suggested questions based on real case data
  const suggestedQuestions = getSuggestedQuestions(caseContextSnapshot);

  const handleSendMessage = async (textToSend?: string, isRetry = false) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setErrorMessage(null);

    let updatedHistory = messages;
    if (!isRetry) {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      updatedHistory = [...messages, userMessage];
      setMessages(updatedHistory);
    }
    setIsLoading(true);

    try {
      const response = await sendCaseAssistantMessage({
        caseId: routeCaseId,
        message: text,
        conversationId: conversationId || undefined,
        conversationHistory: updatedHistory,
        caseContext: caseContextSnapshot,
        token: user?.token,
        userId: user?._id,
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: response.message.id || `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: response.message.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources || [],
        disclaimer: response.disclaimer,
        status: 'sent',
      };

      setMessages([...updatedHistory, assistantMessage]);
    } catch (err: any) {
      console.error('[CaseAssistant Error]:', err.message);
      setErrorMessage(err.message || 'Unable to connect to Case Assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.text, true);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: P.paper }} edges={['top', 'bottom']}>
      {/* ── Screen Header ── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: P.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: P.white,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
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
            }}
          >
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: P.ink }}>←</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 15, color: P.ink }}>
              Case Assistant
            </Text>
            <Text
              style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 8.5, color: P.muted }}
              numberOfLines={1}
            >
              Case: {routeCaseTitle} {routeCaseId ? `(${routeCaseId})` : ''}
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: P.paper2,
            borderWidth: 1,
            borderColor: P.border,
          }}
        >
          <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8, color: P.muted }}>
            DECISION-SUPPORT
          </Text>
        </View>
      </View>

      {/* ── Main Chat Area ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Empty State */}
          {messages.length === 0 && (
            <View style={{ paddingVertical: 14 }}>
              <View
                style={{
                  backgroundColor: P.white,
                  borderWidth: 1,
                  borderColor: P.border,
                  borderRadius: 6,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 16 }}>⚖</Text>
                  <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: P.ink }}>
                    Case Assistant
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: 'InterTight_400Regular',
                    fontSize: 11.5,
                    color: P.muted,
                    lineHeight: 17,
                  }}
                >
                  Ask questions about this case analysis, defense strategies, predicted opponent arguments, evidence gaps, similar precedents, and applicable statutory provisions.
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: 'JetBrainsMono_600SemiBold',
                  fontSize: 8.5,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: P.muted,
                  marginBottom: 10,
                }}
              >
                Suggested Questions
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {suggestedQuestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSendMessage(q)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: P.white,
                      borderWidth: 1,
                      borderColor: P.border,
                      borderRadius: 20,
                      paddingHorizontal: 13,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'InterTight_500Medium',
                        fontSize: 11,
                        color: P.ink,
                      }}
                    >
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Messages List */}
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <View
                key={m.id}
                style={{
                  marginBottom: 14,
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <View
                  style={{
                    maxWidth: '86%',
                    backgroundColor: isUser ? P.ink : P.white,
                    borderWidth: 1,
                    borderColor: isUser ? P.ink : P.border,
                    borderRadius: 8,
                    borderTopRightRadius: isUser ? 1 : 8,
                    borderTopLeftRadius: !isUser ? 1 : 8,
                    padding: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {/* Sender indicator on assistant messages */}
                  {!isUser && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 10.5, color: P.ink }}>
                        Case Assistant
                      </Text>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fb923c' }} />
                    </View>
                  )}

                  {/* Message Body */}
                  <Text
                    style={{
                      fontFamily: 'InterTight_400Regular',
                      fontSize: 11.5,
                      lineHeight: 18,
                      color: isUser ? P.paper : P.ink,
                    }}
                  >
                    {m.text}
                  </Text>

                  {/* Source Reference Chips (if present) */}
                  {m.sources && m.sources.length > 0 && (
                    <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: P.border }}>
                      <Text
                        style={{
                          fontFamily: 'JetBrainsMono_600SemiBold',
                          fontSize: 7.5,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          color: P.muted,
                          marginBottom: 6,
                        }}
                      >
                        Cited References & Precedents
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {m.sources.map((src, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setSelectedSource(src)}
                            activeOpacity={0.8}
                            style={{
                              backgroundColor: P.paper2,
                              borderWidth: 1,
                              borderColor: P.border,
                              borderRadius: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Text style={{ fontSize: 9 }}>
                              {src.type === 'case' ? '⚖' : src.type === 'law' ? '§' : '↳'}
                            </Text>
                            <Text
                              style={{
                                fontFamily: 'InterTight_600SemiBold',
                                fontSize: 9,
                                color: P.ink,
                              }}
                              numberOfLines={1}
                            >
                              {src.title}
                            </Text>
                            {src.similarity && (
                              <View style={{ backgroundColor: '#e2fbe8', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 }}>
                                <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 7, color: '#15803d' }}>
                                  {src.similarity}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Advisory Notice */}
                  {m.disclaimer && !isUser && (
                    <Text
                      style={{
                        fontFamily: 'InterTight_400Regular',
                        fontSize: 8.5,
                        color: P.muted,
                        marginTop: 8,
                        fontStyle: 'italic',
                        lineHeight: 12,
                      }}
                    >
                      {m.disclaimer}
                    </Text>
                  )}
                </View>

                {/* Timestamp */}
                {m.timestamp && (
                  <Text
                    style={{
                      fontFamily: 'JetBrainsMono_500Medium',
                      fontSize: 8,
                      color: P.muted,
                      marginTop: 3,
                      marginHorizontal: 4,
                    }}
                  >
                    {typeof m.timestamp === 'string' ? m.timestamp : new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={{ marginBottom: 14, alignItems: 'flex-start' }}>
              <View
                style={{
                  backgroundColor: P.white,
                  borderWidth: 1,
                  borderColor: P.border,
                  borderRadius: 8,
                  borderTopLeftRadius: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Animated.View style={{ opacity: pulseAnim, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: 'InterTight_500Medium', fontSize: 11, color: P.ink }}>
                    Case Assistant is analysing...
                  </Text>
                  <Text style={{ fontSize: 12, color: '#fb923c' }}>● ● ●</Text>
                </Animated.View>
              </View>
            </View>
          )}

          {/* Error Message & Retry */}
          {errorMessage && (
            <View
              style={{
                backgroundColor: '#fef2f2',
                borderWidth: 1,
                borderColor: '#fca5a5',
                borderRadius: 6,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <Text style={{ fontFamily: 'InterTight_500Medium', fontSize: 11, color: '#991b1b', marginBottom: 6 }}>
                {errorMessage}
              </Text>
              <TouchableOpacity
                onPress={handleRetryLastMessage}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#991b1b',
                  borderRadius: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 10, color: P.white }}>
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* ── Input Bar ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: P.white,
            borderTopWidth: 1,
            borderTopColor: P.border,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about this case, arguments, evidence..."
            placeholderTextColor={P.muted}
            multiline
            maxLength={1000}
            style={{
              flex: 1,
              maxHeight: 90,
              minHeight: 38,
              backgroundColor: P.paper,
              borderWidth: 1,
              borderColor: P.border,
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontFamily: 'InterTight_400Regular',
              fontSize: 12,
              color: P.ink,
            }}
          />

          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
            style={{
              backgroundColor: inputText.trim() && !isLoading ? P.ink : P.paper2,
              borderWidth: 1,
              borderColor: inputText.trim() && !isLoading ? P.ink : P.border,
              borderRadius: 6,
              height: 38,
              paddingHorizontal: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={P.ink} />
            ) : (
              <Text
                style={{
                  fontFamily: 'InterTight_600SemiBold',
                  fontSize: 12,
                  color: inputText.trim() ? P.paper : P.muted,
                }}
              >
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Source Detail Modal ── */}
      <Modal
        visible={!!selectedSource}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSource(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(14,14,12,0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: P.white,
              borderRadius: 8,
              padding: 18,
              borderWidth: 1,
              borderColor: P.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: P.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Source Citation ({selectedSource?.type})
                </Text>
                <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 14, color: P.ink, marginTop: 3 }}>
                  {selectedSource?.title}
                </Text>
              </View>
              {selectedSource?.similarity && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#4ade80' }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 8.5, color: '#15803d' }}>
                    {selectedSource.similarity}
                  </Text>
                </View>
              )}
            </View>

            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, color: P.ink, lineHeight: 16, marginBottom: 14 }}>
              {selectedSource?.relevance || 'Verified reference from current case records and statutory mapping.'}
            </Text>

            <TouchableOpacity
              onPress={() => setSelectedSource(null)}
              style={{
                backgroundColor: P.ink,
                borderRadius: 4,
                paddingVertical: 9,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: P.paper }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Derives intelligent suggested questions according to real available case data
 */
function getSuggestedQuestions(ctx: any): string[] {
  const suggestions: string[] = [];

  if (ctx.similarCases && ctx.similarCases.length > 0) {
    suggestions.push(`Why is this case considered similar to ${ctx.similarCases[0].parties || ctx.similarCases[0].id}?`);
  }

  if (ctx.defenseArguments && ctx.defenseArguments.length > 0) {
    suggestions.push('What are the strongest defense arguments?');
  }

  if (ctx.opponentArguments && ctx.opponentArguments.length > 0) {
    suggestions.push('What is the strongest opponent argument?');
  }

  if (ctx.analysisResults?.missingEvidence && ctx.analysisResults.missingEvidence.length > 0) {
    suggestions.push('What information is missing from this case?');
  } else {
    suggestions.push('Which evidence supports the defense?');
  }

  if (ctx.analysisResults?.weakWording && ctx.analysisResults.weakWording.length > 0) {
    suggestions.push('What are the weaknesses in the current defense?');
  }

  suggestions.push('Summarize the key findings.');

  return suggestions.slice(0, 5);
}
