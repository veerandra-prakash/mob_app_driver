import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../config/theme';

interface ShiftToggleProps {
  isOnDuty: boolean;
  onToggle: () => void;
  driverName: string;
}

export const ShiftToggle: React.FC<ShiftToggleProps> = ({
  isOnDuty,
  onToggle,
  driverName,
}) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.driverName}>{driverName}</Text>
      </View>
      <View style={styles.toggleGroup}>
        <Text style={[styles.statusText, { color: isOnDuty ? COLORS.primary : COLORS.textSecondary }]}>
          {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
        </Text>
        <Switch
          value={isOnDuty}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={isOnDuty ? COLORS.primary : COLORS.textSecondary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  driverName: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textWhite,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    marginRight: 4,
  },
});
