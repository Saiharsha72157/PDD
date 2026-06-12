// screens/SavedResearchScreen.tsx

import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useAppTheme } from "../services/ThemeContext";
import { getTitleBookmarks, removeTitleBookmark, TitleBookmark } from "../services/api";

import { useTranslation } from '../services/localization';

export default function SavedResearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const [bookmarks, setBookmarks] = useState<TitleBookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const data = await getTitleBookmarks();
      setBookmarks(data || []);
    } catch (err) {
      console.error("[SAVED_RESEARCH] Failed to load bookmarks:", err);
      Alert.alert("Error", "Failed to retrieve your saved research plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchBookmarks();
    }
  }, [isFocused]);

  const handleRemoveBookmark = (title: string) => {
    Alert.alert(
      "Remove Plan",
      "Are you sure you want to remove this research topic from your saved list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeTitleBookmark(title);
              setBookmarks((prev) => prev.filter((b) => b.title !== title));
            } catch (err) {
              console.error("[SAVED_RESEARCH] Failed to delete bookmark:", err);
              Alert.alert("Error", "Failed to delete bookmark.");
            }
          }
        }
      ]
    );
  };

  const getDifficultyTheme = (difficulty: string) => {
    const diff = (difficulty || "easy").toLowerCase();
    if (diff === "easy") {
      return {
        border: "#10B981",
        bg: isDark ? "#0A251C" : "#E6FBF3",
        text: isDark ? "#34D399" : "#065F46",
      };
    } else if (diff === "medium" || diff === "moderate") {
      return {
        border: "#F59E0B",
        bg: isDark ? "#2D2206" : "#FEF3C7",
        text: isDark ? "#FBBF24" : "#92400E",
      };
    } else {
      return {
        border: "#EF4444",
        bg: isDark ? "#2D1212" : "#FEE2E2",
        text: isDark ? "#F87171" : "#991B1B",
      };
    }
  };

  const filteredBookmarks = bookmarks.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.title || "").toLowerCase().includes(query) ||
      (item.department || "").toLowerCase().includes(query) ||
      (item.domain || "").toLowerCase().includes(query)
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: themeColors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Saved Research
        </Text>
        <View style={styles.counterBadge}>
          <Text style={styles.counterBadgeText}>
            {bookmarks.length}
          </Text>
        </View>
      </View>

      {bookmarks.length > 0 && (
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search-outline" size={18} color={themeColors.subText} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder={t("search_saved_placeholder")}
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              autoCapitalize="none"
            />
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6C3EF4" />
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.card }]}>
            <Ionicons name="bookmarks-outline" size={44} color="#6C3EF4" />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            No Saved Research Plans
          </Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
            Generate and bookmark research plans in the Title Generator tab to view them here.
          </Text>
        </View>
      ) : filteredBookmarks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={40} color={themeColors.subText} />
          <Text style={[styles.emptyTitle, { color: themeColors.text, fontSize: 16, marginTop: 12 }]}>
            No Results Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
            No research plans match your query "{searchQuery}".
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredBookmarks.map((item) => {
            const colors = getDifficultyTheme(item.difficulty);
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    borderLeftColor: colors.border,
                  },
                ]}
              >
                <View style={styles.topBadgeRow}>
                  <Text style={[styles.domainLabel, { color: themeColors.subText }]}>
                    {item.department} • {item.domain}
                  </Text>
                </View>

                <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                  {item.title}
                </Text>

                <View style={styles.pillContainer}>
                  <View style={[styles.difficultyPill, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.difficultyText, { color: colors.text }]}>
                      {item.difficulty}
                    </Text>
                  </View>

                  {item.algorithms &&
                    item.algorithms.map((algo, index) => (
                      <View
                        key={index}
                        style={[
                          styles.algoPill,
                          { backgroundColor: isDark ? "#1F293D" : "#E0F2FE" },
                        ]}
                      >
                        <Text style={[styles.algoPillText, { color: isDark ? "#38BDF8" : "#0369A1" }]}>
                          {algo}
                        </Text>
                      </View>
                    ))}
                </View>

                <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={[styles.openBtn, { backgroundColor: "#6C3EF4" }]}
                    onPress={() => navigation.navigate("ResearchDetails", { plan: item })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={14} color="#FFF" style={styles.btnIcon} />
                    <Text style={styles.openBtnText}>{t("open_plan_btn")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deleteBtn,
                      {
                        backgroundColor: isDark ? "#2A1F1F" : "#FEE2E2",
                        borderColor: isDark ? "#4B2A2A" : "#FCA5A5",
                      },
                    ]}
                    onPress={() => handleRemoveBookmark(item.title)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" style={styles.btnIcon} />
                    <Text style={styles.deleteBtnText}>{t("delete")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "web" ? 20 : Platform.OS === "ios" ? 60 : 40,
    alignItems: Platform.OS === "web" ? "center" as const : undefined,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 960 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  counterBadge: {
    backgroundColor: "#6C3EF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  counterBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 960 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 960 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  topBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  domainLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  difficultyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
  },
  algoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  algoPillText: {
    fontSize: 10,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 12,
    opacity: 0.6,
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  openBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  btnIcon: {
    marginRight: 4,
  },
});
