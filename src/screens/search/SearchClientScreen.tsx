import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { RADIUS, SCREEN_PADDING } from '../../constants/ui';
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

  const filteredLocations = useMemo(() => {
    const needle = courtLocation.trim().toLowerCase();
    if (!needle) return [];
    return COURT_LOCATIONS.filter((location) =>
      location.toLowerCase().includes(needle)
    );
  }, [courtLocation]);

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

  const isStep1Done = fullName.trim().length > 0;
  const isStep2Done = courtLocation.trim().length > 0;

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
        <View style={styles.stepsRow}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                isStep1Done ? styles.stepDotActive : styles.stepDotInactive,
              ]}
            />
            <Text style={[styles.stepLabel, isStep1Done && styles.stepLabelActive]}>
              1. Identity
            </Text>
          </View>

          <View style={[styles.stepDivider, isStep1Done && styles.stepDividerActive]} />

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                isStep2Done ? styles.stepDotActive : styles.stepDotInactive,
              ]}
            />
            <Text style={[styles.stepLabel, isStep2Done && styles.stepLabelActive]}>
              2. Court
            </Text>
          </View>

          <View style={[styles.stepDivider, (isStep1Done || isStep2Done) && styles.stepDividerActive]} />

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                caseTypeHint.trim().length > 0
                  ? styles.stepDotActive
                  : styles.stepDotInactive,
              ]}
            />
            <Text
              style={[
                styles.stepLabel,
                caseTypeHint.trim().length > 0 && styles.stepLabelActive,
              ]}
            >
              3. Type
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>Client Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter client name"
            placeholderTextColor="#94A3B8"
            value={fullName}
            editable={!loading}
            onChangeText={(t) => {
              setFullName(t);
              setShowLocationList(false);
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Court Location</Text>
          <View style={styles.locationInputRow}>
            <TextInput
              style={[styles.input, styles.locationInputFlex]}
              placeholder="Search or select location"
              placeholderTextColor="#94A3B8"
              value={courtLocation}
              editable={!loading}
              onChangeText={(text) => {
                setCourtLocation(text);
                setShowLocationList(true);
              }}
              onFocus={() => {
                if (!loading) setShowLocationList(true);
              }}
            />

            {courtLocation.length > 0 && (
              <TouchableOpacity
                style={styles.clearLocationButton}
                onPress={() => {
                  setCourtLocation('');
                  setShowLocationList(false);
                }}
                disabled={loading}
              >
                <Text style={styles.clearLocationText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {showLocationList && courtLocation.trim().length > 0 && (
            <View style={styles.locationDropdown}>
              {filteredLocations.length === 0 ? (
                <Text style={styles.noLocationText}>No matching location</Text>
              ) : (
                filteredLocations.slice(0, 8).map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={styles.locationItem}
                    onPress={() => handleSelectLocation(location)}
                    disabled={loading}
                  >
                    <Text style={styles.locationText}>{location}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {showLocationList && courtLocation.trim().length === 0 && (
            <Text style={styles.hintText}>Type to search a court location</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Case Type (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Civil / Criminal / Commercial"
            placeholderTextColor="#94A3B8"
            value={caseTypeHint}
            editable={!loading}
            onChangeText={setCaseTypeHint}
          />
        </View>

        <TouchableOpacity
          style={[styles.searchButton, loading && styles.disabledButton]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <View style={styles.searchButtonInner}>
              <ActivityIndicator size="small" color={colors.cardBg} />
              <View style={styles.searchButtonInnerSpacer} />
              <Text style={styles.searchButtonText}>Searching...</Text>
            </View>
          ) : (
            <Text style={styles.searchButtonText}>Search Client</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.microHelp}>
          Tip: Use the court location to reduce mismatches.
        </Text>
      </View>

      <View style={styles.blockCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>Recent Searches</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory} disabled={loading}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No recent searches yet</Text>
            <Text style={styles.emptyText}>
              Your last searches will appear here for quick access.
            </Text>
          </View>
        ) : (
          history.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyCard}
              onPress={() => handleHistorySelect(item)}
              disabled={loading}
            >
              <View style={styles.historyMainRow}>
                <View style={styles.historyTextBlock}>
                  <Text style={styles.clientNameText}>{item.fullName}</Text>
                  <Text style={styles.clientMetaText} numberOfLines={2}>
                    {item.courtLocation || 'No location'} • {item.caseTypeHint || 'No case type'}
                  </Text>
                </View>
                <Text style={styles.historyChevron}>›</Text>
              </View>
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
    padding: SCREEN_PADDING,
    backgroundColor: colors.appBg,
    flexGrow: 1,
  },
  topBar: {
    marginTop: 8,
    marginBottom: 18,
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
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  profileButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: colors.cardBg,
    fontSize: 18,
    fontWeight: '900',
  },
  formCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 22,
    marginBottom: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  blockCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 22,
    marginBottom: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotInactive: {
    backgroundColor: '#CBD5E1',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.text,
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: colors.divider,
    marginHorizontal: 10,
  },
  stepDividerActive: {
    backgroundColor: '#93C5FD',
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSubtle,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInputFlex: {
    flex: 1,
  },
  clearLocationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLocationText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 18,
  },
  locationDropdown: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  locationItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  locationText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  noLocationText: {
    padding: 14,
    color: colors.textMuted,
    fontSize: 14,
  },
  hintText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  searchButton: {
    backgroundColor: colors.primary2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  searchButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonInnerSpacer: {
    width: 10,
  },

  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  searchButtonText: {
    color: colors.cardBg,
    fontSize: 16,
    fontWeight: '900',
  },
  microHelp: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 18,
    padding: 22,
    marginTop: 14,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  historyMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTextBlock: {
    flex: 1,
    marginRight: 10,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  clientMetaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  historyChevron: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '900',
    paddingHorizontal: 6,
  },
});
