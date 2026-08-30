import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SearchClientScreen from '../screens/search/SearchClientScreen';
import ClientMatchResultsScreen from '../screens/search/ClientMatchResultsScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';
import CasePdfScreen from '../screens/cases/CasePdfScreen';
import ClientReportScreen from '../screens/reports/ClientReportScreen';
import LawyerProfileScreen from '../screens/profile/LawyerProfileScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  SearchClient: undefined;
  LawyerProfile: undefined;
  ClientMatchResults: {
    fullName: string;
    courtLocation: string;
    caseTypeHint?: string;
    matches: {
      client_key: string;
      display_name: string;
      court_location?: string;
      case_count: number;
      source?: string;
    }[];
  };
  ClientProfile: {
    clientKey: string;
  };
  CasePdf: {
    pdfUrl: string;
    caseTitle: string;
  };
  ClientReport: {
    clientKey: string;
  };
};

type AppNavigatorProps = {
  isLoggedIn: boolean;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = ({ isLoggedIn }: AppNavigatorProps) => {
  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? 'SearchClient' : 'Login'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.cardBg },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text, fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.appBg },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchClient"
        component={SearchClientScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LawyerProfile"
        component={LawyerProfileScreen}
        options={{ title: 'Lawyer Profile' }}
      />
      <Stack.Screen
        name="ClientMatchResults"
        component={ClientMatchResultsScreen}
        options={{ title: 'Matching Clients' }}
      />
      <Stack.Screen
        name="ClientProfile"
        component={ClientProfileScreen}
        options={{ title: 'Client Profile' }}
      />
      <Stack.Screen
        name="CasePdf"
        component={CasePdfScreen}
        options={{ title: 'Case PDF' }}
      />
      <Stack.Screen
        name="ClientReport"
        component={ClientReportScreen}
        options={{ title: 'Client Report' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
