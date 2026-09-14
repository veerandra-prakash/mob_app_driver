import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { RouteMapScreen } from '../screens/RouteMapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS, FONTS } from '../config/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 20);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.secondary, // Rich Forest Green
        },
        headerTintColor: COLORS.textWhite,
        headerTitleStyle: {
          fontWeight: FONTS.weight.bold,
          fontSize: FONTS.size.md,
        },
        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: FONTS.weight.bold,
          paddingBottom: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 4,
          paddingBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 4,
          elevation: 12,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'EcoCircle Driver',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18 }}>🚛</Text>
          ),
        }}
      />
      <Tab.Screen
        name="RouteTab"
        component={RouteMapScreen}
        options={{
          title: 'Route',
          headerTitle: 'Collection Route Map',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18 }}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'Driver & Vehicle Profile',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

