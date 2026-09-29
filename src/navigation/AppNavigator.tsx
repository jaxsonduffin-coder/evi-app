// =============================================
// EVI - Main App Navigator
// =============================================

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import JoinHouseholdScreen from '../screens/onboarding/JoinHouseholdScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import VaultScreen from '../screens/vault/VaultScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import AskScreen from '../screens/ask/AskScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Modal / Detail Screens
import HomeDetailsScreen from '../screens/home/HomeDetailsScreen';
import VehiclesScreen from '../screens/vehicles/VehiclesScreen';
import AddVehicleScreen from '../screens/vehicles/AddVehicleScreen';
import DocumentUploadScreen from '../screens/documents/DocumentUploadScreen';
import DocumentDetailScreen from '../screens/documents/DocumentDetailScreen';
import MembersScreen from '../screens/members/MembersScreen';
import AppliancesScreen from '../screens/appliances/AppliancesScreen';
import AddApplianceScreen from '../screens/appliances/AddApplianceScreen';
import UtilitiesScreen from '../screens/utilities/UtilitiesScreen';
import AddUtilityScreen from '../screens/utilities/AddUtilityScreen';
import AddTaskScreen from '../screens/tasks/AddTaskScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import AlertsScreen from '../screens/alerts/AlertsScreen';
import PaywallScreen from '../screens/subscription/PaywallScreen';
import DocumentScannerScreen from '../screens/documents/DocumentScannerScreen';
import ReferralsScreen from '../screens/referrals/ReferralsScreen';
import PrivacySecurityScreen from '../screens/settings/PrivacySecurityScreen';
import ImportantDatesScreen from '../screens/importantDates/ImportantDatesScreen';
import AddImportantDateScreen from '../screens/importantDates/AddImportantDateScreen';
import ChecklistsScreen from '../screens/checklists/ChecklistsScreen';
import ChecklistDetailScreen from '../screens/checklists/ChecklistDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Vault':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Ask':
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
      <Tab.Screen
        name="Ask"
        component={AskScreen}
        options={{ tabBarLabel: 'Ask EVI' }}
      />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="HomeDetails" component={HomeDetailsScreen} />
      <Stack.Screen name="Members" component={MembersScreen} />
      <Stack.Screen name="Vehicles" component={VehiclesScreen} />
      <Stack.Screen name="Appliances" component={AppliancesScreen} />
      <Stack.Screen name="Utilities" component={UtilitiesScreen} />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicleScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddAppliance"
        component={AddApplianceScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddUtility"
        component={AddUtilityScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="DocumentUpload"
        component={DocumentUploadScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="DocumentScanner"
        component={DocumentScannerScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Referrals" component={ReferralsScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="ImportantDates" component={ImportantDatesScreen} />
      <Stack.Screen
        name="AddImportantDate"
        component={AddImportantDateScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Checklists" component={ChecklistsScreen} />
      <Stack.Screen name="ChecklistDetail" component={ChecklistDetailScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen
        name="JoinHousehold"
        component={JoinHouseholdScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

const linking: import('@react-navigation/native').LinkingOptions<any> = {
  prefixes: ['evi://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Signup: 'refer/:referralCode',
        },
      },
      Onboarding: {
        screens: {
          JoinHousehold: 'join/:code',
        },
      },
      Main: {
        screens: {
          Members: 'members',
        },
      },
    },
  },
};

export default function AppNavigator() {
  const { firebaseUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!firebaseUser ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !userProfile?.onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : (
          <Stack.Screen name="Main" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
