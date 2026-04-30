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
          keyExtractor={(item, index) => item.client_key || index.toString()}
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
    backgroundColor: '#F1F5F9',
    padding: 18,
  },
  topArea: {
    marginTop: 8,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  searchInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  searchInfoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  searchInfoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 30,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
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
    color: '#0F172A',
    marginBottom: 6,
  },
  clientMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  countBadge: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 48,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 10,
  },
  sourceBadgeText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '800',
  },
  caseText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  tapText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
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
});