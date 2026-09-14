import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../config/theme';

interface BadgeProps {
  label: string;
  backgroundColor: string;
  textColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  backgroundColor,
  textColor = COLORS.textWhite,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
    textTransform: 'uppercase',
  },
});
