import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { AnalysisResult } from "../types/analysis";
import { regenerateChart as apiRegenerateChart } from "../services/api";
import { useAppTheme } from "../services/ThemeContext";

interface AnalysisResultsCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResultsCard: React.FC<AnalysisResultsCardProps> = ({
  result,
  onReset,
}) => {
  const screenWidth = Dimensions.get("window").width - 32;
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  // Local state for the dynamic comparison graph and updating state
  const [graphUri, setGraphUri] = useState<string | null>(result.comparison_graph || null);
  const [isUpdatingGraph, setIsUpdatingGraph] = useState(false);

  // States for interactive overall graph label inputs (empty initially to let user enter)
  const [customTitle, setCustomTitle] = useState("");
  const [customXLabel, setCustomXLabel] = useState("");
  const [customYLabel, setCustomYLabel] = useState("");

  // States for interactive individual parameter and category names mapping
  const [customParamNames, setCustomParamNames] = useState<Record<string, string>>({});
  const [customGroupNames, setCustomGroupNames] = useState<Record<string, string>>({});

  // Determine if we should show the Group column
  const showGroupColumn = result.groups && result.groups.length > 1 && result.group_col !== "Group";

  // Initialize custom labels and mapping dictionaries when results load
  useEffect(() => {
    setGraphUri(result.comparison_graph || null);
    setCustomTitle("");
    setCustomXLabel("");
    setCustomYLabel("");

    // Initialize parameter mapping (empty by default so user can enter custom values)
    const pNames: Record<string, string> = {};
    setCustomParamNames(pNames);

    // Initialize group mapping (empty by default so user can enter custom values)
    const gNames: Record<string, string> = {};
    setCustomGroupNames(gNames);
  }, [result]);

  const handleParamNameChange = (originalName: string, newName: string) => {
    setCustomParamNames(prev => ({
      ...prev,
      [originalName]: newName
    }));
  };

  const handleGroupNameChange = (originalName: string, newName: string) => {
    setCustomGroupNames(prev => ({
      ...prev,
      [originalName]: newName
    }));
  };

  const handleUpdateGraphLabels = async () => {
    if (!result.groups || !result.parameters || !result.comparison_stats) {
      Alert.alert("Error", "Missing dataset metrics for customization.");
      return;
    }

    setIsUpdatingGraph(true);
    try {
      // Map parameters and groups to their customized display names
      const mappedGroups = result.groups.map(g => customGroupNames[g] || g);
      const mappedParameters = result.parameters.map(p => customParamNames[p] || p);

      // Re-map the nested comparison stats to use customized names
      const mappedStats: Record<string, Record<string, any>> = {};
      result.groups.forEach(g => {
        const customG = customGroupNames[g] || g;
        mappedStats[customG] = {};
        result.parameters!.forEach(p => {
          const customP = customParamNames[p] || p;
          mappedStats[customG][customP] = result.comparison_stats![g]?.[p] || null;
        });
      });

      console.log("[AnalysisResultsCard] Requesting chart regeneration with customized tick names:", {
        title: customTitle,
        xlabel: customXLabel,
        ylabel: customYLabel,
        mappedGroups,
        mappedParameters,
      });

      const response = await apiRegenerateChart({
        groups: mappedGroups,
        parameters: mappedParameters,
        comparison_stats: mappedStats,
        group_col: result.group_col || "Group",
        title: customTitle.trim() || (result.groups && result.groups.length > 1 && result.group_col !== "Group" ? `Comparison across Parameters (by ${result.group_col})` : "Comparison across Parameters"),
        xlabel: customXLabel.trim() || "Parameters",
        ylabel: customYLabel.trim() || "Value",
      });

      if (response && response.comparison_graph) {
        setGraphUri(response.comparison_graph);
        Alert.alert("Success", "Graph labels and axis ticks updated successfully!");
      } else {
        throw new Error("Failed to receive regenerated graph from backend.");
      }
    } catch (err: any) {
      console.error("[AnalysisResultsCard] Update graph labels failed:", err);
      Alert.alert("Update Failed", `Could not update graph: ${err.message}`);
    } finally {
      setIsUpdatingGraph(false);
    }
  };

  const handleDownloadTable = async () => {
    try {
      console.log("[AnalysisResultsCard] Exporting table as CSV...");
      
      // Generate CSV header based on whether group column is displayed
      let csvContent = showGroupColumn
        ? "Parameter,Group,N,Mean,Std Dev,Std Error Dev\n"
        : "Parameter,N,Mean,Std Dev,Std Error Dev\n";
      
      if (result.parameters && result.groups && result.comparison_stats) {
        result.parameters.forEach((param) => {
          result.groups!.forEach((group) => {
            const stats = result.comparison_stats![group]?.[param];
            if (stats) {
              const meanVal = stats.mean !== null ? stats.mean.toFixed(4) : "N/A";
              const stdVal = stats.std !== null ? stats.std.toFixed(4) : "N/A";
              const semVal = stats.sem !== null ? stats.sem.toFixed(4) : "N/A";
              
              const customParam = customParamNames[param] || param;
              const customGroup = customGroupNames[group] || group;

              if (showGroupColumn) {
                csvContent += `"${customParam}","${customGroup}",${stats.n},${meanVal},${stdVal},${semVal}\n`;
              } else {
                csvContent += `"${customParam}",${stats.n},${meanVal},${stdVal},${semVal}\n`;
              }
            }
          });
        });
      }

      const cleanTitle = (result.file_name || "analysis").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      
      if (Platform.OS === "web") {
        // Web CSV Download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${cleanTitle}_comparison_table.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("[AnalysisResultsCard] Web CSV download successful");
        return;
      }
      
      // Native (iOS/Android) download using expo-file-system/legacy
      const filename = `${FileSystem.documentDirectory}${cleanTitle}_comparison_table.csv`;
      
      await FileSystem.writeAsStringAsync(filename, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(filename, {
          mimeType: "text/csv",
          dialogTitle: `Download Table`,
          UTI: "public.comma-separated-values-text", // for iOS
        });
        console.log("[AnalysisResultsCard] Sharing dialog opened for CSV");
      } else {
        Alert.alert("Download Failed", "Sharing is not available on this device.");
      }
    } catch (err: any) {
      console.error("[AnalysisResultsCard] Error exporting CSV:", err);
      Alert.alert("Export Failed", `Could not export CSV: ${err.message}`);
    }
  };

  const handleDownloadGraph = async () => {
    if (!graphUri) {
      Alert.alert("Error", "No comparative graph available.");
      return;
    }
    
    try {
      console.log("[AnalysisResultsCard] Exporting comparative graph...");
      
      const base64Data = graphUri.replace(/^data:image\/\w+;base64,/, "");
      const cleanTitle = (result.file_name || "analysis").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = graphUri;
        link.download = `${cleanTitle}_comparison_chart.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("[AnalysisResultsCard] Web graph download successful");
        return;
      }
      
      const filename = `${FileSystem.documentDirectory}${cleanTitle}_comparison_chart.png`;
      
      await FileSystem.writeAsStringAsync(filename, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(filename, {
          mimeType: "image/png",
          dialogTitle: `Download Graph`,
          UTI: "public.png",
        });
        console.log("[AnalysisResultsCard] Sharing dialog opened for graph");
      } else {
        Alert.alert("Download Failed", "Sharing is not available on this device.");
      }
    } catch (err: any) {
      console.error("[AnalysisResultsCard] Error exporting graph:", err);
      Alert.alert("Export Failed", `Could not save graph: ${err.message}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.card }]}>
        <View style={styles.fileInfo}>
          <MaterialCommunityIcons
            name="file-document"
            size={24}
            color="#6C3EF4"
          />
          <Text style={[styles.fileName, { color: themeColors.text }]} numberOfLines={1}>
            {result.file_name}
          </Text>
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.resetButtonText}>New File</Text>
        </TouchableOpacity>
      </View>

      {/* Action Download Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDownloadTable} activeOpacity={0.8}>
          <MaterialCommunityIcons name="table-arrow-down" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Download Table (CSV)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDownloadGraph} activeOpacity={0.8}>
          <MaterialCommunityIcons name="download" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Download Graph (PNG)</Text>
        </TouchableOpacity>
      </View>

      {/* Comparison Table Section */}
      <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calculator" size={20} color="#6C3EF4" />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Precision Comparative Statistics</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.table, { borderColor: themeColors.border }]}>
            {/* Table Header */}
            <View style={[styles.tableHeaderRow, { backgroundColor: isDark ? "#24242B" : "#F3F1FF", borderBottomColor: themeColors.border }]}>
              <Text style={[styles.tableHeaderCell, { width: 120, color: isDark ? "#818CF8" : "#4F46E5" }]}>Parameter</Text>
              {showGroupColumn && (
                <Text style={[styles.tableHeaderCell, { width: 90, color: isDark ? "#818CF8" : "#4F46E5" }]}>{result.group_col || "Group"}</Text>
              )}
              <Text style={[styles.tableHeaderCell, { width: 60, textAlign: "right", color: isDark ? "#818CF8" : "#4F46E5" }]}>N</Text>
              <Text style={[styles.tableHeaderCell, { width: 100, textAlign: "right", color: isDark ? "#818CF8" : "#4F46E5" }]}>Mean</Text>
              <Text style={[styles.tableHeaderCell, { width: 100, textAlign: "right", color: isDark ? "#818CF8" : "#4F46E5" }]}>Std Dev</Text>
              <Text style={[styles.tableHeaderCell, { width: 110, textAlign: "right", color: isDark ? "#818CF8" : "#4F46E5" }]}>Std Error Dev</Text>
            </View>

            {/* Table Rows */}
            {result.parameters && result.groups && result.comparison_stats ? (
              result.parameters.map((param, paramIdx) => 
                result.groups!.map((group, groupIdx) => {
                  const stats = result.comparison_stats![group]?.[param];
                  if (!stats) return null;
                  
                  const isLast = paramIdx === result.parameters!.length - 1 && groupIdx === result.groups!.length - 1;
                  
                  return (
                    <View key={`${param}-${group}`} style={[styles.tableRow, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }, isLast && { borderBottomWidth: 0 }]}>
                      <Text style={[styles.tableCell, styles.boldCell, { color: themeColors.title, width: 120 }]}>
                        {groupIdx === 0 ? (customParamNames[param] || param) : ""}
                      </Text>
                      {showGroupColumn && (
                        <Text style={[styles.tableCell, { color: themeColors.text, width: 90 }]}>{customGroupNames[group] || group}</Text>
                      )}
                      <Text style={[styles.tableCell, { color: themeColors.text, width: 60, textAlign: "right" }]}>{stats.n}</Text>
                      <Text style={[styles.tableCell, styles.numericCell, { color: themeColors.subText, width: 100, textAlign: "right" }]}>
                        {stats.mean !== null ? stats.mean.toFixed(4) : "N/A"}
                      </Text>
                      <Text style={[styles.tableCell, styles.numericCell, { color: themeColors.subText, width: 100, textAlign: "right" }]}>
                        {stats.std !== null ? stats.std.toFixed(4) : "N/A"}
                      </Text>
                      <Text style={[styles.tableCell, styles.numericCell, { color: themeColors.subText, width: 110, textAlign: "right" }]}>
                        {stats.sem !== null ? stats.sem.toFixed(4) : "N/A"}
                      </Text>
                    </View>
                  );
                })
              )
            ) : (
              <Text style={[styles.noDataText, { color: themeColors.subText }]}>No comparison statistics available</Text>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Comparison Graph Section */}
      {graphUri && (
        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color="#6C3EF4" />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Comparative Visualization</Text>
          </View>
          
          <Image
            source={{ uri: graphUri }}
            style={[styles.graphImage, { width: screenWidth - 32, backgroundColor: isDark ? "#24242B" : "#F9FAFB" }]}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Interactive Labels Customization Section */}
      <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="pencil-box-outline" size={20} color="#6C3EF4" />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Customize Graph & Axis Labels</Text>
        </View>

        {/* 1. Overall Graph and Axis Titles */}
        <View style={styles.subSectionContainer}>
          <Text style={[styles.subSectionTitle, { color: themeColors.primary }]}>Overall Graph Titles</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Graph Title</Text>
            <TextInput
              style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="e.g. Performance Comparison"
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.subText }]}>X-Axis Label (Horizontal)</Text>
              <TextInput
                style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
                value={customXLabel}
                onChangeText={setCustomXLabel}
                placeholder="e.g. Parameters"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Y-Axis Label (Vertical)</Text>
              <TextInput
                style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
                value={customYLabel}
                onChangeText={setCustomYLabel}
                placeholder="e.g. Value"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>

        {/* 2. Custom Rename Ticks (Parameter & Group Names) */}
        <View style={[styles.subSectionContainer, { borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 14 }]}>
          <Text style={[styles.subSectionTitle, { color: themeColors.primary }]}>Rename Parameters & Groups (Axes Ticks)</Text>
          
          {/* Rename Groups if visible */}
          {result.groups && result.groups.length > 0 && result.group_col !== "Group" && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.groupHeaderLabel, { color: themeColors.text }]}>Categories / Groups ({result.group_col}):</Text>
              {result.groups.map(g => (
                <View key={`edit-group-${g}`} style={styles.renameRow}>
                  <Text style={[styles.renameOrigLabel, { color: themeColors.subText }]} numberOfLines={1}>{g}</Text>
                  <IoniconsIcon name="arrow-forward" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} style={{ marginHorizontal: 8 }} />
                  <TextInput
                    style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }, { flex: 1, paddingVertical: 6 }]}
                    value={customGroupNames[g] || ""}
                    onChangeText={(val) => handleGroupNameChange(g, val)}
                    placeholder={`Rename ${g}`}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Rename Numeric Parameters */}
          {result.parameters && result.parameters.length > 0 && (
            <View>
              <Text style={[styles.groupHeaderLabel, { color: themeColors.text }]}>Numerical Parameters (Ticks):</Text>
              {result.parameters.map(p => (
                <View key={`edit-param-${p}`} style={styles.renameRow}>
                  <Text style={[styles.renameOrigLabel, { color: themeColors.subText }]} numberOfLines={1}>{p}</Text>
                  <IoniconsIcon name="arrow-forward" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} style={{ marginHorizontal: 8 }} />
                  <TextInput
                    style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }, { flex: 1, paddingVertical: 6 }]}
                    value={customParamNames[p] || ""}
                    onChangeText={(val) => handleParamNameChange(p, val)}
                    placeholder={`Rename ${p}`}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.updateButton, isUpdatingGraph && styles.buttonDisabled]}
          onPress={handleUpdateGraphLabels}
          disabled={isUpdatingGraph}
          activeOpacity={0.8}
        >
          {isUpdatingGraph ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={18} color="#fff" />
              <Text style={styles.updateButtonText}>Update Graph Labels</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Simple icon component wrapper helper to avoid importing whole Ionicons package
const IoniconsIcon = ({ name, size, color, style }: { name: string; size: number; color: string; style?: any }) => {
  return <MaterialCommunityIcons name={name === "arrow-forward" ? "arrow-right" : "circle" as any} size={size} color={color} style={style} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  fileName: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },

  resetButton: {
    backgroundColor: "#6C3EF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  resetButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 13,
  },

  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6C3EF4",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  section: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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

  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F3F1FF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  tableCell: {
    fontSize: 12,
    color: "#374151",
  },

  boldCell: {
    fontWeight: "700",
    color: "#111827",
  },

  numericCell: {
    color: "#4B5563",
    fontWeight: "500",
  },

  noDataText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    padding: 16,
    textAlign: "center",
  },

  graphImage: {
    height: 350,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },

  subSectionContainer: {
    marginBottom: 14,
  },

  subSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6C3EF4",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },

  textInput: {
    borderWidth: 1.5,
    borderColor: "#6C3EF4", // Premium primary color for clear visibility
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },

  inputRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

  groupHeaderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginTop: 4,
  },

  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  renameOrigLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    width: 100,
  },

  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981", // Emerald green for confirmation action
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },

  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },

  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default AnalysisResultsCard;
