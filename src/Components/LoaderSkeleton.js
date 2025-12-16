import React from 'react';
import {StyleSheet, View, Animated, Easing} from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // For shimmer effect

const LoaderSkeleton = () => {
  const animatedValue = new Animated.Value(0); // Initial value for the shimmer

  // Shimmer animation
  Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ).start();

  // Interpolation for numeric translation
  const interpolateAnimation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100], // Numeric values for translateX
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.skeletonWrapper}>
        <Animated.View
          style={[
            styles.shimmer,
            {transform: [{translateX: interpolateAnimation}]},
          ]}
        />
      </LinearGradient>

      {/* Skeleton for each loan item */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonText}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonTextSmall} />
            <View style={styles.skeletonTextSmall} />
          </View>
        </View>
        {/* <View style={styles.skeletonFooter} /> */}
      </View>

      <View style={styles.skeletonCard}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonText}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonTextSmall} />
            <View style={styles.skeletonTextSmall} />
          </View>
        </View>
        {/* <View style={styles.skeletonFooter} /> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingHorizontal: 15,
  },
  skeletonWrapper: {   
    marginBottom: 20,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  skeletonCard: {
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  skeletonImage: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 30,
    marginRight: 15,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonLabel: {
    backgroundColor: '#e0e0e0',
    width: '60%',
    height: 14,
    marginBottom: 5,
    borderRadius: 4,
  },
  skeletonTextSmall: {
    backgroundColor: '#e0e0e0',
    width: '40%',
    height: 12,
    marginBottom: 5,
    borderRadius: 4,
  },
  skeletonFooter: {
    marginTop: 10,
    backgroundColor: '#e0e0e0',
    height: 12,
    width: '40%',
    borderRadius: 4,
  },
});

export default LoaderSkeleton;
