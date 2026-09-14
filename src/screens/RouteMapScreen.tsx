import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../types/navigation';
import { useRoute } from '../hooks/useRoute';
import { RouteMap } from '../components/map/RouteMap';
import { LoadingView } from '../components/common/LoadingView';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorView } from '../components/common/ErrorView';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { Badge } from '../components/common/Badge';
import {
  getStatusColor,
  getStatusLabel,
  getWasteCategoryColor,
  getWasteCategoryLabel,
} from '../utils/statusHelpers';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'RouteTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const RouteMapScreen: React.FC<Props> = ({ navigation }) => {
  const { route, truckLocation, currentStop, isLoading, error, refresh: refreshRoute } = useRoute();

  // 1. Loading State
  if (isLoading && !route) {
    return <LoadingView message="Loading collection route map..." />;
  }

  // 2. Error State
  if (error && !route) {
    return (
      <ErrorView
        title="Route Load Failed"
        message={error || 'Unable to load route data for map rendering.'}
        onRetry={refreshRoute}
      />
    );
  }

  // 3. Empty Route State
  if (!route || route.stops.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No Route Sequence Available"
          subtitle="There are no collection stops assigned to display on the map."
          icon="🗺️"
          actionText="Refresh Route"
          onAction={refreshRoute}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Route Info Top Banner */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Route {route.routeNumber}</Text>
          <Badge label={route.status} backgroundColor={COLORS.primary} />
        </View>
        <Text style={styles.subtitle}>
          Truck: {route.truckId} • Progress: {route.completedStops}/{route.totalStops} Stops ({route.totalDistanceKm} km)
        </Text>
      </View>

      {/* Map View Container */}
      <View style={styles.mapContainer}>
        <RouteMap
          route={route}
          truckLocation={truckLocation}
          stops={route.stops}
          currentStopId={currentStop?.id}
          onStopPress={(stop) => {
            navigation.navigate('PickupDetails', { pickupId: stop.id });
          }}
        />
      </View>

      {/* Ordered Collection Route Stops List */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Stop Progression Sequence</Text>
        <Text style={styles.listHeaderBadge}>{route.stops.length} Household Stops</Text>
      </View>

      <FlatList
        data={route.stops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refreshRoute}
        renderItem={({ item }) => {
          const isCurrent = currentStop?.id === item.id || item.status === 'IN_PROGRESS';
          return (
            <TouchableOpacity
              style={[styles.stopCard, isCurrent && styles.activeStopCard]}
              onPress={() => navigation.navigate('PickupDetails', { pickupId: item.id })}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.stopNumberCircle,
                  item.status === 'COLLECTED' && styles.stopCompletedCircle,
                  isCurrent && styles.stopActiveCircle,
                ]}
              >
                <Text
                  style={[
                    styles.stopNumber,
                    item.status === 'COLLECTED' && styles.stopCompletedText,
                    isCurrent && styles.stopActiveText,
                  ]}
                >
                  {item.status === 'COLLECTED' ? '✓' : item.sequence}
                </Text>
              </View>

              <View style={styles.stopDetails}>
                <View style={styles.stopHeader}>
                  <Text style={styles.householdName}>{item.householdName}</Text>
                  <Badge
                    label={getStatusLabel(item.status as any)}
                    backgroundColor={getStatusColor(item.status as any)}
                  />
                </View>

                <Text style={styles.address} numberOfLines={1}>
                  📍 {item.address}
                </Text>

                <View style={styles.stopFooter}>
                  <Badge
                    label={getWasteCategoryLabel(item.binCategory as any)}
                    backgroundColor={getWasteCategoryColor(item.binCategory as any)}
                  />
                  <Text style={styles.weightText}>{item.estimatedWeightKg} kg est.</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textWhite,
  },
  subtitle: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  mapContainer: {
    height: 260,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  listHeaderTitle: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  listHeaderBadge: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 10,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeStopCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  stopNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stopCompletedCircle: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  stopActiveCircle: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  stopNumber: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
  },
  stopCompletedText: {
    color: COLORS.primaryDark,
  },
  stopActiveText: {
    color: COLORS.textWhite,
  },
  stopDetails: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  householdName: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.xs,
  },
  address: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  stopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.secondary,
  },
});
