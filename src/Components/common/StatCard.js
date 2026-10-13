// src/Components/common/StatCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../constants';
import { m } from '../../Utils/responsive';

/**
 * Responsive Metric/Stat Card
 * Designed for 2-column KPI grids that scale consistently across small and large screens.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon = 'trending-up',
  iconColor = colors.lettersAndIcons,
  iconBg = colors.lightGreen,
  trend,
  trendPositive = true,
  onPress,
  style,
}) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={m(16)} color={iconColor} />
        </View>

        {trend ? (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trendPositive
                  ? colors.lightGreen
                  : '#FFEBEB',
              },
            ]}
          >
            <Feather
              name={trendPositive ? 'arrow-up-right' : 'arrow-down-right'}
              size={m(11)}
              color={trendPositive ? colors.lettersAndIcons : '#E02424'}
            />
            <Text
              style={[
                styles.trendText,
                { color: trendPositive ? colors.lettersAndIcons : '#E02424' },
              ]}
            >
              {trend}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value ?? '0'}
      </Text>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: m(3) },
    shadowOpacity: 0.06,
    shadowRadius: m(6),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  iconWrapper: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(6),
    paddingVertical: m(3),
    borderRadius: m(8),
    gap: m(3),
  },
  trendText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primarySemiBold,
  },
  value: {
    fontSize: m(20),
    lineHeight: m(26),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  subtitle: {
    fontSize: m(10.5),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    marginTop: m(2),
  },
});
