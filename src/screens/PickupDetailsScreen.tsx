import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { RouteStop } from '../types/routeModels';
import { routeRepository } from '../services/routeRepository';
import { Badge } from '../components/common/Badge';
import { LoadingView } from '../components/common/LoadingView';
import { COLORS, FONTS, SPACING } from '../config/theme';
import {
  getStatusColor,
  getStatusLabel,
  getWasteCategoryColor,
  getWasteCategoryLabel,
} from '../utils/statusHelpers';
import { formatWeight } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'PickupDetails'>;

export const PickupDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { pickupId } = route.params;
  const [stop, setStop] = useState<RouteStop | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const loadStopDetails = async () => {
    const data = await routeRepository.getRouteStopById(pickupId);
    if (data) setStop(data);
  };

  useEffect(() => {
    loadStopDetails();
    const unsubscribe = routeRepository.subscribe(() => {
      loadStopDetails();
    });
    return unsubscribe;
  }, [pickupId]);

  const handleCollect = async () => {
    if (!stop) return;
    try {
      setIsUpdating(true);
      await routeRepository.collectStop(stop.id);
      Alert.alert('Stop Collected', `Stop #${stop.sequence} marked as COLLECTED.`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Failed to mark stop as collected.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkipConfirm = () => {
    if (!stop) return;
    Alert.alert(
      'Confirm Skip Stop',
      `Are you sure you want to skip stop #${stop.sequence} (${stop.householdName})?\n\nThis will mark the stop as SKIPPED and advance to the next location.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await routeRepository.skipStop(stop.id, 'Skipped by driver');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Action Failed', err?.message || 'Failed to skip stop.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (!stop) {
    return <LoadingView message="Loading collection stop details..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Info Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.jobCode}>Stop #{stop.sequence}</Text>
          <Text style={styles.timeWindow}>{stop.householdName}</Text>
        </View>
        <Badge
          label={getStatusLabel(stop.status as any)}
          backgroundColor={getStatusColor(stop.status as any)}
        />
      </View>

      {/* Household / Customer Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Household Details</Text>
        <Text style={styles.infoName}>{stop.householdName}</Text>
        <Text style={styles.infoText}>ID: {stop.householdId}</Text>
      </View>

      {/* Collection Location Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Collection Location</Text>
        <Text style={styles.infoText}>📍 {stop.address}</Text>
        <Text style={styles.infoSubText}>
          Coordinates: {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
        </Text>
        {stop.accessNotes && (
          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>Access Note / Instructions:</Text>
            <Text style={styles.instructionText}>{stop.accessNotes}</Text>
          </View>
        )}
      </View>

      {/* Waste Breakdown Card */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Waste Category</Text>
          <Text style={styles.totalWeight}>Estimated: {formatWeight(stop.estimatedWeightKg)}</Text>
        </View>

        <View style={styles.wasteItemRow}>
          <Badge
            label={getWasteCategoryLabel(stop.binCategory as any)}
            backgroundColor={getWasteCategoryColor(stop.binCategory as any)}
          />
          <Text style={styles.itemWeight}>{formatWeight(stop.estimatedWeightKg)}</Text>
        </View>
      </View>

      {/* Stop Action Buttons */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Stop Actions</Text>
        {isUpdating ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <View style={styles.buttonGroup}>
            {stop.status !== 'COLLECTED' && stop.status !== 'SKIPPED' && (
              <>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: COLORS.primary }]}
                  onPress={handleCollect}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>✓ MARK COLLECTED</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: COLORS.statusCancelled }]}
                  onPress={handleSkipConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnOutlineText, { color: COLORS.statusCancelled }]}>
                    SKIP STOP
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {stop.status === 'COLLECTED' && (
              <View style={styles.completedBadgeBox}>
                <Text style={styles.completedBadgeText}>
                  ✓ STOP COLLECTED AT {stop.completedAt || 'Today'}
                </Text>
              </View>
            )}

            {stop.status === 'SKIPPED' && (
              <View style={styles.skippedBadgeBox}>
                <Text style={styles.skippedBadgeText}>⚠️ STOP SKIPPED</Text>
              </View>
            )}
          </View>
        )}
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
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobCode: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.secondary,
  },
  timeWindow: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  totalWeight: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryDark,
  },
  infoName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  infoSubText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
  },
  instructionBox: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: SPACING.sm,
    borderRadius: 6,
    marginTop: SPACING.sm,
  },
  instructionTitle: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
  },
  instructionText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  wasteItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  itemWeight: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    marginTop: SPACING.xs,
  },
  actionsTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  buttonGroup: {
    gap: SPACING.sm,
  },
  btn: {
    paddingVertical: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.textWhite,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.md,
  },
  btnOutline: {
    paddingVertical: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnOutlineText: {
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.sm,
  },
  completedBadgeBox: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  completedBadgeText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryDark,
  },
  skippedBadgeBox: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  skippedBadgeText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.statusCancelled,
  },
});
