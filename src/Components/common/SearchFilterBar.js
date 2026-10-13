// src/Components/common/SearchFilterBar.js
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
  StyleSheet,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../constants';
import { m } from '../../Utils/responsive';

/**
 * Standard Search & Filter Pill Bar
 * Provides responsive text search and horizontal scrollable filter tabs.
 */
export default function SearchFilterBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  filters = [],
  activeFilter,
  onSelectFilter,
  style,
  containerStyle,
}) {
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Search Input Pill */}
      <View style={[styles.searchPill, style]}>
        <Feather
          name="search"
          size={m(18)}
          color={colors.lettersAndIcons}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#7E9D86"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {value ? (
          <TouchableOpacity
            onPress={() => onChangeText?.('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <Feather name="x" size={m(16)} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs (if provided) */}
      {filters.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          style={styles.filtersContainer}
        >
          {filters.map(filter => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => onSelectFilter?.(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: m(14),
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: m(24),
    height: m(46),
    paddingHorizontal: m(16),
  },
  searchIcon: {
    marginRight: m(10),
  },
  input: {
    flex: 1,
    fontSize: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  clearBtn: {
    padding: m(4),
  },
  filtersContainer: {
    marginTop: m(10),
  },
  filtersScroll: {
    paddingHorizontal: m(2),
    gap: m(8),
  },
  filterPill: {
    paddingHorizontal: m(14),
    paddingVertical: m(7),
    borderRadius: m(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.1)',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  filterTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});
