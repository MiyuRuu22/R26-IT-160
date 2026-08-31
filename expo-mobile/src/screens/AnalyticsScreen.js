import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const AnalyticsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const stats = [
    {
      title: 'Total Entities',
      value: '1,247',
      icon: 'people',
      color: '#007AFF',
    },
    {
      title: 'Active Cases',
      value: '89',
      icon: 'description',
      color: '#FF9500',
    },
    {
      title: 'Conflicts Found',
      value: '12',
      icon: 'warning',
      color: '#FF3B30',
    },
    {
      title: 'Risk Score',
      value: '7.2/10',
      icon: 'trending-up',
      color: '#FFCC00',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>System Overview</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
              <MaterialIcons name={stat.icon} size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <MaterialIcons name="check-circle" size={20} color="#34C759" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                Conflict detected: ABC Inc & Client X
              </Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <MaterialIcons name="info" size={20} color="#007AFF" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                New relationship identified
              </Text>
              <Text style={styles.activityTime}>5 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <MaterialIcons name="warning" size={20} color="#FF9500" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Risk assessment updated</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  statsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default AnalyticsScreen;
