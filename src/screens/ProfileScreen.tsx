import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '../hooks/useRoute';
import { LoadingView } from '../components/common/LoadingView';
import { Badge } from '../components/common/Badge';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { formatWeight } from '../utils/formatters';
import { getStatusColor, getStatusLabel } from '../utils/statusHelpers';

export const ProfileScreen: React.FC = () => {
  const { driver, truck, route, isLoading } = useRoute();

  if (isLoading || !driver || !truck || !route) {
    return <LoadingView message="Loading driver profile & vehicle specifications..." />;
  }

  const loadPercentage = Math.min(100, Math.round((truck.currentLoadKg / truck.capacityKg) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Profile Identity */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{driver.name.charAt(0)}</Text>
        </View>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.driverId}>ID: {driver.id} • {driver.licenseNumber}</Text>
        <View style={styles.zoneTag}>
          <Text style={styles.zoneText}>📞 {driver.phone}</Text>
        </View>
      </View>

      {/* Vehicle Spec Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Assigned Vehicle ({truck.truckId})</Text>
          <Badge label={truck.licensePlate} backgroundColor={COLORS.secondary} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Vehicle Model</Text>
          <Text style={styles.value}>{truck.model}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Max Capacity</Text>
          <Text style={styles.value}>{formatWeight(truck.capacityKg)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current Load Weight</Text>
          <Text style={[styles.value, { color: COLORS.primaryDark }]}>
            📦 {formatWeight(truck.currentLoadKg)} ({loadPercentage}%)
          </Text>
        </View>

        {/* Load Progress Bar */}
        <View style={styles.loadBarBackground}>
          <View style={[styles.loadBarFill, { width: `${loadPercentage}%` }]} />
        </View>
      </View>

      {/* Shift Overview Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shift Performance Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Duty Status</Text>
          <Text style={[styles.value, { color: driver.isOnDuty ? COLORS.primary : COLORS.textSecondary }]}>
            {driver.isOnDuty ? 'Active On-Duty' : 'Off-Duty'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Active Route</Text>
          <Text style={styles.value}>Route {route.routeNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Completed Stops</Text>
          <Text style={styles.value}>{route.completedStops} / {route.totalStops} Stops</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Route Status</Text>
          <Badge
            label={getStatusLabel(route.status as any)}
            backgroundColor={getStatusColor(route.status as any)}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textWhite,
  },
  driverName: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textPrimary,
  },
  driverId: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  zoneTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  zoneText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryDark,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  label: {
    fontSize: FONTS.size.sm,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textPrimary,
  },
  loadBarBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 4,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  loadBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});
