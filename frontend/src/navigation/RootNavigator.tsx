import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { Home, Scale, FileText, User, Crosshair, Shield } from 'lucide-react-native';

// Screens
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { SplashScreen } from '../screens/Auth/SplashScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { AnalyzerScreen } from '../screens/Analyzer/AnalyzerScreen';
import { ResultsScreen } from '../screens/Analyzer/ResultsScreen';
import { DefenseResultsScreen } from '../screens/Analyzer/DefenseResultsScreen';
import { AddCaseDetailsScreen } from '../screens/Analyzer/AddCaseDetailsScreen';
import { ReAnalysisLoadingScreen } from '../screens/Analyzer/ReAnalysisLoadingScreen';
import { CaseAssistantScreen } from '../screens/Analyzer/CaseAssistantScreen';
import { DraftAssistantScreen } from '../screens/Drafts/DraftAssistantScreen';
import { RelationshipGraphScreen } from '../screens/Graph/RelationshipGraphScreen';
import { RiskAssessmentScreen } from '../screens/Risk/RiskAssessmentScreen';
import OpponentPredictionScreen from '../screens/OpponentPredictionScreen';
import { LandingScreen } from '../screens/Landing/LandingScreen';

import { DefenderLandingScreen } from '../screens/Defender/DefenderLandingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PaperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f4f1ea',
  },
};

function DefenderStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="DefenderLanding">
      <Stack.Screen name="DefenderLanding" component={DefenderLandingScreen} />
      <Stack.Screen name="AnalyzerForm" component={AnalyzerScreen} />
      <Stack.Screen name="Analyzer" component={AnalyzerScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="DefenseResults" component={DefenseResultsScreen} />
      <Stack.Screen name="AddCaseDetails" component={AddCaseDetailsScreen} />
      <Stack.Screen name="ReAnalysisLoading" component={ReAnalysisLoadingScreen} />
      <Stack.Screen name="CaseAssistant" component={CaseAssistantScreen} />
      <Stack.Screen name="OpponentPrediction" component={OpponentPredictionScreen} />
      <Stack.Screen name="Opponent" component={OpponentPredictionScreen} />
    </Stack.Navigator>
  );
}


function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f4f1ea',
          borderTopWidth: 1,
          borderTopColor: '#e0dbcb',
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#0e0e0c',
        tabBarInactiveTintColor: '#6b685f',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Defender" 
        component={DefenderStack} 
        options={{ 
          tabBarLabel: 'Defender',
          tabBarIcon: ({ color }) => <Shield color={color} size={24} /> 
        }}
      />
      <Tab.Screen 
        name="Drafts" 
        component={DraftAssistantScreen} 
        options={{ tabBarIcon: ({ color }) => <FileText color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Graph" 
        component={RelationshipGraphScreen} 
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Risk" 
        component={RiskAssessmentScreen} 
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={PaperTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {user ? (
          <Stack.Group>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen name="CaseAssistant" component={CaseAssistantScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
