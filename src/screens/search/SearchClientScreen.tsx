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

const COURT_LOCATIONS = [
  'Colombo', 'Fort', 'Maligakanda', 'Mount Lavinia', 'Negombo', 'Ja-Ela',
  'Gampaha', 'Attanagalla', 'Minuwangoda', 'Mirigama',
  'Kalutara', 'Panadura', 'Horana', 'Matugama', 'Aluthgama',
  'Kandy', 'Peradeniya', 'Gampola', 'Nawalapitiya', 'Teldeniya',
  'Matale', 'Dambulla', 'Nuwara Eliya', 'Hatton',
  'Galle', 'Ambalangoda', 'Elpitiya',
  'Matara', 'Akuressa', 'Weligama',
  'Hambantota', 'Tangalle', 'Tissamaharama',
  'Jaffna', 'Chavakachcheri', 'Point Pedro', 'Kayts',
  'Kilinochchi', 'Mannar', 'Vavuniya',
  'Batticaloa', 'Eravur', 'Valachchenai',
  'Kalmunai', 'Akkaraipattu', 'Samanthurai',
  'Trincomalee', 'Kinniya', 'Mutur',
  'Kurunegala', 'Kuliyapitiya', 'Nikaweratiya',
  'Puttalam', 'Chilaw', 'Marawila',
  'Anuradhapura', 'Kekirawa', 'Medawachchiya',
  'Polonnaruwa', 'Hingurakgoda',
  'Badulla', 'Bandarawela', 'Haputale',
  'Monaragala', 'Wellawaya',
  'Ratnapura', 'Balangoda', 'Embilipitiya',
  'Kegalle', 'Mawanella', 'Warakapola',
];

const SearchClientScreen = ({ navigation }: Props) => {
  const [fullName, setFullName] = useState('');
  const [courtLocation, setCourtLocation] = useState('');
  const [caseTypeHint, setCaseTypeHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showLocationList, setShowLocationList] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredLocations = COURT_LOCATIONS.filter(location =>
    location.toLowerCase().includes(courtLocation.toLowerCase())
  );

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
      Alert.alert('Error', 'Failed to search clients');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setFullName(item.fullName);
    setCourtLocation(item.courtLocation);
    setCaseTypeHint(item.caseTypeHint || '');
    setShowLocationList(false);
  };

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setHistory([]);
  };

  const handleSelectLocation = (location: string) => {
    setCourtLocation(location);
    setShowLocationList(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <View style={styles.titleArea}>
          <Text style={styles.smallTitle}>Legal Workspace</Text>
          <Text style={styles.pageTitle}>Search Client</Text>
          <Text style={styles.pageSubtitle}>
            Find the correct client and review past case risk.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('LawyerProfile')}
        >
          <Text style={styles.profileButtonText}>L</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Client Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter client name"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Court Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Search or select location"
            placeholderTextColor="#94A3B8"
            value={courtLocation}
            onChangeText={(text) => {
              setCourtLocation(text);
              setShowLocationList(true);
            }}
            onFocus={() => setShowLocationList(true)}
          />

          {courtLocation.length > 0 && (
            <TouchableOpacity
              style={styles.clearLocationButton}
              onPress={() => {
                setCourtLocation('');
                setShowLocationList(false);
              }}
            >
              <Text style={styles.clearLocationText}>Clear</Text>
            </TouchableOpacity>
          )}

          {showLocationList && (
            <View style={styles.locationDropdown}>
              {filteredLocations.length === 0 ? (
                <Text style={styles.noLocationText}>No matching location</Text>
              ) : (
                filteredLocations.slice(0, 8).map(location => (
                  <TouchableOpacity
                    key={location}
                    style={styles.locationItem}
                    onPress={() => handleSelectLocation(location)}
                  >
                    <Text style={styles.locationText}>{location}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
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

        <TouchableOpacity
          style={[styles.searchButton, loading && styles.disabledButton]}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Searching...' : 'Search Client'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.blockCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>Recent Searches</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearText}>Clear All</Text>
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
                {item.courtLocation || 'No location'} • {item.caseTypeHint || 'No case type'}
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
    padding: 20,
    backgroundColor: '#EEF2F7',
    flexGrow: 1,
  },
  topBar: {
    marginTop: 8,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    paddingRight: 12,
  },
  smallTitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  profileButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  clearLocationButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  clearLocationText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  locationDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  locationItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  locationText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  noLocationText: {
    padding: 14,
    color: '#64748B',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  clientMetaText: {
    fontSize: 13,
    color: '#64748B',
  },
});