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
import { colors } from '../../theme/colors';
import { RADIUS, SCREEN_PADDING } from '../../constants/ui';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ClientProfile'
>;

type FilterType =
  | 'All'
  | 'Civil'
  | 'Criminal'
  | 'Commercial';

type SortType =
  | 'Latest First'
  | 'Oldest First'
  | 'Title A-Z';

const ClientProfileScreen = ({
  route,
  navigation,
}: Props) => {
  const { clientKey } = route.params;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('All');

  const [selectedSort, setSelectedSort] =
    useState<SortType>('Latest First');

  // ============================================================
  // Load client profile
  // ============================================================

  useEffect(() => {
    loadProfile();
  }, [clientKey]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const data = await getClientProfile(clientKey);

      setProfile(data);
    } catch (error) {
      console.error('Failed to load client profile:', error);

      Alert.alert(
        'Error',
        'Failed to load client profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Save client
  // ============================================================

  const handleSaveClient = async () => {
    if (!profile) {
      return;
    }

    try {
      await saveClientToFavorites({
        clientKey,
        fullName:
          profile.client_name ||
          clientKey,

        courtLocation:
          profile.court_location || '',

        caseTypeHint: '',

        savedAt: new Date().toISOString(),
      });

      Alert.alert(
        'Saved',
        `${profile.client_name || 'Client'} has been saved to your lawyer profile.`
      );
    } catch (error) {
      console.error(
        'Failed to save client:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to save client.'
      );
    }
  };

  // ============================================================
  // Risk color
  // ============================================================

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return colors.danger;

      case 'medium':
        return colors.warning;

      default:
        return colors.success;
    }
  };

  // ============================================================
  // Process cases
  // ============================================================

  const processedCases = useMemo(() => {
    if (!profile?.cases) {
      return [];
    }

    let cases = [...profile.cases];

    // ----------------------------------------------------------
    // Filter
    // ----------------------------------------------------------

    if (selectedFilter !== 'All') {
      cases = cases.filter(
        (item: any) =>
          String(item.type || '').toLowerCase() ===
          selectedFilter.toLowerCase()
      );
    }

    // ----------------------------------------------------------
    // Sort
    // ----------------------------------------------------------

    if (selectedSort === 'Title A-Z') {
      cases.sort((a: any, b: any) => {
        const titleA =
          a.case_number ||
          a.title ||
          '';

        const titleB =
          b.case_number ||
          b.title ||
          '';

        return String(titleA).localeCompare(
          String(titleB)
        );
      });
    }

    if (selectedSort === 'Latest First') {
      cases.sort((a: any, b: any) =>
        String(b.date || '').localeCompare(
          String(a.date || '')
        )
      );
    }

    if (selectedSort === 'Oldest First') {
      cases.sort((a: any, b: any) =>
        String(a.date || '').localeCompare(
          String(b.date || '')
        )
      );
    }

    return cases;
  }, [
    profile,
    selectedFilter,
    selectedSort,
  ]);

  const confidence = useMemo(() => {
    const value = Number(profile?.confidence ?? 0);

    if (Number.isNaN(value)) {
      return 0;
    }

    const percentage = value <= 1 ? value * 100 : value;

    return Math.round(Math.max(0, Math.min(100, percentage)));
  }, [profile?.confidence]);

  // ============================================================
  // Filter chip
  // ============================================================

  const renderFilterChip = (
    label: FilterType
  ) => {
    const active =
      selectedFilter === label;

    return (
      <TouchableOpacity
        key={label}
        style={[
          styles.filterChip,
          active &&
            styles.filterChipActive,
        ]}
        onPress={() =>
          setSelectedFilter(label)
        }
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.filterChipText,
            active &&
              styles.filterChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // Sort chip
  // ============================================================

  const renderSortChip = (
    label: SortType
  ) => {
    const active =
      selectedSort === label;

    return (
      <TouchableOpacity
        key={label}
        style={[
          styles.sortChip,
          active &&
            styles.sortChipActive,
        ]}
        onPress={() =>
          setSelectedSort(label)
        }
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.sortChipText,
            active &&
              styles.sortChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loaderText}>
          Loading client profile...
        </Text>
      </View>
    );
  }

  // ============================================================
  // No profile
  // ============================================================

  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text style={styles.noProfileText}>
          No profile data found.
        </Text>
      </View>
    );
  }

  const riskColor = getRiskColor(
    profile.overall_risk
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ======================================================
          Client Header
      ====================================================== */}

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>
          Client Verification Profile
        </Text>

        <Text style={styles.clientName}>
          {profile.client_name ||
            'Unknown Client'}
        </Text>

        <Text style={styles.heroSubtitle}>
          Review past legal records, case
          categories, and overall client risk
          level.
        </Text>
      </View>

      {/* ======================================================
          Save Client
      ====================================================== */}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.saveClientButton}
          onPress={handleSaveClient}
          activeOpacity={0.85}
        >
          <Text
            style={styles.saveClientButtonText}
          >
            Save Client
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================
          Risk Card
      ====================================================== */}

      <View style={styles.riskCard}>
        <View
          style={[
            styles.riskBadge,
            {
              backgroundColor:
                riskColor,
            },
          ]}
        >
          <Text style={styles.riskBadgeText}>
            {profile.overall_risk ||
              'Low'}{' '}
            Risk
          </Text>
        </View>

        <Text style={styles.riskScoreText}>
          Risk Score:{' '}
          {profile.score ?? 0}%
        </Text>

        <Text style={styles.confidenceText}>
          Confidence:{' '}
          {confidence}%
        </Text>

        <View
          style={
            styles.progressBarBackground
          }
        >
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(
                  Number(
                    profile.score ?? 0
                  ),
                  100
                )}%`,
                backgroundColor:
                  riskColor,
              },
            ]}
          />
        </View>
      </View>

      {/* ======================================================
          Statistics
      ====================================================== */}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {profile.case_count ?? 0}
          </Text>

          <Text style={styles.statLabel}>
            Total Cases
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {profile.civil_count ?? 0}
          </Text>

          <Text style={styles.statLabel}>
            Civil
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {profile.criminal_count ?? 0}
          </Text>

          <Text style={styles.statLabel}>
            Criminal
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {profile.commercial_count ?? 0}
          </Text>

          <Text style={styles.statLabel}>
            Commercial
          </Text>
        </View>
      </View>

      {/* ======================================================
          AI Summary
      ====================================================== */}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          AI Summary
        </Text>

        <Text style={styles.summaryText}>
          {profile.summary ||
            'No summary available.'}
        </Text>
      </View>

      {/* ======================================================
          Filter
      ====================================================== */}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Filter by Case Type
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.chipRow
          }
        >
          {(
            [
              'All',
              'Civil',
              'Criminal',
              'Commercial',
            ] as FilterType[]
          ).map(renderFilterChip)}
        </ScrollView>
      </View>

      {/* ======================================================
          Sort
      ====================================================== */}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Sort Cases
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.chipRow
          }
        >
          {(
            [
              'Latest First',
              'Oldest First',
              'Title A-Z',
            ] as SortType[]
          ).map(renderSortChip)}
        </ScrollView>
      </View>

      {/* ======================================================
          Past Cases Header
      ====================================================== */}

      <View
        style={styles.sectionHeaderRow}
      >
        <Text style={styles.sectionTitle}>
          Past Cases
        </Text>

        <Text style={styles.caseCountText}>
          {processedCases.length} shown
        </Text>
      </View>

      {/* ======================================================
          Empty Cases
      ====================================================== */}

      {processedCases.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No Cases Found
          </Text>

          <Text style={styles.emptyText}>
            No cases match the current
            filter and sort selection.
          </Text>
        </View>
      ) : (
        /* ====================================================
           Case Cards
        ==================================================== */

        processedCases.map(
          (item: any) => {
            const caseTitle =
              item.case_number ||
              item.title ||
              'Unknown Case';

            return (
              <TouchableOpacity
                key={
                  item.id ||
                  item.case_number ||
                  `${item.title}-${item.date}`
                }
                style={styles.caseCard}
                activeOpacity={0.88}
                onPress={() => {
                  if (
                    !item.pdf_available ||
                    !item.pdf_url
                  ) {
                    Alert.alert(
                      'PDF Not Available',
                      'This case does not have a valid PDF link.'
                    );

                    return;
                  }

                  navigation.navigate(
                    'CasePdf',
                    {
                      pdfUrl:
                        item.pdf_url,

                      caseTitle:
                        caseTitle,
                    }
                  );
                }}
              >
                <View
                  style={
                    styles.caseTopRow
                  }
                >
                  <View
                    style={
                      styles.caseTextSection
                    }
                  >
                    {/* ==================================================
                        FIXED:
                        Show case number instead of client name
                    ================================================== */}

                    <Text
                      style={
                        styles.caseTitle
                      }
                    >
                      {caseTitle}
                    </Text>

                    <Text
                      style={
                        styles.caseMeta
                      }
                    >
                      {item.type ||
                        'Unknown'}{' '}
                      •{' '}
                      {item.date ||
                        'Unknown Date'}
                    </Text>

                    {/* ==================================================
                        Optional court location
                    ================================================== */}

                    {item.court_location &&
                      item.court_location !==
                        'Unknown' && (
                        <Text
                          style={
                            styles.caseLocation
                          }
                        >
                          {item.court ||
                            'Court'}{' '}
                          •{' '}
                          {
                            item.court_location
                          }
                        </Text>
                      )}
                  </View>

                  <View
                    style={[
                      styles.caseRiskBadge,
                      {
                        backgroundColor:
                          getRiskColor(
                            item.risk_tag ||
                              profile.overall_risk
                          ),
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.caseRiskBadgeText
                      }
                    >
                      {item.risk_tag ||
                        profile.overall_risk ||
                        'Low'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.openPdfText
                  }
                >
                  {item.pdf_available &&
                  item.pdf_url
                    ? 'Tap to open judgment PDF'
                    : 'Judgment PDF unavailable'}
                </Text>
              </TouchableOpacity>
            );
          }
        )
      )}

      {/* ======================================================
          Full AI Report
      ====================================================== */}

      <TouchableOpacity
        style={styles.reportButton}
        onPress={() =>
          navigation.navigate(
            'ClientReport',
            {
              clientKey,
            }
          )
        }
        activeOpacity={0.85}
      >
        <Text
          style={styles.reportButtonText}
        >
          View Full AI Report
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ClientProfileScreen;

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    padding: SCREEN_PADDING,
    backgroundColor: colors.appBg,
    flexGrow: 1,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.appBg,
  },

  loaderText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 14,
  },

  noProfileText: {
    color: colors.textSubtle,
    fontSize: 15,
  },

  // ==========================================================
  // Hero
  // ==========================================================

  heroCard: {
    backgroundColor: colors.navy2,
    borderRadius: RADIUS,
    padding: SCREEN_PADDING,
    marginBottom: 18,
  },

  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.chipBlue,
    marginBottom: 6,
  },

  clientName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.cardBg,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    color: colors.chipBlue,
    lineHeight: 22,
  },

  // ==========================================================
  // Save
  // ==========================================================

  actionRow: {
    marginBottom: 18,
  },

  saveClientButton: {
    backgroundColor: colors.teal,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  saveClientButtonText: {
    color: colors.cardBg,
    fontSize: 15,
    fontWeight: '800',
  },

  // ==========================================================
  // Risk
  // ==========================================================

  riskCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
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
    color: colors.cardBg,
    fontWeight: '800',
    fontSize: 14,
  },

  riskScoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },

  confidenceText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },

  progressBarBackground: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },

  // ==========================================================
  // Statistics
  // ==========================================================

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  statCard: {
    backgroundColor: colors.cardBg,
    width: '48%',
    padding: 18,
    borderRadius: RADIUS,
    alignItems: 'center',
    marginBottom: 14,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },

  statLabel: {
    fontSize: 14,
    color: colors.textSubtle,
    fontWeight: '600',
  },

  // ==========================================================
  // Sections
  // ==========================================================

  sectionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 18,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },

  summaryText: {
    fontSize: 15,
    color: colors.textSubtle,
    lineHeight: 24,
  },

  // ==========================================================
  // Chips
  // ==========================================================

  chipRow: {
    paddingTop: 2,
  },

  filterChip: {
    backgroundColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 10,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
  },

  filterChipText: {
    color: colors.textSubtle,
    fontWeight: '700',
    fontSize: 13,
  },

  filterChipTextActive: {
    color: colors.cardBg,
  },

  sortChip: {
    backgroundColor: colors.chipIndigo,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 10,
  },

  sortChipActive: {
    backgroundColor: colors.primary2,
  },

  sortChipText: {
    color: colors.primary2,
    fontWeight: '700',
    fontSize: 13,
  },

  sortChipTextActive: {
    color: colors.cardBg,
  },

  // ==========================================================
  // Cases Header
  // ==========================================================

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  caseCountText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '700',
  },

  // ==========================================================
  // Case Card
  // ==========================================================

  caseCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
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
    color: colors.text,
    marginBottom: 4,
  },

  caseMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 3,
  },

  caseLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  caseRiskBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },

  caseRiskBadgeText: {
    color: colors.cardBg,
    fontWeight: '800',
    fontSize: 12,
  },

  openPdfText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // ==========================================================
  // Empty
  // ==========================================================

  emptyCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: SCREEN_PADDING,
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ==========================================================
  // Report
  // ==========================================================

  reportButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  reportButtonText: {
    color: colors.cardBg,
    fontSize: 16,
    fontWeight: '800',
  },
});
