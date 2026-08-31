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

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const settingItems = [
    {
      title: 'Notifications',
      icon: 'notifications',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      title: 'Auto Refresh',
      icon: 'refresh',
      value: autoRefresh,
      onToggle: setAutoRefresh,
    },
  ];

  const menuItems = [
    { title: 'About', icon: 'info', action: () => {} },
    { title: 'Help & Support', icon: 'help', action: () => {} },
    { title: 'Privacy Policy', icon: 'privacy-tip', action: () => {} },
    { title: 'Terms of Service', icon: 'description', action: () => {} },
    { title: 'Logout', icon: 'logout', action: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {settingItems.map((item, idx) => (
          <View key={idx} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name={item.icon} size={20} color="#007AFF" />
              <Text style={styles.settingTitle}>{item.title}</Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#ddd', true: '#81C784' }}
              thumbColor={item.value ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        ))}
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>001</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.menuItem}
            onPress={item.action}
          >
            <MaterialIcons name={item.icon} size={20} color="#666" />
            <Text style={styles.menuItemText}>{item.title}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        ))}
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
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default SettingsScreen;
