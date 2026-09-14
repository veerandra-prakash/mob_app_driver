import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '../hooks/useRoute';
import { LoadingView } from '../components/common/LoadingView';
import { Badge } from '../components/common/Badge';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { formatWeight } from '../utils/formatters';
import { getStatusColor, getStatusLabel } from '../utils/statusHelpers';

export const ProfileScreen: React.FC = () => {
  const { driver, truck, route, isLoading, updateDriverProfile } = useRoute();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');

  useEffect(() => {
    if (driver && truck) {
      setName(driver.name);
      setPhone(driver.phone);
      setLicenseNumber(driver.licenseNumber);
      setVehicleModel(truck.model);
      setLicensePlate(truck.licensePlate);
    }
  }, [driver, truck]);

  if (isLoading || !driver || !truck || !route) {
    return <LoadingView message="Loading driver profile & vehicle specifications..." />;
  }

  const loadPercentage = Math.min(100, Math.round((truck.currentLoadKg / truck.capacityKg) * 100));

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Driver name cannot be empty.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Contact phone number cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      await updateDriverProfile(
        {
          name: name.trim(),
          phone: phone.trim(),
          licenseNumber: licenseNumber.trim(),
        },
        {
          model: vehicleModel.trim(),
          licensePlate: licensePlate.trim(),
        }
      );
      setIsEditing(false);
      Alert.alert('Profile Updated', 'Driver & vehicle profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Update Error', err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (driver && truck) {
      setName(driver.name);
      setPhone(driver.phone);
      setLicenseNumber(driver.licenseNumber);
      setVehicleModel(truck.model);
      setLicensePlate(truck.licensePlate);
    }
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Profile Identity */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{driver.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.driverId}>
          ID: {driver.id} • {driver.licenseNumber}
        </Text>
        <View style={styles.zoneTag}>
          <Text style={styles.zoneText}>📞 {driver.phone}</Text>
        </View>

        {!isEditing && (
          <TouchableOpacity
            style={styles.editHeaderButton}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.editHeaderButtonText}>✏️ EDIT PROFILE</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Edit Form Section */}
      {isEditing ? (
        <View style={styles.editFormCard}>
          <Text style={styles.formTitle}>Edit Driver & Vehicle Profile</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Driver Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter driver name"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Driving License Number</Text>
            <TextInput
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Enter license number"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Vehicle Model</Text>
            <TextInput
              style={styles.input}
              value={vehicleModel}
              onChangeText={setVehicleModel}
              placeholder="Enter vehicle model"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Vehicle License Plate</Text>
            <TextInput
              style={styles.input}
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder="Enter license plate"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.formButtonRow}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>💾 SAVE PROFILE CHANGES</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
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
              <Text style={styles.value}>
                {route.completedStops} / {route.totalStops} Stops
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Route Status</Text>
              <Badge
                label={getStatusLabel(route.status as any)}
                backgroundColor={getStatusColor(route.status as any)}
              />
            </View>
          </View>
        </>
      )}
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
  editHeaderButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 10,
  },
  editHeaderButtonText: {
    color: COLORS.textWhite,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.xs,
  },
  editFormCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  formTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.primaryDark,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  fieldGroup: {
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.size.sm,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formButtonRow: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textWhite,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.xs,
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
