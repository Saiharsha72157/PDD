// screens/ParaphraseScreen.tsx

import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  paraphraseText,
  handleApiError,
  getParaphraseHistory,
  getParaphraseFavorites,
  toggleParaphraseFavorite,
  deleteParaphraseHistory,
  analyzeWriting
} from "../services/api";
import type {
  HistoryRecord,
  WritingAnalysisResponse
} from "../services/api";
import { useTranslation } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";

const { width } = Dimensions.get("window");

export default function ParaphraseScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;
  
  // Tabs Navigation State
  const [activeTab, setActiveTab] = useState<"paraphrase" | "history" | "favorites" | "writing_insights">("paraphrase");

  // Core Editor State
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [mode, setMode] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [metadata, setMetadata] = useState({ words: 0, sentences: 0, score: 0.0 });

  // History & Favorites Lists State
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const [favoritesList, setFavoritesList] = useState<HistoryRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Writing Intelligence State
  const [analysisResult, setAnalysisResult] = useState<WritingAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Modals visibility
  const [compareVisible, setCompareVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const modes = [
    { key: "standard", label: t("mode_standard") },
    { key: "fluency", label: t("mode_fluency") },
    { key: "formal", label: t("mode_formal") },
    { key: "academic", label: t("mode_academic") },
    { key: "creative", label: t("mode_creative") },
    { key: "expand", label: t("mode_expand") },
    { key: "shorten", label: t("mode_shorten") },
    { key: "simple", label: t("mode_simple") }
  ];

  // Load Lists when Tabs Change
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    } else if (activeTab === "favorites") {
      fetchFavorites();
    } else if (activeTab === "writing_insights") {
      fetchAnalysis();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setListLoading(true);
    try {
      const data = await getParaphraseHistory();
      setHistoryList(data);
    } catch (err: any) {
      console.error("Error loading history list:", err);
      Alert.alert("Error", err.message || "Failed to load history list.");
    } finally {
      setListLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setListLoading(true);
    try {
      const data = await getParaphraseFavorites();
      setFavoritesList(data);
    } catch (err: any) {
      console.error("Error loading favorites list:", err);
      Alert.alert("Error", err.message || "Failed to load favorites list.");
    } finally {
      setListLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    if (!input.trim()) {
      setAnalysisResult(null);
      setAnalysisError("Please paste or type some text in the editor to run writing analysis.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const data = await analyzeWriting(input);
      setAnalysisResult(data);
    } catch (err) {
      setAnalysisResult(null);
      setAnalysisError(handleApiError(err));
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Word & Character count helpers
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = getWordCount(input);
  const charCount = input.length;
  const isOverLimit = wordCount > 200;

  // Word gauge color logic
  const getProgressBarColor = () => {
    if (wordCount <= 150) return "#22C55E"; // Green
    if (wordCount <= 180) return "#F97316"; // Orange
    return "#EF4444"; // Red
  };

  const getProgressPercentage = () => {
    return Math.min(100, (wordCount / 200) * 100);
  };

  // API Paraphrase Actions
  const handleParaphrase = async () => {
    if (input.trim() === "" || isOverLimit || loading) return;

    setError(null);
    setLoading(false);
    setLoading(true);

    try {
      const response = await paraphraseText({
        text: input,
        mode: mode,
      });
      // Response includes the humanized candidate rephrased text and metadata
      const resData = response as any;
      setOutput(resData.paraphrased_text);
      setOriginalText(input);
      setMetadata({
        words: resData.word_count || getWordCount(resData.paraphrased_text),
        sentences: resData.sentence_count || 1,
        score: resData.score || 9.0
      });
    } catch (apiError) {
      setOutput("");
      setError(handleApiError(apiError));
    } finally {
      setLoading(false);
    }
  };

  // Input clipboard tools
  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setInput(text);
      setError(null);
    }
  };

  const copyInputText = async () => {
    if (input) {
      await Clipboard.setStringAsync(input);
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    }
  };

  const copyOutputText = async () => {
    if (output) {
      await Clipboard.setStringAsync(output);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setOriginalText("");
    setError(null);
  };

  // Output action shortcuts
  const handleSwap = () => {
    if (output) {
      setInput(output);
      setOutput("");
      setOriginalText("");
      setError(null);
      setActiveTab("paraphrase");
    }
  };

  // History action events
  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleParaphraseFavorite(id);
      if (activeTab === "history") {
        fetchHistory();
      } else if (activeTab === "favorites") {
        fetchFavorites();
      }
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord({
          ...selectedRecord,
          favorite: !selectedRecord.favorite
        });
      }
    } catch (err: any) {
      console.error("Error favoriting record:", err);
      Alert.alert("Error", err.message || "Failed to toggle favorite status.");
    }
  };

  const handleDeleteRecord = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to permanently delete this paraphrase record from history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteParaphraseHistory(id);
              fetchHistory();
              fetchFavorites();
              setDetailVisible(false);
            } catch (err: any) {
              console.error("Error deleting history record:", err);
              Alert.alert("Error", err.message || "Failed to delete history record.");
            }
          }
        }
      ]
    );
  };

  const handleReuseRecord = (record: HistoryRecord) => {
    setInput(record.original_text);
    setOutput(record.paraphrased_text);
    setOriginalText(record.original_text);
    setMode(record.mode);
    setMetadata({
      words: getWordCount(record.paraphrased_text),
      sentences: record.paraphrased_text.split(/[.!?]+/).filter(Boolean).length || 1,
      score: record.score
    });
    setDetailVisible(false);
    setActiveTab("paraphrase");
  };

  const handleOpenDetail = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  // Pacing Difference Highlighter Engine
  const getDiffHighlights = (orig: string, para: string) => {
    const origWords = orig.trim().split(/\s+/).filter(Boolean);
    const paraWords = para.trim().split(/\s+/).filter(Boolean);

    const n = origWords.length;
    const m = paraWords.length;
    const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

    // Compile LCS Matrix
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const w1 = origWords[i - 1].toLowerCase().replace(/[.,!?;:]/g, "");
        const w2 = paraWords[j - 1].toLowerCase().replace(/[.,!?;:]/g, "");
        if (w1 === w2) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const origDiff: { text: string; type: "removed" | "normal" }[] = [];
    const paraDiff: { text: string; type: "added" | "modified" | "normal" }[] = [];

    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const w1 = origWords[i - 1].toLowerCase().replace(/[.,!?;:]/g, "");
        const w2 = paraWords[j - 1].toLowerCase().replace(/[.,!?;:]/g, "");

        if (w1 === w2) {
          origDiff.unshift({ text: origWords[i - 1], type: "normal" });
          paraDiff.unshift({ text: paraWords[j - 1], type: "normal" });
          i--;
          j--;
          continue;
        }
      }

      if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        // If word is modified or completely added
        if (i > 0) {
          const w1 = origWords[i - 1].toLowerCase().replace(/[.,!?;:]/g, "");
          const w2 = paraWords[j - 1].toLowerCase().replace(/[.,!?;:]/g, "");
          if (w1 !== w2) {
            paraDiff.unshift({ text: paraWords[j - 1], type: "modified" });
            origDiff.unshift({ text: origWords[i - 1], type: "removed" });
            i--;
            j--;
          } else {
            paraDiff.unshift({ text: paraWords[j - 1], type: "added" });
            j--;
          }
        } else {
          paraDiff.unshift({ text: paraWords[j - 1], type: "added" });
          j--;
        }
      } else {
        origDiff.unshift({ text: origWords[i - 1], type: "removed" });
        i--;
      }
    }

    return { origDiff, paraDiff };
  };

  const { origDiff, paraDiff } = getDiffHighlights(originalText, output);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Upper Navigation Tabs */}
      <View style={[styles.topTabBar, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "paraphrase" && (isDark ? { backgroundColor: "#2E2E38" } : styles.tabItemActive)]}
          onPress={() => setActiveTab("paraphrase")}
        >
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={activeTab === "paraphrase" ? (isDark ? "#818CF8" : "#6C3EF4") : (isDark ? "#9CA3AF" : "#6B7280")}
          />
          <Text style={[styles.tabLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }, activeTab === "paraphrase" && { color: isDark ? "#818CF8" : "#6C3EF4" }]}>
            {t("paraphrase_btn")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "history" && (isDark ? { backgroundColor: "#2E2E38" } : styles.tabItemActive)]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={activeTab === "history" ? (isDark ? "#818CF8" : "#6C3EF4") : (isDark ? "#9CA3AF" : "#6B7280")}
          />
          <Text style={[styles.tabLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }, activeTab === "history" && { color: isDark ? "#818CF8" : "#6C3EF4" }]}>
            {t("history")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "favorites" && (isDark ? { backgroundColor: "#2E2E38" } : styles.tabItemActive)]}
          onPress={() => setActiveTab("favorites")}
        >
          <Ionicons
            name="star-outline"
            size={18}
            color={activeTab === "favorites" ? (isDark ? "#818CF8" : "#6C3EF4") : (isDark ? "#9CA3AF" : "#6B7280")}
          />
          <Text style={[styles.tabLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }, activeTab === "favorites" && { color: isDark ? "#818CF8" : "#6C3EF4" }]}>
            {t("favorites")}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentWrapper}>
            {/* TAB 1: PARAPHRASE ENGINE */}
            {activeTab === "paraphrase" && (
              <View>
                {/* Screen Header */}
                <View style={styles.screenHeader}>
                  <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("ai_paraphraser")}</Text>
                  <Text style={[styles.headerSubtitle, { color: themeColors.subText }]}>
                    {t("rewrite_text_subtitle")}
                  </Text>
                </View>

                {/* Mode Scrollable Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipsBar}
                  contentContainerStyle={styles.chipsContent}
                >
                  {modes.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[
                        styles.chipButton,
                        mode === m.key ? styles.chipButtonActive : [styles.chipButtonInactive, { backgroundColor: themeColors.card, borderColor: themeColors.border }],
                      ]}
                      onPress={() => setMode(m.key)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          mode === m.key ? styles.chipTextActive : [styles.chipTextInactive, { color: isDark ? "#818CF8" : "#6C3EF4" }],
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Responsive Editors Grid Container */}
                <View style={Platform.OS === "web" && output !== "" ? styles.webEditorsContainer : undefined}>
                  <View style={Platform.OS === "web" ? (output !== "" ? styles.webEditorHalf : styles.webEditorCentered) : undefined}>
                    {/* Editor Card */}
                    <View style={[styles.editorCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                      {input.trim() !== "" && (
                        <TouchableOpacity
                          style={[styles.absoluteClearBtn, isDark && { backgroundColor: "#3F1B1B", borderColor: "#7F1D1D" }]}
                          onPress={handleClear}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}

                      <TextInput
                        placeholder={t("paste_or_type")}
                        placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                        multiline
                        value={input}
                        onChangeText={(val) => {
                          setInput(val);
                          setError(null);
                        }}
                        style={[styles.textInput, { color: themeColors.inputText }]}
                        editable={!loading}
                      />

                      {/* Progress Indicators & Word Diagnostics */}
                      <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${getProgressPercentage()}%`,
                                backgroundColor: getProgressBarColor(),
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.counterRow}>
                          <Text style={[styles.charCountText, { color: themeColors.subText }]}>{charCount} {t("characters")}</Text>
                          <Text
                            style={[
                              styles.wordCountText,
                              { color: themeColors.subText },
                              isOverLimit && styles.wordCountErrorText,
                            ]}
                          >
                            {wordCount} / 200 {t("words")}
                          </Text>
                        </View>
                      </View>

                      {/* Word limit warning Banner */}
                      {isOverLimit && (
                        <View style={styles.limitWarning}>
                          <Ionicons name="warning-outline" size={16} color="#EF4444" />
                          <Text style={styles.limitWarningText}>
                            {t("max_words_warning")}
                          </Text>
                        </View>
                      )}

                      <View style={[styles.actionPanel, { borderTopColor: themeColors.border }]}>
                        <View style={styles.leftActions}>
                          <TouchableOpacity
                            style={[styles.actionIconButton, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}
                            onPress={handlePaste}
                            activeOpacity={0.6}
                          >
                            <Ionicons name="clipboard-outline" size={20} color={isDark ? "#818CF8" : "#6C3EF4"} />
                            <Text style={[styles.actionIconLabel, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>{t("paste")}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionIconButton, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}
                            onPress={copyInputText}
                            activeOpacity={0.6}
                          >
                            <Ionicons
                              name={copiedInput ? "checkmark-done-outline" : "copy-outline"}
                              size={20}
                              color={copiedInput ? "#22C55E" : (isDark ? "#818CF8" : "#6C3EF4")}
                            />
                            <Text style={[styles.actionIconLabel, { color: isDark ? "#818CF8" : "#6C3EF4" }, copiedInput && { color: "#22C55E" }]}>
                              {copiedInput ? t("copied") : t("copy_input")}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.rightActions}>
                          <TouchableOpacity
                            style={[
                              styles.paraphraseBtn,
                              (loading || isOverLimit || input.trim() === "") && styles.paraphraseBtnDisabled,
                            ]}
                            onPress={handleParaphrase}
                            disabled={loading || isOverLimit || input.trim() === ""}
                            activeOpacity={0.7}
                          >
                            {loading ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <>
                                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                                <Text style={styles.paraphraseBtnText}>{t("paraphrase_btn")}</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Endpoint Error Handling Display */}
                  {error && (
                    <View style={styles.apiErrorBox}>
                      <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                      <Text style={styles.apiErrorText}>{error}</Text>
                    </View>
                  )}

                  {/* TAB 1 OUTPUT CARD */}
                  {output !== "" && (
                    <View style={Platform.OS === "web" ? styles.webEditorHalf : undefined}>
                      <View style={[styles.outputCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: Platform.OS === "web" ? 0 : 20 }]}>
                        <View style={styles.outputHeader}>
                          <Text style={[styles.outputTitle, { color: themeColors.text }]}>{t("output_title")}</Text>
                        </View>

                        <Text style={[styles.outputText, { color: themeColors.text }]}>{output}</Text>

                        {/* Output Action Panel */}
                        <View style={[styles.outputActionRow, { borderTopColor: themeColors.border }]}>
                          <TouchableOpacity
                            style={[styles.outputActionButton, { backgroundColor: isDark ? "#24242B" : "#F9FAFB", borderColor: themeColors.border }]}
                            onPress={copyOutputText}
                          >
                            <Ionicons
                              name={copiedOutput ? "checkmark-done" : "copy-outline"}
                              size={16}
                              color={copiedOutput ? "#22C55E" : (isDark ? "#818CF8" : "#6C3EF4")}
                            />
                            <Text style={[styles.outputActionLabel, { color: isDark ? "#818CF8" : "#6C3EF4" }, copiedOutput && { color: "#22C55E" }]}>
                              {copiedOutput ? t("copied") : t("copy_output")}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.outputActionButton, { backgroundColor: isDark ? "#24242B" : "#F9FAFB", borderColor: themeColors.border }]}
                            onPress={handleParaphrase}
                          >
                            <Ionicons name="refresh-outline" size={16} color={isDark ? "#818CF8" : "#6C3EF4"} />
                            <Text style={[styles.outputActionLabel, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>{t("regenerate")}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.outputActionButton, { backgroundColor: isDark ? "#24242B" : "#F9FAFB", borderColor: themeColors.border }]}
                            onPress={handleSwap}
                          >
                            <Ionicons name="swap-vertical-outline" size={16} color={isDark ? "#818CF8" : "#6C3EF4"} />
                            <Text style={[styles.outputActionLabel, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>{t("swap_text")}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

          {/* TAB 2: HISTORICAL LOGS CARD */}
          {activeTab === "history" && (
            <View style={styles.listTabContainer}>
              <Text style={[styles.tabSectionTitle, { color: themeColors.text }]}>{t("history")}</Text>
              
              {listLoading ? (
                <ActivityIndicator color="#6C3EF4" size="large" style={{ marginTop: 40 }} />
              ) : historyList.length === 0 ? (
                <View style={[styles.emptyStateBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Ionicons name="hourglass-outline" size={50} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
                  <Text style={[styles.emptyTitle, { color: themeColors.text }]}>{t("no_history_yet")}</Text>
                  <Text style={[styles.emptyText, { color: themeColors.subText }]}>
                    {t("history_stored_locally")}
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setActiveTab("paraphrase")}
                  >
                    <Text style={styles.emptyButtonText}>{t("paraphrase_now")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                historyList.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.historyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                    onPress={() => handleOpenDetail(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeRow}>
                        <View style={styles.modeBadge}>
                          <Text style={styles.modeBadgeText}>
                            {t(`mode_${item.mode}`) || item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(item.id)}
                          style={styles.starTouch}
                        >
                          <Ionicons
                            name={item.favorite ? "star" : "star-outline"}
                            size={20}
                            color={item.favorite ? "#F59E0B" : (isDark ? "#9CA3AF" : "#9CA3AF")}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteRecord(item.id)}
                          style={styles.trashTouch}
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={[styles.previewLabel, { color: themeColors.subText }]}>{t("original")}</Text>
                    <Text style={[styles.previewText, { color: themeColors.subText }]} numberOfLines={2}>
                      {item.original_text}
                    </Text>

                    <Text style={[styles.previewLabel, { color: themeColors.subText }]}>{t("paraphrased")}</Text>
                    <Text style={[styles.previewText, { color: themeColors.text }]} numberOfLines={2}>
                      {item.paraphrased_text}
                    </Text>

                    <Text style={[styles.timestampText, { color: themeColors.subText }]}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* TAB 3: FAVORITES PERSISTENT CARD */}
          {activeTab === "favorites" && (
            <View style={styles.listTabContainer}>
              <Text style={[styles.tabSectionTitle, { color: themeColors.text }]}>{t("favorites")}</Text>
              
              {listLoading ? (
                <ActivityIndicator color="#6C3EF4" size="large" style={{ marginTop: 40 }} />
              ) : favoritesList.length === 0 ? (
                <View style={[styles.emptyStateBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Ionicons name="star-outline" size={50} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
                  <Text style={[styles.emptyTitle, { color: themeColors.text }]}>{t("no_favorites_saved")}</Text>
                  <Text style={[styles.emptyText, { color: themeColors.subText }]}>
                    {t("star_records_desc")}
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setActiveTab("history")}
                  >
                    <Text style={styles.emptyButtonText}>{t("view_history")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                favoritesList.map((item) => (
                  <View key={item.id} style={[styles.historyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeRow}>
                        <View style={styles.modeBadge}>
                          <Text style={styles.modeBadgeText}>
                            {t(`mode_${item.mode}`) || item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(item.id)}
                          style={styles.starTouch}
                        >
                          <Ionicons name="star" size={20} color="#F59E0B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleReuseRecord(item)}
                          style={[styles.reuseBtn, { borderColor: isDark ? "#818CF8" : "#6C3EF4" }]}
                        >
                          <Ionicons name="arrow-redo-outline" size={14} color={isDark ? "#818CF8" : "#6C3EF4"} />
                          <Text style={[styles.reuseBtnText, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>{t("reuse")}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={[styles.previewLabel, { color: themeColors.subText }]}>{t("original")}</Text>
                    <Text style={[styles.previewText, { color: themeColors.subText }]} numberOfLines={2}>
                      {item.original_text}
                    </Text>

                    <Text style={[styles.previewLabel, { color: themeColors.subText }]}>{t("paraphrased")}</Text>
                    <Text style={[styles.previewText, { color: themeColors.text }]}>
                      {item.paraphrased_text}
                    </Text>

                    <View style={[styles.favBottomRow, { borderTopColor: themeColors.border }]}>
                      <Text style={[styles.timestampText, { color: themeColors.subText }]}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                      <TouchableOpacity
                        style={styles.favCopyBtn}
                        onPress={async () => {
                          await Clipboard.setStringAsync(item.paraphrased_text);
                          Alert.alert(t("copied"), t("copy_output"));
                        }}
                      >
                        <Ionicons name="copy-outline" size={14} color={isDark ? "#818CF8" : "#6C3EF4"} />
                        <Text style={[styles.favCopyBtnText, { color: isDark ? "#818CF8" : "#6C3EF4" }]}>{t("copy")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 4: WRITING INSIGHTS PANEL */}
          {activeTab === "writing_insights" && (
            <View style={styles.listTabContainer}>
              <View style={styles.insightsHeaderRow}>
                <Text style={styles.tabSectionTitle}>{t("writing_insights")}</Text>
                {analysisResult && !analysisLoading && (
                  <TouchableOpacity
                    style={styles.refreshAnalysisBtn}
                    onPress={fetchAnalysis}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#6C3EF4" />
                    <Text style={styles.refreshAnalysisBtnText}>{t("refresh")}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {analysisLoading ? (
                <View style={styles.analysisLoaderBox}>
                  <ActivityIndicator color="#6C3EF4" size="large" />
                  <Text style={styles.analysisLoaderText}>{t("analyzing_insights")}</Text>
                </View>
              ) : analysisError ? (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="document-text-outline" size={50} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>{t("no_text_analyze")}</Text>
                  <Text style={styles.emptyText}>
                    {analysisError}
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setActiveTab("paraphrase")}
                  >
                    <Text style={styles.emptyButtonText}>{t("write_text_now")}</Text>
                  </TouchableOpacity>
                </View>
              ) : analysisResult ? (
                <View style={styles.insightsGrid}>
                  
                  {/* CARD 1: READABILITY & SCORE */}
                  <View style={styles.insightCard}>
                    <View style={styles.insightCardHeader}>
                      <Ionicons name="book-outline" size={20} color="#6C3EF4" />
                      <Text style={styles.insightCardTitle}>{t("readability_analysis")}</Text>
                    </View>
                    <View style={styles.readabilityContainer}>
                      <View style={styles.readabilityScoreRow}>
                        <Text style={styles.readabilityScoreText}>{analysisResult.readability.score}</Text>
                        <View style={styles.readabilityLevelBadge}>
                          <Text style={styles.readabilityLevelText}>
                            {analysisResult.readability.level}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${analysisResult.readability.score}%`,
                              backgroundColor:
                                analysisResult.readability.level === "Easy"
                                  ? "#22C55E"
                                  : analysisResult.readability.level === "Moderate"
                                  ? "#F97316"
                                  : "#EF4444",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.readabilityDesc}>
                        {analysisResult.readability.level === "Easy"
                          ? "This text is very easy to read and understand. Best suited for general audiences."
                          : analysisResult.readability.level === "Moderate"
                          ? "This text has moderate complexity. Suitable for average reading skills."
                          : "This text is highly complex and academic. Suitable for scholarly and technical readers."}
                      </Text>
                    </View>
                  </View>

                  {/* CARD 2: TONE DETECTION */}
                  <View style={styles.insightCard}>
                    <View style={styles.insightCardHeader}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6C3EF4" />
                      <Text style={styles.insightCardTitle}>{t("writing_tone")}</Text>
                    </View>
                    <View style={styles.toneContainer}>
                      <View style={styles.toneRow}>
                        <Text style={styles.toneText}>{analysisResult.tone.tone}</Text>
                        <Text style={styles.toneConfidenceText}>{analysisResult.tone.confidence}% {t("confidence_label")}</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${analysisResult.tone.confidence}%`,
                              backgroundColor: "#6C3EF4",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.toneDesc}>
                        We detected a dominant {analysisResult.tone.tone.toLowerCase()} tone. This is determined based on the vocabulary selection, syntax complexity, and punctuation patterns.
                      </Text>
                    </View>
                  </View>

                  {/* CARD 3: GRAMMAR & MECHANICS */}
                  <View style={styles.insightCard}>
                    <View style={styles.insightCardHeader}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#6C3EF4" />
                      <Text style={styles.insightCardTitle}>{t("grammar_mechanics")}</Text>
                      <View
                        style={[
                          styles.issueBadge,
                          analysisResult.grammar.length > 0
                            ? { backgroundColor: "#FEF2F2" }
                            : { backgroundColor: "#DCFCE7" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.issueBadgeText,
                            analysisResult.grammar.length > 0
                              ? { color: "#EF4444" }
                              : { color: "#22C55E" },
                          ]}
                        >
                          {analysisResult.grammar.length > 0
                            ? `${analysisResult.grammar.length} issues`
                            : "No issues"}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.grammarList}>
                      {analysisResult.grammar.length === 0 ? (
                        <View style={styles.cleanGrammarRow}>
                          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                          <Text style={styles.cleanGrammarText}>{t("clean_grammar_desc")}</Text>
                        </View>
                      ) : (
                        analysisResult.grammar.map((issue, idx) => (
                          <View key={idx} style={styles.issueItem}>
                            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" style={{ marginTop: 2 }} />
                            <Text style={styles.issueItemText}>
                              {issue.message}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                  {/* CARD 4: WRITING RECOMMENDATIONS */}
                  <View style={styles.insightCard}>
                    <View style={styles.insightCardHeader}>
                      <Ionicons name="bulb-outline" size={20} color="#6C3EF4" />
                      <Text style={styles.insightCardTitle}>{t("style_recommendations")}</Text>
                    </View>
                    
                    <View style={styles.suggestionList}>
                      {analysisResult.suggestions.length === 0 ? (
                        <View style={styles.cleanGrammarRow}>
                          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                          <Text style={styles.cleanGrammarText}>{t("clean_style_desc")}</Text>
                        </View>
                      ) : (
                        analysisResult.suggestions.map((sug, idx) => (
                          <View key={idx} style={styles.suggestionItem}>
                            <View style={styles.suggestionBullet} />
                            <Text style={styles.suggestionItemText}>
                              {sug.message}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                </View>
              ) : null}
            </View>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* VERSION COMPARISON MODAL HIGHLIGHTER */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={compareVisible}
        onRequestClose={() => setCompareVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("compare_versions")}</Text>
              <TouchableOpacity onPress={() => setCompareVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Legend Indicator Sheet */}
              <View style={styles.legendSheet}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.legendLabel}>{t("removals")}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: "#22C55E" }]} />
                  <Text style={styles.legendLabel}>{t("additions")}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: "#6C3EF4" }]} />
                  <Text style={styles.legendLabel}>{t("modified_synonyms")}</Text>
                </View>
              </View>

              {/* Original Box (Red highlighting removals) */}
              <Text style={styles.modalBoxTitle}>{t("original_text_title")}</Text>
              <View style={styles.compareBox}>
                <View style={styles.diffWrapper}>
                  {origDiff.map((word, idx) => (
                    <Text
                      key={idx}
                      style={[
                        styles.diffWord,
                        word.type === "removed" && styles.removedWordHighlight,
                      ]}
                    >
                      {word.text}{" "}
                    </Text>
                  ))}
                </View>
              </View>

              <Ionicons
                name="arrow-down"
                size={24}
                color="#6B7280"
                style={{ alignSelf: "center", marginVertical: 12 }}
              />

              {/* Paraphrased Box (Green additions & Purple modifications) */}
              <Text style={styles.modalBoxTitle}>{t("paraphrased_text_title")}</Text>
              <View style={[styles.compareBox, { borderColor: "#E5E7EB" }]}>
                <View style={styles.diffWrapper}>
                  {paraDiff.map((word, idx) => (
                    <Text
                      key={idx}
                      style={[
                        styles.diffWord,
                        word.type === "added" && styles.addedWordHighlight,
                        word.type === "modified" && styles.modifiedWordHighlight,
                      ]}
                    >
                      {word.text}{" "}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setCompareVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t("done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DETAIL MODAL CARD */}
      {selectedRecord && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={detailVisible}
          onRequestClose={() => setDetailVisible(false)}
        >
          <View style={styles.modalBg}>
            <View style={styles.modalBody}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("paraphrase_details")}</Text>
                <TouchableOpacity onPress={() => setDetailVisible(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <View style={styles.detailMetaRow}>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>
                      {t(`mode_${selectedRecord.mode}`) || selectedRecord.mode.charAt(0).toUpperCase() + selectedRecord.mode.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalBoxTitle}>{t("original")}</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}>{selectedRecord.original_text}</Text>
                </View>

                <Text style={styles.modalBoxTitle}>{t("paraphrased")}</Text>
                <View style={[styles.detailBox, { backgroundColor: "#F3F1FF", borderColor: "#DDD6FE" }]}>
                  <Text style={[styles.detailText, { color: "#374151" }]}>
                    {selectedRecord.paraphrased_text}
                  </Text>
                </View>

                <Text style={styles.detailTimeText}>
                  {t("created_at")}: {new Date(selectedRecord.timestamp).toLocaleString()}
                </Text>
              </ScrollView>

              <View style={styles.detailActionGrid}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, { backgroundColor: "#fff", borderColor: "#EF4444" }]}
                  onPress={() => handleDeleteRecord(selectedRecord.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={[styles.detailActionBtnText, { color: "#EF4444" }]}>{t("delete")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionBtn, { backgroundColor: "#fff", borderColor: "#F59E0B" }]}
                  onPress={() => handleToggleFavorite(selectedRecord.id)}
                >
                  <Ionicons
                    name={selectedRecord.favorite ? "star" : "star-outline"}
                    size={16}
                    color="#F59E0B"
                  />
                  <Text style={[styles.detailActionBtnText, { color: "#F59E0B" }]}>
                    {selectedRecord.favorite ? t("unstar") : t("favorite")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionBtn, { backgroundColor: "#6C3EF4", borderColor: "#6C3EF4" }]}
                  onPress={() => handleReuseRecord(selectedRecord)}
                >
                  <Ionicons name="arrow-redo-outline" size={16} color="#fff" />
                  <Text style={[styles.detailActionBtnText, { color: "#fff" }]}>{t("reuse")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FF",
  },
  topTabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "web" ? 12 : 54,
    paddingBottom: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE6FF",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  tabItemActive: {
    backgroundColor: "#F3F1FF",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  tabLabelActive: {
    color: "#6C3EF4",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1000 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  webEditorsContainer: {
    flexDirection: "row" as const,
    gap: 16,
    alignItems: "flex-start" as const,
  },
  webEditorHalf: {
    flex: 1,
  },
  webEditorCentered: {
    width: "100%",
  },
  screenHeader: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#6B7280",
    fontSize: 14,
  },
  chipsBar: {
    marginBottom: 16,
  },
  chipsContent: {
    paddingRight: 10,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  chipButtonActive: {
    backgroundColor: "#6C3EF4",
    shadowOpacity: 0.15,
  },
  chipButtonInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EAE6FF",
    shadowOpacity: 0.02,
  },
  chipText: {
    fontWeight: "700",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#fff",
  },
  chipTextInactive: {
    color: "#6C3EF4",
  },
  editorCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EAE6FF",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  absoluteClearBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  textInput: {
    minHeight: 160,
    maxHeight: 280,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
    paddingBottom: 10,
    paddingRight: 42,
  },
  progressSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCountText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  wordCountText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  wordCountErrorText: {
    color: "#EF4444",
  },
  limitWarning: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  limitWarningText: {
    color: "#EF4444",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
    flex: 1,
  },
  actionPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  leftActions: {
    flexDirection: "row",
  },
  actionIconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
  },
  actionIconLabel: {
    color: "#6C3EF4",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearBtn: {
    padding: 8,
    marginRight: 8,
  },
  paraphraseBtn: {
    backgroundColor: "#6C3EF4",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  paraphraseBtnDisabled: {
    backgroundColor: "#CBC5FF",
    shadowOpacity: 0.05,
  },
  paraphraseBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },
  apiErrorBox: {
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  apiErrorText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  outputCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#EAE6FF",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  outputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  outputTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  compareBtnText: {
    color: "#6C3EF4",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  outputText: {
    color: "#374151",
    lineHeight: 26,
    fontSize: 16,
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    backgroundColor: "#F8F7FF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1EDFF",
    marginBottom: 16,
  },
  metricCell: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  outputActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 14,
  },
  outputActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  outputActionLabel: {
    color: "#6C3EF4",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
  },
  listTabContainer: {
    paddingTop: 8,
  },
  tabSectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  emptyStateBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    borderWidth: 1,
    borderColor: "#EAE6FF",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#374151",
    marginTop: 14,
    marginBottom: 6,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emptyButton: {
    backgroundColor: "#6C3EF4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAE6FF",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeBadge: {
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  modeBadgeText: {
    color: "#6C3EF4",
    fontWeight: "700",
    fontSize: 11,
  },
  scoreBadge: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  scoreBadgeText: {
    color: "#D97706",
    fontWeight: "700",
    fontSize: 11,
    marginLeft: 3,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  starTouch: {
    padding: 6,
    marginRight: 8,
  },
  trashTouch: {
    padding: 6,
  },
  previewLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
    marginTop: 8,
  },
  previewText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  timestampText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 12,
    alignSelf: "flex-start",
  },
  reuseBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reuseBtnText: {
    color: "#6C3EF4",
    fontWeight: "700",
    fontSize: 11,
    marginLeft: 3,
  },
  favBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  favCopyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  favCopyBtnText: {
    color: "#6C3EF4",
    fontWeight: "700",
    fontSize: 11,
    marginLeft: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalBody: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  modalScroll: {
    marginTop: 12,
  },
  legendSheet: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
    marginVertical: 4,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  modalBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#9CA3AF",
    marginBottom: 6,
    marginTop: 4,
  },
  compareBox: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
  },
  diffWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    lineHeight: 22,
  },
  diffWord: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
  },
  removedWordHighlight: {
    color: "#EF4444",
    backgroundColor: "#FEE2E2",
    textDecorationLine: "line-through",
    fontWeight: "600",
  },
  addedWordHighlight: {
    color: "#22C55E",
    backgroundColor: "#DCFCE7",
    fontWeight: "600",
  },
  modifiedWordHighlight: {
    color: "#6C3EF4",
    backgroundColor: "#F3F1FF",
    fontWeight: "600",
  },
  modalCloseBtn: {
    backgroundColor: "#6C3EF4",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCloseBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  detailBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  detailText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },
  detailTimeText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    marginBottom: 20,
  },
  detailActionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  detailActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  insightsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  refreshAnalysisBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refreshAnalysisBtnText: {
    color: "#6C3EF4",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  analysisLoaderBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 50,
    borderWidth: 1,
    borderColor: "#EAE6FF",
    marginTop: 20,
  },
  analysisLoaderText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 14,
  },
  insightsGrid: {
    marginTop: 8,
  },
  insightCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAE6FF",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  insightCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
    marginBottom: 12,
  },
  insightCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginLeft: 8,
    flex: 1,
  },
  readabilityContainer: {
    paddingVertical: 4,
  },
  readabilityScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  readabilityScoreText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
  },
  readabilityLevelBadge: {
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  readabilityLevelText: {
    color: "#6C3EF4",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
  },
  readabilityDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginTop: 8,
  },
  toneContainer: {
    paddingVertical: 4,
  },
  toneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  toneText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#6C3EF4",
  },
  toneConfidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  toneDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginTop: 8,
  },
  issueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  issueBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  grammarList: {
    paddingVertical: 4,
  },
  cleanGrammarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  cleanGrammarText: {
    fontSize: 13,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "600",
    flex: 1,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  issueItemText: {
    fontSize: 13,
    color: "#374151",
    marginLeft: 8,
    lineHeight: 18,
    flex: 1,
  },
  suggestionList: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6C3EF4",
    marginRight: 10,
  },
  suggestionItemText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    flex: 1,
  },
});