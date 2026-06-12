// screens/ResearchDetailsScreen.tsx

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAppTheme } from "../services/ThemeContext";
import { TitleBookmark } from "../services/api";

export default function ResearchDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const plan: TitleBookmark = route.params?.plan;

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: themeColors.text }}>No Plan details found.</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: themeColors.card, marginTop: 20 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: themeColors.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getDifficultyStyles = (difficulty: string) => {
    const diff = (difficulty || "easy").toLowerCase();
    if (diff === "easy") {
      return {
        bg: isDark ? "#102A20" : "#DEF7EC",
        text: isDark ? "#52B788" : "#03543F",
      };
    } else if (diff === "medium" || diff === "moderate") {
      return {
        bg: isDark ? "#3A2A10" : "#FEF08A",
        text: isDark ? "#FAD02C" : "#713F12",
      };
    } else {
      return {
        bg: isDark ? "#4A1A1A" : "#FDE8E8",
        text: isDark ? "#F87171" : "#9B1C1C",
      };
    }
  };

  const diffStyle = getDifficultyStyles(plan.difficulty);

  const formattedDate = plan.timestamp
    ? new Date(plan.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : "";

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
          Research Plan
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mainCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.categoryRow}>
            <Ionicons name="git-branch-outline" size={16} color="#6C3EF4" />
            <Text style={[styles.categoryText, { color: themeColors.subText }]}>
              {plan.department} • {plan.domain}
            </Text>
          </View>

          <Text style={[styles.title, { color: themeColors.text }]}>
            {plan.title}
          </Text>

          <View style={styles.badgesRow}>
            <View style={[styles.difficultyPill, { backgroundColor: diffStyle.bg }]}>
              <Ionicons name="speedometer-outline" size={12} color={diffStyle.text} style={{ marginRight: 4 }} />
              <Text style={[styles.difficultyText, { color: diffStyle.text }]}>
                {plan.difficulty} Level
              </Text>
            </View>

            {formattedDate !== "" && (
              <View style={[styles.timestampBadge, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                <Ionicons name="calendar-outline" size={12} color={themeColors.subText} style={{ marginRight: 4 }} />
                <Text style={[styles.timestampText, { color: themeColors.subText }]}>
                  Saved {formattedDate}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBg}>
              <Ionicons name="document-text-outline" size={20} color="#6C3EF4" />
            </View>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Project Summary
            </Text>
          </View>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {plan.summary}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBg}>
              <Ionicons name="server-outline" size={20} color="#0EA5E9" />
            </View>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Recommended Dataset
            </Text>
          </View>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {plan.dataset}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBg}>
              <Ionicons name="analytics-outline" size={20} color="#EC4899" />
            </View>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Target Algorithms & Methodology
            </Text>
          </View>

          {plan.algorithms && plan.algorithms.length > 0 && (
            <View style={styles.algoPillRow}>
              {plan.algorithms.map((algo, index) => (
                <View
                  key={index}
                  style={[
                    styles.algoPill,
                    { backgroundColor: isDark ? "#1E293B" : "#F0F9FF" },
                  ]}
                >
                  <Text style={[styles.algoPillText, { color: isDark ? "#38BDF8" : "#0369A1" }]}>
                    {algo}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionContent, { color: themeColors.text, marginTop: 8 }]}>
            {plan.best_algorithms_explanation}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "web" ? 20 : Platform.OS === "ios" ? 60 : 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
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
    fontWeight: "bold",
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 960 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  difficultyPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "700",
  },
  timestampBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(108, 62, 244, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sectionContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  algoPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  algoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  algoPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
