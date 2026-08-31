import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAlerts } from '../services/relationshipService';

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load alerts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getAlerts();
      setAlerts(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh alerts');
    } finally {
      setRefreshing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return '#FF3B30';
      case 'HIGH':
        return '#FF9500';
      case 'MEDIUM':
        return '#FFCC00';
      case 'LOW':
        return '#34C759';
      default:
        return '#999';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'check-circle';
      default:
        return 'notifications';
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
        <Text style={styles.headerTitle}>Active Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {alerts.length > 0 ? (
        <View style={styles.alertsContainer}>
          {alerts.map((alert, idx) => (
            <View
              key={idx}
              style={[
                styles.alertCard,
                {
                  borderLeftColor: getSeverityColor(alert.severity),
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <MaterialIcons
                  name={getSeverityIcon(alert.severity)}
                  size={20}
                  color={getSeverityColor(alert.severity)}
                />
                <View style={styles.alertTitleContainer}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>
                    {alert.timestamp
                      ? new Date(alert.timestamp).toLocaleString()
                      : 'Just now'}
                  </Text>
                </View>
              </View>

              {alert.message && (
                <Text style={styles.alertMessage}>{alert.message}</Text>
              )}

              {alert.data && (
                <View style={styles.alertData}>
                  {Object.entries(alert.data).map(([key, value]) => (
                    <View key={key} style={styles.dataRow}>
                      <Text style={styles.dataKey}>{key}:</Text>
                      <Text style={styles.dataValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor: getSeverityColor(alert.severity),
                  },
                ]}
              >
                <Text style={styles.severityText}>{alert.severity}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-off" size={48} color="#ddd" />
          <Text style={styles.emptyText}>No alerts</Text>
          <Text style={styles.emptySubtext}>
            Everything looks good right now
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
  alertsContainer: {
    padding: 16,
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  alertMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  alertData: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dataKey: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 12,
    color: '#333',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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

export default AlertsScreen;
