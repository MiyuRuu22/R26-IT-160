import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../theme/colors';
import { RADIUS, SCREEN_PADDING } from '../../constants/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientMatchResults'>;

const ClientMatchResultsScreen = ({ navigation, route }: Props) => {
  const { fullName, courtLocation, caseTypeHint, matches } = route.params;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.resultCard}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('ClientProfile', {
          clientKey: item.client_key,
        })
      }
    >
      <View style={styles.cardTopRow}>
        <View style={styles.nameSection}>
          <Text style={styles.clientName}>{item.display_name}</Text>
          <Text style={styles.clientMeta}>
            {item.court_location || 'Unknown court location'}
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{item.case_count}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>
            {item.source ? item.source.toUpperCase() : 'UNKNOWN'}
          </Text>
        </View>

        <Text style={styles.caseText}>Matched Records</Text>
      </View>

      <Text style={styles.tapText}>Tap to view full client profile</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <Text style={styles.pageTitle}>Matching Clients</Text>
        <Text style={styles.pageSubtitle}>
          Select the correct client to view past cases and risk summary.
        </Text>
      </View>

      <View style={styles.searchInfoCard}>
        <Text style={styles.searchInfoTitle}>Search Details</Text>
        <Text style={styles.searchInfoText}>Name: {fullName}</Text>
        <Text style={styles.searchInfoText}>
          Court Location: {courtLocation || 'Not specified'}
        </Text>
        <Text style={styles.searchInfoText}>
          Case Type: {caseTypeHint || 'Not specified'}
        </Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Matching Clients Found</Text>
          <Text style={styles.emptyText}>
            Try another client name, court location, or case type.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item, index) => `${item.client_key}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ClientMatchResultsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBg,
    padding: SCREEN_PADDING,
  },
  topArea: {
    marginTop: 8,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  searchInfoCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInfoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  searchInfoText: {
    fontSize: 14,
    color: colors.textSubtle,
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 30,
  },
  resultCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameSection: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  clientMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  countBadge: {
    backgroundColor: colors.chipBlue,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 48,
    alignItems: 'center',
  },
  countBadgeText: {
    color: colors.primary2,
    fontWeight: '800',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceBadge: {
    backgroundColor: colors.chipIndigo,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 10,
    marginBottom: 4,
    maxWidth: '100%',
    flexShrink: 1,
  },
  sourceBadgeText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  caseText: {
    fontSize: 13,
    color: colors.textSubtle,
    fontWeight: '600',
    flexShrink: 1,
    marginBottom: 4,
  },
  tapText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
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
});
