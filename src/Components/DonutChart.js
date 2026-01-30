import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {G, Path, Circle, Text as SvgText} from 'react-native-svg';
import {m} from 'walstar-rn-responsive';

const toRadians = angle => (Math.PI / 180) * angle;

const createSlicePath = (cx, cy, radius, startAngle, endAngle) => {
  // Handle full circle (360 degrees / 2π radians)
  const angleDiff = endAngle - startAngle;
  const isFullCircle = Math.abs(angleDiff - Math.PI * 2) < 0.001 || Math.abs(angleDiff) >= Math.PI * 2;
  
  if (isFullCircle) {
    // For full circle, create two arcs
    const midAngle = startAngle + Math.PI;
    const mid = {
      x: cx + radius * Math.cos(midAngle),
      y: cy + radius * Math.sin(midAngle),
    };
    const start = {
      x: cx + radius * Math.cos(startAngle),
      y: cy + radius * Math.sin(startAngle),
    };
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 1 1 ${mid.x} ${mid.y}`,
      `A ${radius} ${radius} 0 1 1 ${start.x} ${start.y}`,
      'Z',
    ].join(' ');
  }

  const start = {
    x: cx + radius * Math.cos(startAngle),
    y: cy + radius * Math.sin(startAngle),
  };
  const end = {
    x: cx + radius * Math.cos(endAngle),
    y: cy + radius * Math.sin(endAngle),
  };

  const largeArcFlag = angleDiff <= Math.PI ? 0 : 1;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

const DonutChart = ({
  data,
  radius = m(70),
  innerRadius = m(45),
  strokeWidth = 0,
  backgroundColor = '#ffffff',
  centerLabel,
  centerSubLabel,
}) => {
  const total = useMemo(
    () => data.reduce((sum, item) => sum + (item.value || 0), 0),
    [data],
  );

  const size = radius * 2;
  const center = {x: radius, y: radius};

  const slices = useMemo(() => {
    if (!total || !data || data.length === 0) {
      return [];
    }

    let startAngle = toRadians(-90);

    return data
      .filter(item => item.value > 0)
      .map(item => {
        const angle = (item.value / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const path = createSlicePath(
          center.x,
          center.y,
          radius,
          startAngle,
          endAngle,
        );
        const slice = {
          path,
          color: item.color,
          label: item.label,
        };
        startAngle = endAngle;
        return slice;
      });
  }, [data, radius, total, center]);

  if (!total) {
    const emptyOuterRadius = radius;
    const emptyInnerRadius = radius - m(16);

    return (
      <View style={styles.emptyContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer solid circle */}
          <Circle
            cx={center.x}
            cy={center.y}
            r={emptyOuterRadius}
            fill="#e5e7eb"
          />
          {/* Inner cut-out to create donut */}
          <Circle
            cx={center.x}
            cy={center.y}
            r={emptyInnerRadius}
            fill="#ffffff"
          />
          <SvgText
            x={center.x}
            y={center.y}
            fill="#6b7280"
            fontSize={m(10)}
            fontFamily="Poppins-Regular"
            textAnchor="middle"
            alignmentBaseline="middle">
            No data
          </SvgText>
        </Svg>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {slices.length > 0 ? (
            slices.map((slice, index) => (
              <Path
                key={slice.label + index}
                d={slice.path}
                fill={slice.color}
                stroke={backgroundColor}
                strokeWidth={strokeWidth}
              />
            ))
          ) : (
            // Fallback: Show a full circle if no slices (shouldn't happen, but safety check)
            <Circle
              cx={center.x}
              cy={center.y}
              r={radius}
              fill="#e5e7eb"
            />
          )}
          {/* Inner circle to create donut effect */}
          <Circle
            cx={center.x}
            cy={center.y}
            r={innerRadius}
            fill={backgroundColor}
          />

          {centerLabel ? (
            <>
              <SvgText
                x={center.x}
                y={center.y - m(2)}
                fill="#111827"
                fontSize={m(13)}
                fontFamily="Montserrat-Bold"
                textAnchor="middle"
                alignmentBaseline="middle">
                {centerLabel}
              </SvgText>
              {centerSubLabel ? (
                <SvgText
                  x={center.x}
                  y={center.y + m(12)}
                  fill="#6b7280"
                  fontSize={m(9)}
                  fontFamily="Poppins-Regular"
                  textAnchor="middle"
                  alignmentBaseline="middle">
                  {centerSubLabel}
                </SvgText>
              ) : null}
            </>
          ) : null}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(8),
    width: '100%',
    minHeight: m(160),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(8),
    width: '100%',
    minHeight: m(160),
  },
});

export default DonutChart;