// screens/DatasetScreen.tsx

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import React, { useState, useEffect, useRef, useCallback } from "react";

import { searchDatasets, Dataset, handleApiError } from "../services/api";
import { useTranslation } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";

export default function DatasetScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const [search, setSearch] = useState("");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"all" | "kaggle" | "uci">("all");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleBack = useCallback(() => {
    try {
      console.log("[DatasetScreen] Back pressed");
      if (navigation && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err: any) {
      console.error("[DatasetScreen] Back navigation failed:", err);
      Alert.alert("Navigation Error", err.message || "Failed to navigate back.");
    }
  }, [navigation]);

  const fetchDatasets = useCallback(async (query: string, provider: string) => {
    const searchQuery = query.trim() || "ai";
    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await searchDatasets(searchQuery, provider);
      if (isMounted.current) {
        setDatasets(data);
      }
    } catch (err) {
      if (isMounted.current) {
        const errMsg = handleApiError(err);
        setError(errMsg);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDatasets(search, selectedProvider);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedProvider, fetchDatasets]);

  const getSourceBadgeStyles = (source: string) => {
    switch (source.toLowerCase()) {
      case "kaggle":
        return {
          bg: isDark ? "#1E293B" : "#DBEAFE",
          text: isDark ? "#38BDF8" : "#2563EB"
        };
      case "uci":
        return {
          bg: isDark ? "#2A1F3D" : "#F3E8FF",
          text: isDark ? "#C084FC" : "#7C3AED"
        };
      default:
        return {
          bg: isDark ? "#451D1D" : "#FEE2E2",
          text: isDark ? "#F87171" : "#EF4444"
        };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {navigation.canGoBack() && (
            <View style={styles.header}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: themeColors.card }]}
                onPress={handleBack}
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
            {t("discover_datasets")}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.subText }]}>
            {t("find_datasets_subtitle")}
          </Text>

          <View style={[styles.searchContainer, { backgroundColor: themeColors.card }]}>
            <Ionicons
              name="search-outline"
              size={22}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />

            <TextInput
              placeholder={t("search_dataset_placeholder")}
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: themeColors.text }]}
            />
          </View>

          {/* Tab Selector Buttons */}
          <View style={styles.providerTabContainer}>
            <TouchableOpacity
              style={[
                styles.providerTabButton,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                selectedProvider === "all" && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
              ]}
              onPress={() => setSelectedProvider("all")}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.providerTabText,
                { color: themeColors.subText },
                selectedProvider === "all" && { color: "#FFFFFF" }
              ]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerTabButton,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                selectedProvider === "kaggle" && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
              ]}
              onPress={() => setSelectedProvider("kaggle")}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.providerTabText,
                { color: themeColors.subText },
                selectedProvider === "kaggle" && { color: "#FFFFFF" }
              ]}>
                Kaggle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerTabButton,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                selectedProvider === "uci" && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
              ]}
              onPress={() => setSelectedProvider("uci")}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.providerTabText,
                { color: themeColors.subText },
                selectedProvider === "uci" && { color: "#FFFFFF" }
              ]}>
                UCI
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#6C3EF4" />
              <Text style={[styles.loadingText, { color: themeColors.subText }]}>{t("fetching_datasets")}</Text>
            </View>
          ) : error ? (
            <View style={[styles.errorCard, { backgroundColor: isDark ? "#2D1D1D" : "#FFF5F5", borderColor: isDark ? "#4A1E1E" : "#FEE2E2" }]}>
              <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
              <Text style={[styles.errorTitle, { color: isDark ? "#F87171" : "#991B1B" }]}>{t("search_failed")}</Text>
              <Text style={[styles.errorText, { color: isDark ? "#FCA5A5" : "#B91C1C" }]}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchDatasets(search, selectedProvider)}>
                <Text style={styles.retryButtonText}>{t("retry_search")}</Text>
              </TouchableOpacity>
            </View>
          ) : datasets.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.card }]}>
              <Ionicons name="search-outline" size={40} color={isDark ? "#4B5563" : "#9CA3AF"} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>{t("no_datasets_found")}</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
                {t("try_another_topic")}
              </Text>
            </View>
          ) : (
            Array.isArray(datasets) && datasets.map((item, index) => (
              <View
                key={index}
                style={[styles.card, { backgroundColor: themeColors.card }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.datasetTitle, { color: themeColors.text }]}>
                    {item.title}
                  </Text>
                  
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: getSourceBadgeStyles(item.source).bg,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.badgeText,
                      {
                        color: getSourceBadgeStyles(item.source).text,
                      }
                    ]}>
                      {item.source}
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.datasetDescription, { color: themeColors.subText }]} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}

                <TouchableOpacity 
                  style={styles.openDatasetLink}
                  onPress={() => {
                    if (item.url) {
                      Linking.openURL(item.url).catch(err => {
                        console.error("Could not open dataset URL:", err);
                        Alert.alert("Error", "Could not open dataset URL.");
                      });
                    }
                  }}
                >
                  <Text style={[styles.openDatasetLinkText, { color: isDark ? "#818CF8" : "#2563EB" }]}>
                    Open Dataset
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={isDark ? "#818CF8" : "#2563EB"}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 28,
  },

  searchContainer: {
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    marginBottom: 20,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "bold",
  },

  datasetTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    lineHeight: 30,
    marginBottom: 10,
    flex: 1,
  },

  datasetDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  statText: {
    marginLeft: 6,
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 12,
  },

  button: {
    backgroundColor: "#6C3EF4",
    paddingVertical: 16,
    borderRadius: 18,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  centerContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 12,
    marginBottom: 6,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  errorCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#991B1B",
    marginTop: 12,
    marginBottom: 6,
  },

  errorText: {
    fontSize: 14,
    color: "#B91C1C",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  providerTabContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },

  providerTabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  activeProviderTabButton: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  providerTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },

  activeProviderTabText: {
    color: "#FFFFFF",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },

  openDatasetLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  openDatasetLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
});