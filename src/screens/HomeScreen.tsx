import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../types/navigation';
import { useRoute } from '../hooks/useRoute';
import { ShiftToggle } from '../components/driver/ShiftToggle';
import { Badge } from '../components/common/Badge';
import { LoadingView } from '../components/common/LoadingView';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorView } from '../components/common/ErrorView';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { formatWeight, formatDistance } from '../utils/formatters';
import {
  getStatusColor,
  getStatusLabel,
  getWasteCategoryColor,
  getWasteCategoryLabel,
} from '../utils/statusHelpers';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const {
    driver,
    truck,
    route,
    truckLocation,
    currentStop,
    nextStop,
    isLoading,
    error,
    refresh,
    startRoute,
    collectStop,
    skipStop,
  } = useRoute();

  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // 1. Loading State
  if (isLoading && !route) {
    return <LoadingView message="Loading driver dashboard & route data..." />;
  }

  // 2. Error / Invalid Route Data State
  if (error && !route) {
    return (
      <ErrorView
        title="Failed to Load Route"
        message={error || 'Unable to communicate with local service layer.'}
        onRetry={refresh}
      />
    );
  }

  // 3. Empty Route State
  if (!route || route.stops.length === 0) {
    return (
      <View style={styles.container}>
        {driver && <ShiftToggle isOnDuty={driver.isOnDuty} onToggle={() => {}} driverName={driver.name} />}
        <EmptyState
          title="No Active Collection Route"
          subtitle="There are currently no assigned collection stops for Truck T1 today."
          icon="🚚"
          actionText="Refresh Schedule"
          onAction={refresh}
        />
      </View>
    );
  }

  const completedCount = route.completedStops;
  const remainingCount = Math.max(0, route.totalStops - completedCount);

  // Action Handler: Start Route with validation error handling
  const handleStartRoute = async () => {
    try {
      setIsProcessingAction(true);
      const updated = await startRoute();
      if (!updated) {
        Alert.alert('Action Failed', 'Unable to start collection route.');
      }
    } catch (err: any) {
      Alert.alert('Start Route Error', err?.message || 'Failed to start collection route.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Action Handler: Collect Stop with error handling
  const handleCollectStop = async (stopId: string) => {
    try {
      setIsProcessingAction(true);
      const updated = await collectStop(stopId);
      if (!updated) {
        Alert.alert('Action Failed', 'Could not record stop collection.');
      }
    } catch (err: any) {
      Alert.alert('Collection Error', err?.message || 'Failed to collect stop.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Action Handler: Skip Stop with confirmation dialog & error handling
  const handleSkipConfirm = (stopId: string, stopName: string) => {
    Alert.alert(
      'Confirm Skip Stop',
      `Are you sure you want to skip "${stopName}"?\n\nThis stop will be marked as SKIPPED and the route will advance to the next location.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessingAction(true);
              const updated = await skipStop(stopId, 'Driver skipped stop');
              if (!updated) {
                Alert.alert('Action Failed', 'Could not skip current stop.');
              }
            } catch (err: any) {
              Alert.alert('Skip Error', err?.message || 'Failed to skip stop.');
            } finally {
              setIsProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[COLORS.primary]} />
      }
    >
      {/* 1. Driver & Truck Header Bar */}
      {driver && truck && (
        <View style={styles.headerBar}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverWelcome}>DRIVER DASHBOARD</Text>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverSub}>
              ID: {driver.id} • {driver.licenseNumber}
            </Text>
          </View>

          <View style={styles.truckBadge}>
            <Text style={styles.truckLabel}>TRUCK ID</Text>
            <Text style={styles.truckIdText}>{truck.truckId}</Text>
            <Text style={styles.truckPlate}>{truck.licensePlate}</Text>
          </View>
        </View>
      )}

      {/* 2. Route Summary & GPS Location Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryTitle}>Route {route.routeNumber}</Text>
            <Text style={styles.summarySub}>District 4 Collection Sector</Text>
          </View>
          <Badge
            label={getStatusLabel(route.status as any)}
            backgroundColor={getStatusColor(route.status as any)}
          />
        </View>

        {/* Truck GPS Location */}
        {truckLocation && (
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>
              📍 GPS: {truckLocation.latitude.toFixed(4)}° N, {Math.abs(truckLocation.longitude).toFixed(4)}° W
            </Text>
            <Text style={styles.speedText}>⚡ {truckLocation.speedKmH || 0} km/h</Text>
          </View>
        )}

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{completedCount}</Text>
            <Text style={styles.metricLabel}>COMPLETED STOPS</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={[styles.metricNumber, { color: COLORS.statusInProgress }]}>
              {remainingCount}
            </Text>
            <Text style={styles.metricLabel}>REMAINING STOPS</Text>
          </View>
        </View>
      </View>

      {/* 4. Route Not Started State */}
      {route.status === 'NOT_STARTED' && (
        <View style={styles.notStartedContainer}>
          <Text style={styles.notStartedTitle}>Route Ready for Departure</Text>
          <Text style={styles.notStartedSub}>
            Tap below to begin collection sequence for Route {route.routeNumber}.
          </Text>
          <TouchableOpacity
            style={styles.startRouteButton}
            onPress={handleStartRoute}
            disabled={isProcessingAction}
            activeOpacity={0.8}
          >
            <Text style={styles.startRouteButtonText}>🚀 START COLLECTION ROUTE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Current Active Stop In Progress Card */}
      {route.status === 'IN_PROGRESS' && currentStop && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>CURRENT STOP IN PROGRESS</Text>
          <View style={styles.currentStopCard}>
            <View style={styles.stopSeqBadge}>
              <Text style={styles.stopSeqText}>Stop #{currentStop.sequence}</Text>
            </View>

            <Text style={styles.stopName}>{currentStop.householdName}</Text>
            <Text style={styles.stopAddress}>📍 {currentStop.address}</Text>

            <View style={styles.stopMetaRow}>
              <Badge
                label={getWasteCategoryLabel(currentStop.binCategory as any)}
                backgroundColor={getWasteCategoryColor(currentStop.binCategory as any)}
              />
              <Text style={styles.stopWeightText}>Weight: {currentStop.estimatedWeightKg} kg</Text>
            </View>

            {currentStop.accessNotes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>⚠️ {currentStop.accessNotes}</Text>
              </View>
            )}

            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={styles.collectButton}
                onPress={() => handleCollectStop(currentStop.id)}
                disabled={isProcessingAction}
                activeOpacity={0.8}
              >
                <Text style={styles.collectButtonText}>✓ MARK COLLECTED</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => handleSkipConfirm(currentStop.id, currentStop.householdName)}
                disabled={isProcessingAction}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>SKIP STOP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 6. Upcoming Next Stop Preview */}
      {route.status === 'IN_PROGRESS' && nextStop && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>UPCOMING NEXT STOP</Text>
          <View style={styles.nextStopCard}>
            <View style={styles.nextStopHeader}>
              <Text style={styles.nextStopSeq}>Stop #{nextStop.sequence}</Text>
              <Badge
                label={getWasteCategoryLabel(nextStop.binCategory as any)}
                backgroundColor={getWasteCategoryColor(nextStop.binCategory as any)}
              />
            </View>
            <Text style={styles.nextStopName}>{nextStop.householdName}</Text>
            <Text style={styles.nextStopAddress}>📍 {nextStop.address}</Text>
          </View>
        </View>
      )}

      {/* 7. Route Completed State Banner */}
      {route.status === 'COMPLETED' && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>Route Completed Successfully!</Text>
          <Text style={styles.completedSub}>
            All {route.totalStops} assigned waste stops collected or logged.
          </Text>
        </View>
      )}

      {/* 8. Navigate / View Route Button */}
      <TouchableOpacity
        style={styles.viewRouteButton}
        onPress={() => navigation.navigate('RouteTab')}
        activeOpacity={0.85}
      >
        <Text style={styles.viewRouteButtonText}>
          🗺️ NAVIGATE / VIEW FULL ROUTE ({route.totalStops} STOPS)
        </Text>
      </TouchableOpacity>
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
  headerBar: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  driverInfo: {
    flex: 1,
  },
  driverWelcome: {
    fontSize: 10,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryLight,
    letterSpacing: 1,
  },
  driverName: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textWhite,
    marginTop: 2,
  },
  driverSub: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  truckBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  truckLabel: {
    fontSize: 9,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textLight,
  },
  truckIdText: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primary,
  },
  truckPlate: {
    fontSize: 9,
    color: COLORS.textLight,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  summaryTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textPrimary,
  },
  summarySub: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationBox: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textPrimary,
  },
  speedText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryDark,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '60%',
    backgroundColor: COLORS.border,
  },
  notStartedContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notStartedTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notStartedSub: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  startRouteButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  startRouteButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  sectionContainer: {
    marginBottom: SPACING.md,
  },
  sectionHeaderTitle: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  currentStopCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  stopSeqBadge: {
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: SPACING.xs,
  },
  stopSeqText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryDark,
  },
  stopName: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textPrimary,
  },
  stopAddress: {
    fontSize: FONTS.size.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  stopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stopWeightText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.secondary,
  },
  notesBox: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  notesText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
    color: '#92400E',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  collectButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  collectButtonText: {
    color: COLORS.textWhite,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.sm,
  },
  skipButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.statusCancelled,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS.statusCancelled,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.xs,
  },
  nextStopCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nextStopSeq: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
  },
  nextStopName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textPrimary,
  },
  nextStopAddress: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  completedBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  completedEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  completedTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryDark,
  },
  completedSub: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewRouteButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  viewRouteButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
});
