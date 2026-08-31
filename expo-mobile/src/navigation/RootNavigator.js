import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import GraphScreen from '../screens/GraphScreen';
import NetworkScreen from '../screens/NetworkScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NodeDetailScreen from '../screens/NodeDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const GraphStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="GraphMain"
        component={GraphScreen}
        options={{
          title: 'Graph View',
        }}
      />
      <Stack.Screen
        name="NodeDetail"
        component={NodeDetailScreen}
        options={{
          title: 'Node Details',
        }}
      />
    </Stack.Navigator>
  );
};

const NetworkStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="NetworkMain"
        component={NetworkScreen}
        options={{
          title: 'Network',
        }}
      />
      <Stack.Screen
        name="NodeDetail"
        component={NodeDetailScreen}
        options={{
          title: 'Details',
        }}
      />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Graph':
              iconName = focused ? 'device-hub' : 'device-hub';
              break;
            case 'Network':
              iconName = focused ? 'public' : 'public';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-none';
              break;
            case 'Analytics':
              iconName = focused ? 'bar-chart' : 'bar-chart';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Graph"
        component={GraphStack}
        options={{ title: 'Graph' }}
      />
      <Tab.Screen
        name="Network"
        component={NetworkStack}
        options={{ title: 'Network' }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;
