import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AnalysisResult, Statistics } from "../types/analysis";
import { useAppTheme } from "../services/ThemeContext";

interface StatisticsSectionProps {
  result: AnalysisResult;
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ result }) => {
  const summary = result.summary || {
    total_rows: 0,
    total_columns: 0,
    numeric_columns: 0,
    categorical_columns: 0,
    total_missing: 0,
    memory_usage: "0 KB",
    missing_percentage: 0,
  };
  const statistics = result.statistics || {};
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const renderStatCard = (label: string, value: string | number, icon?: string) => (
    <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      {icon && (
        <MaterialCommunityIcons name={icon as any} size={24} color="#6C3EF4" />
      )}
      <Text style={[styles.statLabel, { color: themeColors.subText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: themeColors.primary }]}>{value}</Text>
    </View>
  );

  const renderColumnStats = (columnName: string, stats: Statistics) => {
    if (stats.error) {
      return (
        <View key={columnName} style={[styles.columnStatsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.columnName, { color: themeColors.text }]}>{columnName}</Text>
          <Text style={styles.errorText}>{stats.error}</Text>
        </View>
      );
    }

    if (stats.type === "numeric") {
      return (
        <View key={columnName} style={[styles.columnStatsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={[styles.columnHeader, { borderBottomColor: themeColors.border }]}>
            <View>
              <Text style={[styles.columnName, { color: themeColors.text }]}>{columnName}</Text>
              <Text style={[styles.columnType, { color: themeColors.subText }]}>Numeric</Text>
            </View>
            <MaterialCommunityIcons
              name="numeric"
              size={24}
              color="#6C3EF4"
            />
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Count</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>{stats.count}</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Missing</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>{stats.missing}</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Mean</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>
                {stats.mean?.toFixed(2) || "N/A"}
              </Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Median</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>
                {stats.median?.toFixed(2) || "N/A"}
              </Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Std Dev</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>
                {stats.std?.toFixed(2) || "N/A"}
              </Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Min</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>
                {stats.mean !== null && stats.min !== undefined && stats.min !== null ? stats.min.toFixed(2) : "N/A"}
              </Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Max</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>
                {stats.mean !== null && stats.max !== undefined && stats.max !== null ? stats.max.toFixed(2) : "N/A"}
              </Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Q1 (25%)</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>
                {stats.mean !== null && stats["25%"] !== undefined && stats["25%"] !== null ? stats["25%"].toFixed(2) : "N/A"}
              </Text>
            </View>
          </View>

          {stats.skewness !== undefined && (
            <View style={[styles.advancedStats, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.advancedLabel, { color: themeColors.text }]}>Advanced Statistics</Text>
              <View style={styles.advancedGrid}>
                <View style={[styles.advancedItem, { backgroundColor: isDark ? "#2A1F52" : "#EDE9FE" }]}>
                  <Text style={[styles.advancedItemLabel, { color: themeColors.subText }]}>Skewness</Text>
                  <Text style={[styles.advancedItemValue, { color: themeColors.primary }]}>
                    {stats.skewness?.toFixed(3) || "N/A"}
                  </Text>
                </View>
                <View style={[styles.advancedItem, { backgroundColor: isDark ? "#2A1F52" : "#EDE9FE" }]}>
                  <Text style={[styles.advancedItemLabel, { color: themeColors.subText }]}>Kurtosis</Text>
                  <Text style={[styles.advancedItemValue, { color: themeColors.primary }]}>
                    {stats.kurtosis?.toFixed(3) || "N/A"}
                  </Text>
                </View>
                <View style={[styles.advancedItem, { backgroundColor: isDark ? "#2A1F52" : "#EDE9FE" }]}>
                  <Text style={[styles.advancedItemLabel, { color: themeColors.subText }]}>Variance</Text>
                  <Text style={[styles.advancedItemValue, { color: themeColors.primary }]}>
                    {stats.variance?.toFixed(2) || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      );
    } else {
      // Categorical
      return (
        <View key={columnName} style={[styles.columnStatsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={[styles.columnHeader, { borderBottomColor: themeColors.border }]}>
            <View>
              <Text style={[styles.columnName, { color: themeColors.text }]}>{columnName}</Text>
              <Text style={[styles.columnType, { color: themeColors.subText }]}>Categorical</Text>
            </View>
            <MaterialCommunityIcons
              name="tag-multiple"
              size={24}
              color="#6C3EF4"
            />
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Count</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>{stats.count}</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Missing</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>{stats.missing}</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Unique Values</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>{stats.unique}</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
              <Text style={[styles.statGridLabel, { color: themeColors.subText }]}>Most Common</Text>
              <Text style={[styles.statGridValue, { color: themeColors.text }]}>
                {String(stats.most_common || "N/A").substring(0, 10)}
              </Text>
            </View>
          </View>

          {stats.value_counts && Object.keys(stats.value_counts).length > 0 && (
            <View style={[styles.valueCounts, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.valueCountsLabel, { color: themeColors.text }]}>Top Values</Text>
              {Object.entries(stats.value_counts)
                .slice(0, 5)
                .map(([value, count], idx) => (
                  <View key={idx} style={styles.valueCountRow}>
                    <Text style={[styles.valueCountName, { color: themeColors.text }]}>
                      {String(value).substring(0, 20)}
                    </Text>
                    <View style={[styles.valueCountBar, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
                      <View
                        style={[
                          styles.valueCountBarFill,
                          {
                            width: `${(count as number) * 20}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.valueCountValue, { color: themeColors.text }]}>{count}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      {/* Overall Summary */}
      <View style={styles.summarySection}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Dataset Summary</Text>
        <View style={styles.summaryGrid}>
          {renderStatCard("Total Rows", summary.total_rows, "table-large")}
          {renderStatCard(
            "Total Columns",
            summary.total_columns,
            "view-column"
          )}
          {renderStatCard(
            "Numeric",
            summary.numeric_columns,
            "numeric"
          )}
          {renderStatCard(
            "Categorical",
            summary.categorical_columns,
            "tag-multiple"
          )}
          {renderStatCard(
            "Missing",
            summary.total_missing,
            "alert-circle"
          )}
          {renderStatCard(
            "Memory",
            summary.memory_usage,
            "memory"
          )}
        </View>

        <View style={[styles.missingPercentage, { backgroundColor: isDark ? "#2D1D1D" : "#FEF2F2", borderLeftColor: "#DC2626" }]}>
          <Text style={[styles.missingPercentageLabel, { color: themeColors.text }]}>
            Missing Data: {summary.missing_percentage.toFixed(2)}%
          </Text>
          <View style={[styles.progressBar, { backgroundColor: isDark ? "#3D2D2D" : "#FEE2E2" }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(summary.missing_percentage, 100)}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Column Statistics */}
      <View style={styles.columnStatsSection}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Column Statistics</Text>
        {Object.entries(statistics).map(([columnName, stats]) =>
          renderColumnStats(columnName, stats)
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  summarySection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    width: (Dimensions.get("window").width - 40) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6C3EF4",
    marginTop: 4,
  },

  missingPercentage: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },

  missingPercentageLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  progressBar: {
    height: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#DC2626",
  },

  columnStatsSection: {
    marginBottom: 24,
  },

  columnStatsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  columnName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },

  columnType: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  statGridItem: {
    width: "32%",
    backgroundColor: "#F3F1FF",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },

  statGridLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },

  statGridValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },

  advancedStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  advancedLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },

  advancedGrid: {
    flexDirection: "row",
    gap: 8,
  },

  advancedItem: {
    flex: 1,
    backgroundColor: "#EDE9FE",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },

  advancedItemLabel: {
    fontSize: 11,
    color: "#6B7280",
  },

  advancedItemValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#6C3EF4",
    marginTop: 4,
  },

  valueCounts: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  valueCountsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },

  valueCountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  valueCountName: {
    fontSize: 12,
    color: "#111827",
    width: 60,
  },

  valueCountBar: {
    flex: 1,
    height: 20,
    backgroundColor: "#F3F1FF",
    borderRadius: 4,
    overflow: "hidden",
  },

  valueCountBarFill: {
    height: "100%",
    backgroundColor: "#6C3EF4",
  },

  valueCountValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    width: 40,
    textAlign: "right",
  },

  errorText: {
    fontSize: 13,
    color: "#DC2626",
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default StatisticsSection;
