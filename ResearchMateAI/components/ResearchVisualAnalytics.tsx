import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useAppTheme } from '../services/ThemeContext';

interface VisualAnalyticsProps {
  data: { year: string; count: number }[];
}

export default function ResearchVisualAnalytics({ data }: VisualAnalyticsProps) {
  const { themeColors } = useAppTheme();
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={{ color: themeColors.subText, textAlign: 'center' }}>Not enough data for analytics.</Text>
      </View>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const barWidth = 30;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Publication Trends</Text>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const height = (item.count / maxCount) * 150;
          return (
            <View key={index} style={styles.barWrapper}>
              <Text style={[styles.valueText, { color: themeColors.subText }]}>{item.count}</Text>
              <View style={[styles.bar, { height, backgroundColor: themeColors.primary, width: barWidth }]} />
              <Text style={[styles.label, { color: themeColors.subText }]}>{item.year}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingTop: 20,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 10,
  },
});
