import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Scale,
  Shield,
  Search,
  X,
  Trash2,
  ArrowRight,
  Clock,
  Filter,
  FolderOpen,
  AlertTriangle,
  Sparkles,
} from 'lucide-react-native';
import { useCaseHistoryStore, CaseHistoryItem } from '../../store/useCaseHistoryStore';

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
  danger: '#dc2626',
};

export function CaseHistoryScreen() {
  const navigation = useNavigation<any>();
  const {
    allCases,
    isLoading,
    error,
    fetchAllCases,
    deleteCase,
    restoreCase,
  } = useCaseHistoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ANALYZER' | 'OPPONENT'>('ALL');
  const [filterCaseType, setFilterCaseType] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllCases();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllCases();
    setRefreshing(false);
  };

  const handleDelete = (item: CaseHistoryItem) => {
    Alert.alert(
      'Delete Case?',
      `Are you sure you want to remove "${item.title}" from your history? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCase(item.caseId);
          },
        },
      ]
    );
  };

  const filteredCases = useMemo(() => {
    return allCases.filter((item) => {
      // Type filter
      if (filterType !== 'ALL' && item.analysisType !== filterType) {
        return false;
      }
      // Case type filter
      if (filterCaseType !== 'ALL' && item.caseType !== filterCaseType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesType = (item.caseType || '').toLowerCase().includes(q);
        const matchesIssue = (item.legalIssue || '').toLowerCase().includes(q);
        const matchesCharges = (item.charges || '').toLowerCase().includes(q);
        const matchesSummary = (item.summary || '').toLowerCase().includes(q);
        return matchesTitle || matchesType || matchesIssue || matchesCharges || matchesSummary;
      }
      return true;
    });
  }, [allCases, filterType, filterCaseType, searchQuery]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.paper }} edges={['top']}>
      {/* ── Top Header ── */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: PALETTE.white,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: PALETTE.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Back to Defender"
          >
            <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: PALETTE.ink }}>←</Text>
          </TouchableOpacity>

          <View>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: PALETTE.ink }}>
              Case History
            </Text>
            <Text style={{
              fontFamily: 'InterTight_400Regular',
              fontSize: 11,
              color: PALETTE.muted,
            }}>
              Your previous defense analysis cases
            </Text>
          </View>
        </View>

        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: PALETTE.paper2,
          borderWidth: 1,
          borderColor: PALETTE.border,
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_500Medium',
            fontSize: 9.5,
            color: PALETTE.ink,
          }}>
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
          </Text>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: PALETTE.white,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: PALETTE.border,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <Search size={16} color={PALETTE.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cases by title, legal issue, charges..."
            placeholderTextColor="#8a8d94"
            style={{
              flex: 1,
              marginLeft: 8,
              fontFamily: 'InterTight_400Regular',
              fontSize: 13,
              color: PALETTE.ink,
              padding: 0,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={PALETTE.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter Chips ── */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[
            { key: 'ALL', label: 'All Cases' },
            { key: 'ANALYZER', label: 'Defense Analyzer' },
            { key: 'OPPONENT', label: 'Opponent Prediction' },
          ].map((tab) => {
            const active = filterType === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilterType(tab.key as any)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: active ? PALETTE.ink : PALETTE.border,
                  backgroundColor: active ? PALETTE.ink : PALETTE.white,
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontFamily: 'InterTight_600SemiBold',
                  fontSize: 11,
                  color: active ? PALETTE.paper : PALETTE.ink,
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={{ width: 1, backgroundColor: PALETTE.border, marginHorizontal: 2 }} />

          {['ALL', 'Criminal', 'Civil', 'Commercial'].map((cType) => {
            const active = filterCaseType === cType;
            return (
              <TouchableOpacity
                key={cType}
                onPress={() => setFilterCaseType(cType)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: active ? PALETTE.accent : PALETTE.border,
                  backgroundColor: active ? '#faebe9' : PALETTE.paper2,
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontFamily: 'InterTight_600SemiBold',
                  fontSize: 10.5,
                  color: active ? PALETTE.accent : PALETTE.muted,
                }}>
                  {cType === 'ALL' ? 'Any Type' : cType}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Case List / States ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading && !refreshing ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={PALETTE.ink} />
            <Text style={{
              fontFamily: 'InterTight_400Regular',
              fontSize: 12,
              color: PALETTE.muted,
              marginTop: 10,
            }}>
              Loading case history...
            </Text>
          </View>
        ) : error ? (
          <View style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#fef2f2',
            borderWidth: 1,
            borderColor: '#fecaca',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <AlertTriangle size={24} color="#dc2626" style={{ marginBottom: 8 }} />
            <Text style={{
              fontFamily: 'InterTight_600SemiBold',
              fontSize: 13,
              color: '#991b1b',
              marginBottom: 4,
            }}>
              Unable to load case history
            </Text>
            <Text style={{
              fontFamily: 'InterTight_400Regular',
              fontSize: 11,
              color: '#b91c1c',
              textAlign: 'center',
              marginBottom: 12,
            }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={fetchAllCases}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: '#dc2626',
              }}
            >
              <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11, color: '#ffffff' }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredCases.length === 0 ? (
          <View style={{
            paddingVertical: 48,
            paddingHorizontal: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: PALETTE.white,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: PALETTE.border,
          }}>
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: PALETTE.paper2,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
              <FolderOpen size={24} color={PALETTE.muted} />
            </View>
            <Text style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 16,
              color: PALETTE.ink,
              marginBottom: 6,
            }}>
              {searchQuery ? 'No matching cases found' : 'No cases analyzed yet'}
            </Text>
            <Text style={{
              fontFamily: 'InterTight_400Regular',
              fontSize: 12,
              color: PALETTE.muted,
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 16,
            }}>
              {searchQuery
                ? `No history items matched "${searchQuery}". Try a different keyword or clear your filters.`
                : 'Cases you analyze using Defense Analyzer or Opponent Prediction will appear here automatically.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => navigation.navigate('AnalyzerForm')}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: PALETTE.ink,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={14} color={PALETTE.paper} />
                <Text style={{
                  fontFamily: 'InterTight_600SemiBold',
                  fontSize: 12,
                  color: PALETTE.paper,
                }}>
                  Start Analysis
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCases.map((item) => {
            const isAnalyzer = item.analysisType === 'ANALYZER';
            const dateStr = item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently';

            return (
              <View
                key={item.caseId}
                style={{
                  backgroundColor: PALETTE.white,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: PALETTE.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                {/* Header row: Badge + Date + Delete */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: isAnalyzer ? '#eef2ff' : '#f5f3ff',
                      borderWidth: 1,
                      borderColor: isAnalyzer ? '#c7d2fe' : '#ddd6fe',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {isAnalyzer ? (
                        <Scale size={11} color="#4338ca" />
                      ) : (
                        <Shield size={11} color="#6d28d9" />
                      )}
                      <Text style={{
                        fontFamily: 'JetBrainsMono_600SemiBold',
                        fontSize: 9,
                        color: isAnalyzer ? '#4338ca' : '#6d28d9',
                        textTransform: 'uppercase',
                      }}>
                        {isAnalyzer ? 'Defense Analyzer' : 'Opponent Prediction'}
                      </Text>
                    </View>

                    <View style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: PALETTE.paper2,
                    }}>
                      <Text style={{
                        fontFamily: 'InterTight_600SemiBold',
                        fontSize: 9.5,
                        color: PALETTE.muted,
                      }}>
                        {item.caseType}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{
                      fontFamily: 'InterTight_400Regular',
                      fontSize: 10.5,
                      color: PALETTE.muted,
                    }}>
                      {dateStr}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={{ padding: 4 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Delete case"
                    >
                      <Trash2 size={15} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Title */}
                <Text style={{
                  fontFamily: 'Fraunces_600SemiBold',
                  fontSize: 16,
                  color: PALETTE.ink,
                  marginBottom: 6,
                }}>
                  {item.title}
                </Text>

                {/* Subtitle / Legal Issue / Charges */}
                {(item.legalIssue || item.charges) && (
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: 'InterTight_400Regular',
                      fontSize: 11.5,
                      lineHeight: 16,
                      color: PALETTE.muted,
                      marginBottom: 12,
                    }}
                  >
                    {item.legalIssue || item.charges}
                  </Text>
                )}

                {/* Action Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#f1ede4',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} color={PALETTE.muted} />
                    <Text style={{
                      fontFamily: 'JetBrainsMono_500Medium',
                      fontSize: 9.5,
                      color: PALETTE.muted,
                    }}>
                      Status: {item.status || 'Analyzed'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => restoreCase(item, navigation)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor: PALETTE.paper2,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{
                      fontFamily: 'InterTight_600SemiBold',
                      fontSize: 11,
                      color: PALETTE.ink,
                    }}>
                      Open Case
                    </Text>
                    <ArrowRight size={12} color={PALETTE.ink} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
