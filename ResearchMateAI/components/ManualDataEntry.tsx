import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ManualDataRequest } from "../types/analysis";
import { useAppTheme } from "../services/ThemeContext";

interface ManualDataEntryProps {
  onAnalyze: (data: ManualDataRequest) => Promise<void>;
  isLoading: boolean;
}

const ManualDataEntry: React.FC<ManualDataEntryProps> = ({
  onAnalyze,
  isLoading,
}) => {
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;
  const [columns, setColumns] = useState<string[]>(["Column 1", "Column 2"]);
  const [rows, setRows] = useState<(string | number | null)[][]>([
    ["", ""],
    ["", ""],
  ]);

  // UI state for premium active glows
  const [focusedColIdx, setFocusedColIdx] = useState<number | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  const addColumn = () => {
    if (columns.length < 10) {
      const newCol = `Column ${columns.length + 1}`;
      setColumns([...columns, newCol]);
      setRows(rows.map((row) => [...row, ""]));
    } else {
      Alert.alert("Limit Reached", "Maximum 10 columns allowed");
    }
  };

  const addRow = () => {
    if (rows.length < 100) {
      setRows([...rows, Array(columns.length).fill("")]);
    } else {
      Alert.alert("Limit Reached", "Maximum 100 rows allowed");
    }
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = columns.filter((_, i) => i !== index);
      const newRows = rows.map((row) =>
        row.filter((_, i) => i !== index)
      );
      setColumns(newColumns);
      setRows(newRows);
    } else {
      Alert.alert("Required", "You must have at least one column");
    }
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    } else {
      Alert.alert("Required", "You must have at least one row of data");
    }
  };

  const updateColumnName = (index: number, value: string) => {
    const newColumns = [...columns];
    newColumns[index] = value;
    setColumns(newColumns);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value === "" ? null : value;
    setRows(newRows);
  };

  const handleAnalyze = async () => {
    if (columns.length === 0 || rows.length === 0) {
      Alert.alert("Invalid Data", "Please enter column names and data rows");
      return;
    }

    const hasData = rows.some((row) =>
      row.some((cell) => cell !== null && cell !== "")
    );

    if (!hasData) {
      Alert.alert(
        "No Data",
        "Please enter some data in the table before analyzing"
      );
      return;
    }

    try {
      const cleanRows = rows.map((row) =>
        row.map((cell) => {
          if (cell === null || cell === "") return null;
          const cellText = String(cell).trim();
          const num = Number(cellText);
          return !Number.isNaN(num) && cellText !== "" ? num : cellText;
        })
      );

      await onAnalyze({
        column_names: columns,
        rows: cleanRows,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to analyze data. Please try again.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      {/* Premium Workspace Badge & Title */}
      <View style={styles.header}>
        <View style={[styles.workspaceBadge, isDark && { backgroundColor: "rgba(108, 62, 244, 0.2)", borderColor: "rgba(108, 62, 244, 0.4)" }]}>
          <MaterialCommunityIcons name="database-edit" size={14} color="#818CF8" />
          <Text style={[styles.workspaceBadgeText, { color: "#818CF8" }]}>DATASET WORKSPACE</Text>
        </View>
        
        <View style={styles.headerTextRow}>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Manual Data Entry</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.subText }]}>
              Input structured variables to generate immediate analytical reports
            </Text>
          </View>
          <View style={[styles.headerIconContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <MaterialCommunityIcons name="table-large" size={24} color="#6C3EF4" />
          </View>
        </View>
      </View>

      {/* Dataset Grid Card */}
      <View style={[styles.cardWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableContainer}
        >
          <View style={styles.tableWrapper}>
            {/* Column Header Row */}
            <View style={[styles.headerRow, { backgroundColor: isDark ? "#2E2E38" : "#F8FAFC", borderColor: themeColors.border }]}>
              <View style={styles.rowNumberCell}>
                <Text style={styles.rowNumberHeader}>#</Text>
              </View>
              {columns.map((col, idx) => {
                const isColFocused = focusedColIdx === idx;
                return (
                  <View 
                    key={idx} 
                    style={[
                      styles.headerCell,
                      isColFocused && styles.headerCellFocused,
                      { borderLeftColor: themeColors.border }
                    ]}
                  >
                    <TextInput
                      style={[styles.headerInput, { color: themeColors.text }]}
                      value={col}
                      onChangeText={(val) => updateColumnName(idx, val)}
                      placeholder={`Col ${idx + 1}`}
                      placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                      onFocus={() => setFocusedColIdx(idx)}
                      onBlur={() => setFocusedColIdx(null)}
                    />
                    <TouchableOpacity
                      style={styles.removeColumnBtn}
                      onPress={() => removeColumn(idx)}
                      activeOpacity={0.6}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={16}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
              
              <TouchableOpacity
                style={[styles.addColumnBtn, { borderLeftColor: themeColors.border }]}
                onPress={addColumn}
                disabled={columns.length >= 10}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={22}
                  color={isDark ? "#818CF8" : "#6C3EF4"}
                />
              </TouchableOpacity>
            </View>

            {/* Data Rows */}
            {rows.map((row, rowIdx) => (
              <View 
                key={rowIdx} 
                style={[
                  styles.dataRow,
                  { borderTopColor: themeColors.border },
                  rowIdx % 2 === 1 && (isDark ? { backgroundColor: "#24242B" } : styles.dataRowAlternate)
                ]}
              >
                <View style={styles.rowNumberCell}>
                  <Text style={styles.rowNumber}>{rowIdx + 1}</Text>
                </View>
                {row.map((cell, colIdx) => {
                  const isCellFocused = focusedCell?.row === rowIdx && focusedCell?.col === colIdx;
                  return (
                    <TextInput
                      key={colIdx}
                      style={[
                        styles.cell,
                        { color: themeColors.text, borderLeftColor: themeColors.border },
                        isCellFocused && styles.cellFocused
                      ]}
                      value={cell !== null && cell !== undefined ? String(cell) : ""}
                      onChangeText={(val) => updateCell(rowIdx, colIdx, val)}
                      placeholder="Enter value"
                      placeholderTextColor={isDark ? "#4B5563" : "#CBD5E1"}
                      onFocus={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                      onBlur={() => setFocusedCell(null)}
                    />
                  );
                })}
                <TouchableOpacity
                  style={[styles.removeRowBtn, { borderLeftColor: themeColors.border }]}
                  onPress={() => removeRow(rowIdx)}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Row Dotted Card Button */}
            <TouchableOpacity
              style={[styles.addRowBtn, isDark && { backgroundColor: "rgba(108, 62, 244, 0.05)", borderColor: "rgba(108, 62, 244, 0.4)" }]}
              onPress={addRow}
              disabled={rows.length >= 100}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={18} color={isDark ? "#818CF8" : "#6C3EF4"} />
              <Text style={[styles.addRowBtnText, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>Add Row</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Info Badge */}
      <View style={[styles.infoBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={[styles.infoIconWrapper, isDark && { backgroundColor: "rgba(108, 62, 244, 0.2)" }]}>
          <MaterialCommunityIcons
            name="chart-scatter-plot"
            size={16}
            color={isDark ? "#818CF8" : "#6C3EF4"}
          />
        </View>
        <Text style={[styles.infoText, { color: themeColors.subText }]}>
          Table Dimension: <Text style={[styles.infoHighlight, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>{rows.length} rows</Text> × <Text style={[styles.infoHighlight, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>{columns.length} columns</Text>
        </Text>
      </View>

      {/* Submit / Analyze Button */}
      <TouchableOpacity
        style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
        onPress={handleAnalyze}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.btnContent}>
            <MaterialCommunityIcons name="cube-outline" size={20} color="#fff" />
            <Text style={styles.analyzeButtonText}>Generate Analytics</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FAF9FF",
  },

  header: {
    marginBottom: 24,
    marginTop: 8,
  },

  workspaceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 62, 244, 0.08)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(108, 62, 244, 0.15)",
  },

  workspaceBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6C3EF4",
    marginLeft: 6,
    letterSpacing: 1,
  },

  headerTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titleContainer: {
    flex: 1,
    paddingRight: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },

  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  cardWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },

  tableContainer: {
    borderRadius: 14,
  },

  tableWrapper: {
    padding: 6,
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  rowNumberCell: {
    width: 40,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },

  rowNumberHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },

  rowNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },

  headerCell: {
    width: 120,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    position: "relative",
  },

  headerCellFocused: {
    backgroundColor: "rgba(108, 62, 244, 0.02)",
  },

  headerInput: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    paddingVertical: 4,
    paddingRight: 20,
    flex: 1,
  },

  removeColumnBtn: {
    position: "absolute",
    right: 4,
    padding: 4,
  },

  addColumnBtn: {
    width: 50,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
  },

  dataRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    height: 48,
    borderRadius: 8,
  },

  dataRowAlternate: {
    backgroundColor: "rgba(108, 62, 244, 0.015)",
  },

  cell: {
    width: 120,
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 13,
    fontWeight: "500",
    color: "#0F172A",
    borderLeftWidth: 1,
    borderLeftColor: "#F1F5F9",
    textAlignVertical: "center",
  },

  cellFocused: {
    borderWidth: 1,
    borderColor: "#6C3EF4",
    backgroundColor: "rgba(108, 62, 244, 0.02)",
    borderRadius: 6,
    color: "#0F172A",
    paddingVertical: 0,
  },

  removeRowBtn: {
    width: 50,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#F1F5F9",
  },

  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(108, 62, 244, 0.3)",
    backgroundColor: "rgba(108, 62, 244, 0.02)",
    borderRadius: 12,
  },

  addRowBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#6C3EF4",
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    alignSelf: "center",
  },

  infoIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(108, 62, 244, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  infoText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  infoHighlight: {
    color: "#6C3EF4",
    fontWeight: "700",
  },

  analyzeButton: {
    backgroundColor: "#6C3EF4",
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  analyzeButtonDisabled: {
    opacity: 0.6,
  },

  btnContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  analyzeButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

export default ManualDataEntry;
