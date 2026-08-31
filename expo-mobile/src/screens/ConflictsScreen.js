import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getConflicts } from '../services/relationshipService';

const ConflictsScreen = ({ navigation }) => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      setLoading(true);
      const data = await getConflicts();
      setConflicts(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load conflicts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getConflicts();
      setConflicts(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh conflicts');
    } finally {
      setRefreshing(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toUpperCase()) {
      case 'HIGH':
        return '#FF3B30';
      case 'MEDIUM':
        return '#FF9500';
      case 'LOW':
        return '#34C759';
      default:
        return '#999';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>
          Conflicts Found: {conflicts.length}
        </Text>
        <Text style={styles.headerSubtitle}>
          Potential conflicts of interest
        </Text>
      </View>

      {conflicts.length > 0 ? (
        <View style={styles.conflictsContainer}>
          {conflicts.map((conflict, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.conflictCard}
              onPress={() =>
                navigation.navigate('NodeDetail', { node: conflict })
              }
            >
              <View style={styles.riskBadge}>
                <MaterialIcons name="warning" size={16} color="#fff" />
                <Text style={styles.riskText}>{conflict.risk}</Text>
              </View>

              <View style={styles.conflictContent}>
                <Text style={styles.client1}>{conflict.client1}</Text>
                <View style={styles.conflictIndicator}>
                  <Text style={styles.vsText}>vs</Text>
                </View>
                <Text style={styles.client2}>{conflict.client2}</Text>
              </View>

              <View style={styles.organizationSection}>
                <MaterialIcons name="business" size={16} color="#666" />
                <Text style={styles.organization}>
                  {conflict.organization}
                </Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={24}
                color="#999"
                style={styles.chevron}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="check-circle" size={48} color="#34C759" />
          <Text style={styles.emptyText}>No conflicts detected</Text>
          <Text style={styles.emptySubtext}>
            Your clients appear to be clear of conflicts
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  conflictsContainer: {
    padding: 16,
    gap: 12,
  },
  conflictCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
    gap: 4,
    alignItems: 'center',
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  conflictContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  client1: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  conflictIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  vsText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  client2: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  organizationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  organization: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#999',
  },
});

export default ConflictsScreen;
