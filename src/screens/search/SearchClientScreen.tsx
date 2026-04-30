import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { searchClients } from '../../services/api/clientApi';
import {
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
  SearchHistoryItem,
} from '../../services/history/searchHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchClient'>;

const SearchClientScreen = ({ navigation }: Props) => {
  const [fullName, setFullName] = useState('');
  const [courtLocation, setCourtLocation] = useState('');
  const [caseTypeHint, setCaseTypeHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getSearchHistory();
    setHistory(data);
  };

  const handleSearch = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter client full name');
      return;
    }

    try {
      setLoading(true);

      const data = await searchClients({
        fullName,
        courtLocation,
        caseTypeHint,
      });

      await saveSearchHistory({
        fullName,
        courtLocation,
        caseTypeHint,
        searchedAt: new Date().toISOString(),
      });

      await loadHistory();

      navigation.navigate('ClientMatchResults', {
        fullName,
        courtLocation,
        caseTypeHint,
        matches: data.matches || [],
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to search clients');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setFullName(item.fullName);
    setCourtLocation(item.courtLocation);
    setCaseTypeHint(item.caseTypeHint || '');
  };

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setHistory([]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.welcomeText}>Lawyer Workspace</Text>
          <Text style={styles.pageTitle}>Search Client</Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('LawyerProfile')}
        >
          <Text style={styles.profileButtonText}>L</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Client Verification & Risk Assessment</Text>
        <Text style={styles.heroSubtitle}>
          Search by client name, location, and case type to find the correct person and review past cases.
        </Text>

        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>AI Ready</Text>
          </View>
          <View style={styles.heroBadgeSecondary}>
            <Text style={styles.heroBadgeSecondaryText}>Legal Case Search</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionHeading}>Search Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Court Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter court location"
            placeholderTextColor="#94A3B8"
            value={courtLocation}
            onChangeText={setCourtLocation}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Case Type</Text>
          <TextInput
            style={styles.input}
            placeholder="Civil / Criminal / Commercial"
            placeholderTextColor="#94A3B8"
            value={caseTypeHint}
            onChangeText={setCaseTypeHint}
          />
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>
            {loading ? 'Searching...' : 'Search Cases'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.blockCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionHeading}>Recent Searches</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <Text style={styles.emptyText}>No recent searches yet</Text>
        ) : (
          history.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyCard}
              onPress={() => handleHistorySelect(item)}
            >
              <Text style={styles.clientNameText}>{item.fullName}</Text>
              <Text style={styles.clientMetaText}>
                {item.courtLocation || 'No location'}
              </Text>
              <Text style={styles.clientMetaText}>
                {item.caseTypeHint || 'No case type'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default SearchClientScreen;

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#F1F5F9',
    flexGrow: 1,
  },
  topBar: {
    marginTop: 10,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    lineHeight: 22,
    marginBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 10,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 12,
  },
  heroBadgeSecondary: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 8,
  },
  heroBadgeSecondaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  clientMetaText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
});