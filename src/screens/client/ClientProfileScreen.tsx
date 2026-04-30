import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getClientProfile } from '../../services/api/clientApi';
import { saveClientToFavorites } from '../../services/history/savedClients';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientProfile'>;

type FilterType = 'All' | 'Civil' | 'Criminal' | 'Commercial';
type SortType = 'Latest First' | 'Oldest First' | 'Title A-Z';

const ClientProfileScreen = ({ route, navigation }: Props) => {
  const { clientKey } = route.params;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [selectedSort, setSelectedSort] = useState<SortType>('Latest First');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getClientProfile(clientKey);
      setProfile(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load client profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async () => {
    if (!profile) return;

    try {
      await saveClientToFavorites({
        fullName: profile.client_key,
        courtLocation: profile.court_location || '',
        caseTypeHint: '',
        savedAt: new Date().toISOString(),
      });

      Alert.alert('Saved', 'Client saved to lawyer profile');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save client');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      default:
        return '#16A34A';
    }
  };

  const processedCases = useMemo(() => {
    if (!profile?.cases) return [];

    let cases = [...profile.cases];

    if (selectedFilter !== 'All') {
      cases = cases.filter(
        (item: any) => item.type?.toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    if (selectedSort === 'Title A-Z') {
      cases.sort((a: any, b: any) =>
        String(a.title || '').localeCompare(String(b.title || ''))
      );
    }

    if (selectedSort === 'Latest First') {
      cases.sort((a: any, b: any) =>
        String(b.date || '').localeCompare(String(a.date || ''))
      );
    }

    if (selectedSort === 'Oldest First') {
      cases.sort((a: any, b: any) =>
        String(a.date || '').localeCompare(String(b.date || ''))
      );
    }

    return cases;
  }, [profile, selectedFilter, selectedSort]);

  const renderFilterChip = (label: FilterType) => {
    const active = selectedFilter === label;

    return (
      <TouchableOpacity
        key={label}
        style={[styles.filterChip, active && styles.filterChipActive]}
        onPress={() => setSelectedFilter(label)}
      >
        <Text
          style={[
            styles.filterChipText,
            active && styles.filterChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSortChip = (label: SortType) => {
    const active = selectedSort === label;

    return (
      <TouchableOpacity
        key={label}
        style={[styles.sortChip, active && styles.sortChipActive]}
        onPress={() => setSelectedSort(label)}
      >
        <Text
          style={[
            styles.sortChipText,
            active && styles.sortChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loaderText}>Loading client profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text>No profile data found</Text>
      </View>
    );
  }

  const riskColor = getRiskColor(profile.overall_risk);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Client Verification Profile</Text>
        <Text style={styles.clientName}>{profile.client_name}</Text>
        <Text style={styles.heroSubtitle}>
          Review past legal records, case categories, and overall client risk level.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.saveClientButton} onPress={handleSaveClient}>
          <Text style={styles.saveClientButtonText}>Save Client</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.riskCard}>
        <View
          style={[
            styles.riskBadge,
            { backgroundColor: riskColor },
          ]}
        >
          <Text style={styles.riskBadgeText}>{profile.overall_risk} Risk</Text>
        </View>

        <Text style={styles.riskScoreText}>
          Risk Score: {profile.score ?? 0}%
        </Text>
        <Text style={styles.confidenceText}>
          Confidence: {profile.confidence ?? 0}
        </Text>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(profile.score ?? 0, 100)}%`,
                backgroundColor: riskColor,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.case_count}</Text>
          <Text style={styles.statLabel}>Total Cases</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.civil_count}</Text>
          <Text style={styles.statLabel}>Civil</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.criminal_count}</Text>
          <Text style={styles.statLabel}>Criminal</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.commercial_count}</Text>
          <Text style={styles.statLabel}>Commercial</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>AI Summary</Text>
        <Text style={styles.summaryText}>{profile.summary}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Filter by Case Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {(['All', 'Civil', 'Criminal', 'Commercial'] as FilterType[]).map(
            renderFilterChip
          )}
        </ScrollView>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Sort Cases</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {(['Latest First', 'Oldest First', 'Title A-Z'] as SortType[]).map(
            renderSortChip
          )}
        </ScrollView>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Past Cases</Text>
        <Text style={styles.caseCountText}>{processedCases.length} shown</Text>
      </View>

      {processedCases.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Cases Found</Text>
          <Text style={styles.emptyText}>
            No cases match the current filter and sort selection.
          </Text>
        </View>
      ) : (
        processedCases.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.caseCard}
            activeOpacity={0.88}
            onPress={() => {
  if (!item.pdf_available || !item.pdf_url) {
    Alert.alert('PDF Not Available', 'This case does not have a valid PDF link.');
    return;
  }

  navigation.navigate('CasePdf', {
    pdfUrl: item.pdf_url,
    caseTitle: item.title,
  });
}}
          >
            <View style={styles.caseTopRow}>
              <View style={styles.caseTextSection}>
                <Text style={styles.caseTitle}>{item.title}</Text>
                <Text style={styles.caseMeta}>
                  {item.type} • {item.date}
                </Text>
              </View>

              <View
                style={[
                  styles.caseRiskBadge,
                  { backgroundColor: riskColor },
                ]}
              >
                <Text style={styles.caseRiskBadgeText}>{item.risk_tag}</Text>
              </View>
            </View>

            <Text style={styles.openPdfText}>Tap to open judgment PDF</Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={styles.reportButton}
        onPress={() =>
          navigation.navigate('ClientReport', {
            clientKey,
          })
        }
      >
        <Text style={styles.reportButtonText}>View Full AI Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ClientProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#F1F5F9',
    flexGrow: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loaderText: {
    marginTop: 12,
    color: '#64748B',
  },
  heroCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BFDBFE',
    marginBottom: 6,
  },
  clientName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    lineHeight: 22,
  },
  actionRow: {
    marginBottom: 18,
  },
  saveClientButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveClientButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 12,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  riskScoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  confidenceText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  chipRow: {
    paddingTop: 2,
  },
  filterChip: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortChip: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 10,
  },
  sortChipActive: {
    backgroundColor: '#7C3AED',
  },
  sortChipText: {
    color: '#4C1D95',
    fontWeight: '700',
    fontSize: 13,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseCountText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  caseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  caseTextSection: {
    flex: 1,
    marginRight: 10,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  caseMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  caseRiskBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  caseRiskBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  openPdfText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  reportButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});