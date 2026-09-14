import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { TabNavigator } from './TabNavigator';
import { PickupDetailsScreen } from '../screens/PickupDetailsScreen';
import { useTruckSimulator } from '../hooks/useTruckSimulator';
import { COLORS, FONTS } from '../config/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  // Activate isolated T1 movement simulator for local dev/demo
  useTruckSimulator(1500);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.secondary,
          },
          headerTintColor: COLORS.textWhite,
          headerTitleStyle: {
            fontWeight: FONTS.weight.bold,
            fontSize: FONTS.size.md,
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PickupDetails"
          component={PickupDetailsScreen}
          options={{
            title: 'Pickup Job Details',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
