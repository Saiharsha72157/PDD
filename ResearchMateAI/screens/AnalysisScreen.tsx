// screens/AnalysisScreen.tsx

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Import real API layers and components
import { 
  uploadCSV as apiUploadCSV, 
  analyzeManualData as apiAnalyzeManualData, 
  regenerateChart as apiRegenerateChart,
  handleApiError 
} from "../services/api";
import AnalysisResultsCard from "../components/AnalysisResultsCard";
import ManualDataEntry from "../components/ManualDataEntry";
import type { AnalysisResult, ManualDataRequest } from "../types/analysis";
import { useTranslation } from "../services/localization";

import { useAppTheme } from "../services/ThemeContext";

export default function AnalysisScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [analysisMode, setAnalysisMode] = useState<"upload" | "manual">("upload");

  // Pre-analysis graph labels configuration overlay states
  const [pendingAnalysisResult, setPendingAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTitle, setConfigTitle] = useState("");
  const [configXLabel, setConfigXLabel] = useState("");
  const [configYLabel, setConfigYLabel] = useState("");

  const handleReset = () => {
    setFileName("");
    setAnalysisResult(null);
    setPendingAnalysisResult(null);
    setError("");
  };

  const uploadCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

      if (result.canceled) {
        console.log("[AnalysisScreen] File selection cancelled");
        return;
      }

      const selectedFile = result.assets[0];
      
      // Validate that it is a CSV file
      const isCSV = selectedFile.name?.toLowerCase().endsWith(".csv") || selectedFile.mimeType === "text/csv";
      if (!isCSV) {
        Alert.alert("Invalid File Type", "Please select a valid CSV file (.csv).");
        return;
      }

      setFileName(selectedFile.name);
      setLoading(true);
      setError("");
      setAnalysisResult(null);
      setPendingAnalysisResult(null);

      console.log("[AnalysisScreen] Uploading file:", selectedFile.name);
      
      // Call actual FastAPI backend via api.ts
      const data = await apiUploadCSV({
        uri: selectedFile.uri,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.mimeType || "text/csv",
      });

      if (data && data.success) {
        console.log("[AnalysisScreen] Upload and analysis successful!");
        setPendingAnalysisResult(data);
        
        // Setup initial default labels for user confirmation (empty to let user enter)
        setConfigTitle("");
        setConfigXLabel("");
        setConfigYLabel("");

        // Open the label configuration modal before rendering the report
        setShowConfigModal(true);
      } else {
        throw new Error("Failed to retrieve analysis from server.");
      }
    } catch (err: any) {
      const apiErrorMessage = handleApiError(err);
      console.error("[AnalysisScreen] Upload error:", apiErrorMessage);
      setError(apiErrorMessage);
      Alert.alert("Analysis Failed", apiErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAnalyze = async (data: ManualDataRequest) => {
    try {
      setLoading(true);
      setError("");
      setAnalysisResult(null);
      setPendingAnalysisResult(null);
      console.log("[AnalysisScreen] Analyzing manual dataset...");

      // Call live FastAPI manual analysis backend
      const responseData = await apiAnalyzeManualData(data);

      if (responseData && responseData.success) {
        console.log("[AnalysisScreen] Manual dataset analysis successful!");
        setPendingAnalysisResult(responseData);

        // Setup initial default labels for manual dataset (empty to let user enter)
        setConfigTitle("");
        setConfigXLabel("");
        setConfigYLabel("");

        // Open configuration modal
        setShowConfigModal(true);
      } else {
        throw new Error("Failed to retrieve analysis from server.");
      }
    } catch (err: any) {
      const apiErrorMessage = handleApiError(err);
      console.error("[AnalysisScreen] Manual analysis error:", apiErrorMessage);
      setError(apiErrorMessage);
      Alert.alert("Analysis Failed", apiErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGraphConfig = async () => {
    if (!pendingAnalysisResult) return;

    setLoading(true);
    setShowConfigModal(false);

    try {
      console.log("[AnalysisScreen] Confirming graph labels before display:", {
        title: configTitle,
        xlabel: configXLabel,
        ylabel: configYLabel,
      });

      // Call route to regenerate matplotlib comparative bar chart with custom labels
      const response = await apiRegenerateChart({
        groups: pendingAnalysisResult.groups || ["All Data"],
        parameters: pendingAnalysisResult.parameters || [],
        comparison_stats: pendingAnalysisResult.comparison_stats || {},
        group_col: pendingAnalysisResult.group_col || "Group",
        title: configTitle.trim() || (pendingAnalysisResult.groups && pendingAnalysisResult.groups.length > 1 && pendingAnalysisResult.group_col !== "Group" ? `Comparison across Parameters (by ${pendingAnalysisResult.group_col})` : "Comparison across Parameters"),
        xlabel: configXLabel.trim() || "Parameters",
        ylabel: configYLabel.trim() || "Value",
      });

      if (response && response.comparison_graph) {
        const customizedResult = {
          ...pendingAnalysisResult,
          comparison_graph: response.comparison_graph
        };
        setAnalysisResult(customizedResult);
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err: any) {
      console.error("[AnalysisScreen] Pre-generation chart labels failed:", err);
      Alert.alert("Graph Generation Failed", `Could not generate comparative graph: ${err.message}`);
      // Fallback: display the original data results anyway
      setAnalysisResult(pendingAnalysisResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {analysisResult && !loading ? (
        <View style={styles.contentWrapper}>
          {/* Header to display on the dynamic report screen */}
          <View style={styles.resultsHeaderContainer}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: themeColors.card }]}
              onPress={handleReset}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("dataset_report")}</Text>
          </View>
          
          <AnalysisResultsCard
            result={analysisResult}
            onReset={handleReset}
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            {navigation.canGoBack() && (
              <View style={styles.header}>
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: themeColors.card }]}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
              </View>
            )}

          <Text style={[styles.title, { color: themeColors.text }]}>
            {t("csv_analysis")}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.subText }]}>
            {t("upload_analyze_subtitle")}
          </Text>

          {/* Premium Segmented Tab Selector */}
          <View style={[styles.tabContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                analysisMode === "upload" && styles.activeTabButton
              ]}
              onPress={() => {
                setError("");
                setAnalysisMode("upload");
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={analysisMode === "upload" ? "#FFFFFF" : themeColors.subText}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  { color: themeColors.subText },
                  analysisMode === "upload" && styles.activeTabButtonText
                ]}
              >
                CSV Upload
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                analysisMode === "manual" && styles.activeTabButton
              ]}
              onPress={() => {
                setError("");
                setAnalysisMode("manual");
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={analysisMode === "manual" ? "#FFFFFF" : themeColors.subText}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  { color: themeColors.subText },
                  analysisMode === "manual" && styles.activeTabButtonText
                ]}
              >
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>

          {analysisMode === "upload" ? (
            <View style={[styles.uploadCard, { backgroundColor: themeColors.card }]}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? "#2A1F52" : "#F3F1FF" }]}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={52}
                  color="#6C3EF4"
                />
              </View>

              <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                {t("upload_csv")}
              </Text>

              <Text style={[styles.cardSubtitle, { color: themeColors.subText }]}>
                {t("select_dataset_analysis")}
              </Text>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={uploadCSV}
                disabled={loading}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>
                  {loading ? t("analyzing") : t("choose_csv")}
                </Text>
              </TouchableOpacity>

              {fileName !== "" && (
                <View style={[styles.fileContainer, { backgroundColor: isDark ? "#24242B" : "#F9FAFB", borderColor: themeColors.border }]}>
                  <Ionicons
                    name="document-text"
                    size={18}
                    color={error ? "#DC2626" : "#22C55E"}
                  />
                  <Text style={[styles.fileNameText, error ? styles.fileErrorName : styles.fileSuccessName]}>
                    {fileName}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <ManualDataEntry
              onAnalyze={handleManualAnalyze}
              isLoading={loading}
            />
          )}

          {error !== "" && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {loading && (
            <View style={[styles.loaderContainer, { backgroundColor: themeColors.card }]}>
              <ActivityIndicator
                size="large"
                color="#6C3EF4"
              />
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                {t("uploading_parsing")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      )}

      {/* Premium Graph Config Dialog Modal */}
      <Modal
        visible={showConfigModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(108, 62, 244, 0.2)" }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: isDark ? 1 : 0 }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="settings-outline" size={22} color="#6C3EF4" />
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t("configure_graph_labels")}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.subText }]}>{t("graph_title_label")} <Text style={{ color: "#DC2626" }}>*</Text></Text>
              <TextInput
                style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
                value={configTitle}
                onChangeText={setConfigTitle}
                placeholder={t("graph_title_placeholder")}
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.subText }]}>{t("x_axis_label")} <Text style={{ color: "#DC2626" }}>*</Text></Text>
              <TextInput
                style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
                value={configXLabel}
                onChangeText={setConfigXLabel}
                placeholder={t("x_axis_placeholder")}
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.subText }]}>{t("y_axis_label")} <Text style={{ color: "#DC2626" }}>*</Text></Text>
              <TextInput
                style={[styles.textInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
                value={configYLabel}
                onChangeText={setConfigYLabel}
                placeholder={t("y_axis_placeholder")}
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              />
            </View>

            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmGraphConfig}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Generate Graph & Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 20 : 60,
  },

  contentWrapper: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 960 : undefined,
    alignSelf: Platform.OS === "web" ? "center" : undefined,
    flex: 1,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  resultsHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 16,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },

  subtitle: {
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },

  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 13,
    gap: 8,
  },

  activeTabButton: {
    backgroundColor: "#6C3EF4",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  activeTabButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: "#F3F1FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },

  cardSubtitle: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },

  button: {
    backgroundColor: "#6C3EF4",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    marginLeft: 10,
  },

  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: "#F9FAFB",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  fileNameText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
  },

  fileSuccessName: {
    color: "#22C55E",
  },

  fileErrorName: {
    color: "#DC2626",
  },

  loaderContainer: {
    marginTop: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  loadingText: {
    marginTop: 14,
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "500",
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    gap: 12,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  // Modal Custom Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(108, 62, 244, 0.2)", // Subtle purple tint overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    width: "100%",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },

  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981", // Emerald green for success action
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  
  inputGroup: {
    marginBottom: 16,
    width: "100%",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },

  textInput: {
    borderWidth: 1.5,
    borderColor: "#6C3EF4", // Premium primary color for clear visibility
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    width: "100%",
  },
});