// screens/TitleGeneratorScreen.tsx

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";

import { 
  generateTitles, 
  handleApiError, 
  ProjectItem,
  getTitleBookmarks,
  addTitleBookmark,
  removeTitleBookmark,
  TitleBookmark
} from "../services/api";
import { useTranslation } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";

type DropdownType = "department" | "domain" | null;

const departmentOptions = [
  "Computer Science Engineering",
  "Information Technology",
  "Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
];

const domainOptions = [
  "Artificial Intelligence",
  "Machine Learning",
  "Cyber Security",
  "Data Science",
  "Internet of Things",
];

export default function TitleGeneratorScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;
  
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<DropdownType>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Bookmarking System State
  const [bookmarks, setBookmarks] = useState<TitleBookmark[]>([]);

  // Fetch bookmarks on mount
  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const data = await getTitleBookmarks();
      setBookmarks(data);
    } catch (err: any) {
      console.error("[BOOKMARKS] Failed to fetch bookmarks on mount:", err);
      Alert.alert("Error", err.message || "Failed to fetch bookmarks.");
    }
  };

  const isBookmarked = (title: string) => {
    return bookmarks.some((b) => b.title === title);
  };

  const handleToggleBookmark = async (project: ProjectItem) => {
    const bookmarked = isBookmarked(project.title);
    try {
      if (bookmarked) {
        await removeTitleBookmark(project.title);
        setBookmarks((prev) => prev.filter((b) => b.title !== project.title));
      } else {
        const newBookmark = await addTitleBookmark({
          title: project.title,
          department: selectedDepartment || "Research",
          domain: selectedDomain || "AI",
          difficulty: project.difficulty,
          algorithms: project.algorithms || [],
          summary: project.summary,
          dataset: project.dataset,
          best_algorithms_explanation: project.best_algorithms_explanation
        });
        setBookmarks((prev) => [newBookmark, ...prev]);
      }
    } catch (err: any) {
      console.error("[BOOKMARKS] Failed to toggle bookmark:", err);
      if (err.message?.includes("relation \"public.title_bookmarks\" does not exist")) {
        Alert.alert(
          "Table Missing",
          "The 'title_bookmarks' database table was not found in your Supabase project.\n\nPlease run the SQL script provided to create it, then try bookmarking again!"
        );
      } else {
        Alert.alert("Error", "Failed to update bookmark.");
      }
    }
  };

  const handleSelectOption = (type: DropdownType, value: string) => {
    setDropdownOpen(null);
    if (type === "department") {
      setSelectedDepartment(value);
      return;
    }
    if (type === "domain") {
      setSelectedDomain(value);
    }
  };

  const handleGenerateTitles = async () => {
    if (!selectedDepartment || !selectedDomain) {
      setError("Please select both department and domain.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await generateTitles({
        department: selectedDepartment,
        domain: selectedDomain,
      });

      setProjects(response.projects || []);
    } catch (apiError) {
      setProjects([]);
      setError(handleApiError(apiError));
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyStyles = (difficulty: string) => {
    if (difficulty === "Easy") {
      return {
        bg: isDark ? "#102A20" : "#DEF7EC",
        text: isDark ? "#52B788" : "#03543F",
      };
    } else if (difficulty === "Medium") {
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

  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={[styles.emptyStateCard, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
          {t("empty_state_title")}
        </Text>
        <Text style={[styles.emptyStateSubtitle, { color: themeColors.subText }]}>
          {t("empty_state_sub")}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: themeColors.card }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("SavedResearch")}>
            <Ionicons name="bookmarks-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("research_title_gen")}</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.subText }]}>
          {t("title_gen_subtitle")}
        </Text>

        <View style={[styles.topCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            {t("department_label")} <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>

          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: isDark ? "#24242B" : "#F9FAFB" }]}
            onPress={() => setDropdownOpen("department")}
          >
            <Text style={[styles.dropdownText, { color: selectedDepartment ? themeColors.text : themeColors.subText }]}>
              {selectedDepartment || t("select_dept_modal")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.subText} />
          </TouchableOpacity>

          <Text style={[styles.label, { color: themeColors.text }]}>
            {t("domain_label")} <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>

          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: isDark ? "#24242B" : "#F9FAFB" }]}
            onPress={() => setDropdownOpen("domain")}
          >
            <Text style={[styles.dropdownText, { color: selectedDomain ? themeColors.text : themeColors.subText }]}>
              {selectedDomain || t("select_domain_modal")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.subText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerateTitles}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>{t("generate_btn")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {projects.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t("generated_topics")}</Text>
            </View>

            {projects.map((item, index) => {
              const bookmarked = isBookmarked(item.title);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.topicCard, { backgroundColor: themeColors.card }]}
                  onPress={() => {
                    const plan = {
                      title: item.title,
                      difficulty: item.difficulty,
                      department: selectedDepartment || "Research",
                      domain: selectedDomain || "AI",
                      algorithms: item.algorithms || [],
                      summary: item.summary,
                      dataset: item.dataset,
                      best_algorithms_explanation: item.best_algorithms_explanation,
                    };
                    navigation.navigate("ResearchDetails", { plan });
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.topicTitle, { color: themeColors.text }]}>{item.title}</Text>
                    <TouchableOpacity 
                      style={styles.bookmarkBtn}
                      onPress={() => handleToggleBookmark(item)}
                    >
                      <Ionicons
                        name={bookmarked ? "bookmark" : "bookmark-outline"}
                        size={22}
                        color={bookmarked ? "#6C3EF4" : (isDark ? "#6B7280" : "#9CA3AF")}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Difficulty Pill */}
                  <View style={[
                    styles.difficultyPill,
                    { backgroundColor: getDifficultyStyles(item.difficulty).bg }
                  ]}>
                    <Text style={[
                      styles.difficultyText,
                      { color: getDifficultyStyles(item.difficulty).text }
                    ]}>
                      {item.difficulty}
                    </Text>
                  </View>

                  {/* Suggested Algorithms Section */}
                  <Text style={[styles.suggestedAlgoLabel, { color: themeColors.subText }]}>Suggested Algorithms:</Text>
                  <View style={styles.algoPillsContainer}>
                    {item.algorithms && item.algorithms.map((algo, idx) => (
                      <View key={idx} style={[styles.algoPill, { backgroundColor: isDark ? "#1E2A3D" : "#E0F2FE" }]}>
                        <Text style={[styles.algoPillText, { color: isDark ? "#38BDF8" : "#0369A1" }]}>{algo}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>



      <Modal
        visible={dropdownOpen !== null}
        transparent
        statusBarTranslucent={true}
        animationType="none"
        onRequestClose={() => setDropdownOpen(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)" }]}
          onPress={() => setDropdownOpen(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {dropdownOpen === "department" ? t("select_dept_modal") : t("select_domain_modal")}
            </Text>
            {(dropdownOpen === "department" ? departmentOptions : domainOptions).map(
              (option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.modalOption, { borderBottomColor: themeColors.border }]}
                  onPress={() => handleSelectOption(dropdownOpen, option)}
                >
                  <Text style={[styles.modalOptionText, { color: themeColors.text }]}>{option}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </Pressable>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  headerSubtitle: {
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  topCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    marginBottom: 30,
  },
  label: {
    fontWeight: "600",
    marginBottom: 12,
    color: "#374151",
    fontSize: 15,
  },
  dropdown: {
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    height: 60,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  dropdownText: {
    color: "#111827",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6C3EF4",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  seeAll: {
    color: "#6C3EF4",
    fontWeight: "600",
  },
  topicCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  bookmarkBtn: {
    padding: 2,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 26,
    flex: 1,
    marginBottom: 8,
  },
  difficultyPill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginVertical: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  easyPill: {
    backgroundColor: "#DEF7EC",
  },
  easyText: {
    color: "#03543F",
  },
  mediumPill: {
    backgroundColor: "#FEF08A",
  },
  mediumText: {
    color: "#713F12",
  },
  hardPill: {
    backgroundColor: "#FDE8E8",
  },
  hardText: {
    color: "#9B1C1C",
  },
  suggestedAlgoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 8,
    marginBottom: 8,
  },
  algoPillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  algoPill: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  algoPillText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "700",
  },
  
  // Details Modal Custom Styling
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(108, 62, 244, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  detailsModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 12,
  },
  detailsModalTitleText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  detailsModalScroll: {
    marginVertical: 6,
  },
  detailsProjectTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 28,
  },
  detailsDifficultyRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 18,
  },
  detailsSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6C3EF4",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailsSectionContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },
  detailsCloseBtn: {
    backgroundColor: "#6C3EF4",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsCloseBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyStateCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    marginBottom: 18,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 18,
    borderRadius: 24,
    marginBottom: 18,
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#111827",
  },
});