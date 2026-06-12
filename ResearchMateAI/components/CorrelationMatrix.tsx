import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AnalysisResult } from "../types/analysis";
import { useAppTheme } from "../services/ThemeContext";

interface CorrelationMatrixProps {
  result: AnalysisResult;
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ result }) => {
  const { correlation, numeric_columns } = result;
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  if (
    !correlation ||
    !Array.isArray(correlation.columns) ||
    !Array.isArray(correlation.matrix) ||
    correlation.columns.length < 2
  ) {
    return (
      <View style={[styles.noDataContainer, { backgroundColor: themeColors.background }]}>
        <MaterialCommunityIcons
          name="information-outline"
          size={40}
          color="#6C3EF4"
        />
        <Text style={[styles.noDataText, { color: themeColors.subText }]}>
          Need at least 2 numeric columns for correlation analysis
        </Text>
      </View>
    );
  }

  const { columns, matrix } = correlation;
  const size = columns.length;

  // Get color based on correlation value
  const getCorrelationColor = (value: number): string => {
    if (value === 1) return "#6C3EF4"; // Perfect positive correlation
    if (value > 0.7) return "#7C3AED";
    if (value > 0.4) return "#A78BFA";
    if (value > 0) return isDark ? "#2E2A4A" : "#DDD6FE";
    if (value === 0) return isDark ? "#24242B" : "#F3F1FF";
    if (value > -0.4) return "#FED7AA";
    if (value > -0.7) return "#FB923C";
    if (value > -0.9) return "#F97316";
    return "#DC2626"; // Strong negative correlation
  };

  const getCorrelationTextColor = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue > 0.5) return "#FFFFFF";
    return isDark ? "#F3F4F6" : "#111827";
  };

  const getCorrelationInterpretation = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue > 0.9) return "Very Strong";
    if (absValue > 0.7) return "Strong";
    if (absValue > 0.5) return "Moderate";
    if (absValue > 0.3) return "Weak";
    return "Very Weak";
  };

  // Find strongest correlations
  const correlationPairs: Array<{
    col1: string;
    col2: string;
    value: number;
  }> = [];

  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      correlationPairs.push({
        col1: columns[i],
        col2: columns[j],
        value: matrix[i]?.[j] ?? 0,
      });
    }
  }

  correlationPairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const topCorrelations = correlationPairs.slice(0, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Heatmap */}
      <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="table-large" size={20} color="#6C3EF4" />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Correlation Matrix</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.heatmapContainer}
        >
          <View>
            {/* Column Headers */}
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, { backgroundColor: isDark ? "#24242B" : "#F3F1FF", borderRightColor: themeColors.border }]}>
                <Text style={styles.headerText}></Text>
              </View>
              {columns.map((col: string, idx: number) => (
                <View
                  key={idx}
                  style={[styles.headerCell, { backgroundColor: isDark ? "#24242B" : "#F3F1FF", borderRightColor: themeColors.border }]}
                >
                  <Text style={[styles.headerText, { color: themeColors.primary }]}>
                    {col.substring(0, 8)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Matrix Rows */}
            {matrix.map((row: number[], rowIdx: number) => (
              <View key={rowIdx} style={styles.matrixRow}>
                <View
                  style={[
                    styles.cell,
                    styles.rowHeader,
                    { backgroundColor: isDark ? "#24242B" : "#F3F1FF", borderRightColor: themeColors.border, borderBottomColor: themeColors.border }
                  ]}
                >
                  <Text style={[styles.rowHeaderText, { color: themeColors.primary }]}>
                    {columns[rowIdx].substring(0, 8)}
                  </Text>
                </View>
                {row.map((value: number, colIdx: number) => (
                  <View
                    key={colIdx}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: getCorrelationColor(value),
                        borderRightColor: themeColors.border,
                        borderBottomColor: themeColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.cellText, { color: getCorrelationTextColor(value) }]}>
                      {(Number(value) || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={[styles.legend, { borderTopColor: themeColors.border }]}>
          <Text style={[styles.legendTitle, { color: themeColors.text }]}>Correlation Scale</Text>
          <View style={styles.legendGradient}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: "#DC2626" },
                ]}
              />
              <Text style={[styles.legendLabel, { color: themeColors.subText }]}>-1.0 (Negative)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: isDark ? "#24242B" : "#F3F1FF" },
                ]}
              />
              <Text style={[styles.legendLabel, { color: themeColors.subText }]}>0.0 (None)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: "#6C3EF4" },
                ]}
              />
              <Text style={[styles.legendLabel, { color: themeColors.subText }]}>1.0 (Positive)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Top Correlations */}
      <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="trending-up"
            size={20}
            color="#6C3EF4"
          />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Strongest Correlations</Text>
        </View>

        {topCorrelations.map((pair, idx) => (
          <View key={idx} style={[styles.correlationCard, { backgroundColor: isDark ? "#24242B" : "#F9FAFB", borderLeftColor: themeColors.primary }]}>
            <View style={styles.correlationHeader}>
              <Text style={[styles.correlationPair, { color: themeColors.text }]}>
                {pair.col1} ↔ {pair.col2}
              </Text>
              <View
                style={[
                  styles.correlationBadge,
                  {
                    backgroundColor:
                      pair.value > 0 ? (isDark ? "#1B4332" : "#D1FAE5") : (isDark ? "#4A1E1E" : "#FEE2E2"),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.correlationValue,
                    {
                      color: pair.value > 0 ? (isDark ? "#52B788" : "#065F46") : (isDark ? "#F87171" : "#7F1D1D"),
                    },
                  ]}
                >
                  {pair.value.toFixed(3)}
                </Text>
              </View>
            </View>

            <Text style={[styles.correlationLabel, { color: themeColors.subText }]}>
              {getCorrelationInterpretation(pair.value)}{" "}
              {pair.value > 0 ? "Positive" : "Negative"} Correlation
            </Text>

            {/* Bar visualization */}
            <View style={[styles.correlationBar, { backgroundColor: themeColors.border }]}>
              <View
                style={[
                  styles.correlationBarFill,
                  {
                    width: `${Math.abs(pair.value) * 100}%`,
                    backgroundColor: getCorrelationColor(pair.value),
                  },
                ]}
              />
            </View>

            {/* Interpretation */}
            <View style={[styles.interpretationBox, { backgroundColor: isDark ? "#2A1F52" : "#EDE9FE" }]}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={16}
                color="#6C3EF4"
              />
              <Text style={[styles.interpretationText, { color: isDark ? "#E0D6FF" : "#4C1D95" }]}>
                {getInterpretation(pair.value)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Statistics */}
      <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="chart-box"
            size={20}
            color="#6C3EF4"
          />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Correlation Stats</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statsCard, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
            <Text style={[styles.statsLabel, { color: themeColors.subText }]}>Numeric Columns</Text>
            <Text style={[styles.statsValue, { color: themeColors.primary }]}>
              {Array.isArray(numeric_columns) ? numeric_columns.length : 0}
            </Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
            <Text style={[styles.statsLabel, { color: themeColors.subText }]}>Correlations</Text>
            <Text style={[styles.statsValue, { color: themeColors.primary }]}>
              {Math.round(
                (correlationPairs.length / (columns.length * columns.length)) *
                  100
              )}
              %
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const getInterpretation = (value: number): string => {
  const absValue = Math.abs(value);
  const direction = value > 0 ? "increases" : "decreases";

  if (absValue > 0.9)
    return `Variables have a very strong relationship where one variable ${direction} as the other does.`;
  if (absValue > 0.7)
    return `Variables show a strong relationship where one variable tends to ${direction} as the other does.`;
  if (absValue > 0.5)
    return `Variables show a moderate relationship and may be somewhat related.`;
  if (absValue > 0.3)
    return `Variables show a weak relationship with limited predictive power.`;
  return `Variables have very little to no linear relationship.`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },

  heatmapContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },

  headerRow: {
    flexDirection: "row",
  },

  headerCell: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F1FF",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },

  headerText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6C3EF4",
    textAlign: "center",
  },

  matrixRow: {
    flexDirection: "row",
  },

  cell: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  rowHeader: {
    backgroundColor: "#F3F1FF",
  },

  rowHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6C3EF4",
  },

  cellText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
  },

  legend: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  legendTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  legendGradient: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },

  legendLabel: {
    fontSize: 11,
    color: "#6B7280",
  },

  correlationCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6C3EF4",
  },

  correlationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  correlationPair: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },

  correlationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  correlationValue: {
    fontSize: 12,
    fontWeight: "bold",
  },

  correlationLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },

  correlationBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },

  correlationBarFill: {
    height: "100%",
  },

  interpretationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EDE9FE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },

  interpretationText: {
    fontSize: 11,
    color: "#4C1D95",
    flex: 1,
    lineHeight: 16,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },

  statsCard: {
    flex: 1,
    backgroundColor: "#F3F1FF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },

  statsLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },

  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6C3EF4",
  },

  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  noDataText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default CorrelationMatrix;
