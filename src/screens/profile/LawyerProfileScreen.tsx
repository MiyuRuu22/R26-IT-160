import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase/firebaseConfig';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  getSavedClients,
  removeSavedClient,
  SavedClientItem,
} from '../../services/history/savedClients';

type Props = NativeStackScreenProps<RootStackParamList, 'LawyerProfile'>;

const LawyerProfileScreen = ({ navigation }: Props) => {
  const [savedClients, setSavedClients] = useState<SavedClientItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSavedClients();
    }, [])
  );

  const loadSavedClients = async () => {
    const data = await getSavedClients();
    setSavedClients(data);
  };

  const handleOpenSavedClient = (item: SavedClientItem) => {
    navigation.navigate('ClientProfile', {
      clientKey: item.fullName,
    });
  };

  const handleRemoveSavedClient = async (item: SavedClientItem) => {
    await removeSavedClient(item);
    await loadSavedClients();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const lawyerEmail = auth.currentUser?.email || 'lawyer@account.com';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {lawyerEmail.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.profileLabel}>Signed in lawyer</Text>
        <Text style={styles.profileEmail}>{lawyerEmail}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.savedClientsCard}>
        <Text style={styles.sectionTitle}>Saved Clients</Text>

        {savedClients.length === 0 ? (
          <Text style={styles.emptyText}>No saved clients yet</Text>
        ) : (
          savedClients.map((item, index) => (
            <View key={index} style={styles.savedClientRow}>
              <TouchableOpacity
                style={styles.savedClientInfo}
                onPress={() =>
                  navigation.navigate('ClientProfile', {
                    clientKey: item.fullName,
                  })
                }
              >
                <Text style={styles.savedClientName}>{item.fullName}</Text>
                <Text style={styles.savedClientMeta}>
                  Tap to open client details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveSavedClient(item)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default LawyerProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#F1F5F9',
    flexGrow: 1,
  },
  profileCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#1E3A8A',
    fontSize: 26,
    fontWeight: '800',
  },
  profileLabel: {
    fontSize: 13,
    color: '#BFDBFE',
    marginBottom: 6,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  logoutButtonText: {
    color: '#1E3A8A',
    fontWeight: '800',
    fontSize: 14,
  },
  savedClientsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  savedClientRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedClientInfo: {
    flex: 1,
  },
  savedClientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  savedClientMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 10,
  },
  removeButtonText: {
    color: '#B91C1C',
    fontWeight: '800',
    fontSize: 12,
  },
});