// screens/LanguageSettingsScreen.tsx

import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation, setCurrentLanguage } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";

export default function LanguageSettingsScreen() {
  const navigation = useNavigation<any>();
  const { t, currentLanguage } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const languages = [
    { name: "English", sub: "English", icon: "E" },
    { name: "Hindi", sub: "हिंदी", icon: "ह" },
    { name: "Telugu", sub: "తెలుగు", icon: "త" },
    { name: "Tamil", sub: "தமிழ்", icon: "த" },
    { name: "Malayalam", sub: "മലയാളം", icon: "മ" },
  ];

  const handleSelectLanguage = (langName: string) => {
    setCurrentLanguage(langName);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: themeColors.card }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {t("language")}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          {t("language_subtitle")}
        </Text>

        {languages.map((item) => {
          const isSelected = currentLanguage === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.card,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                },
                isSelected && styles.cardSelected,
              ]}
              onPress={() => handleSelectLanguage(item.name)}
              activeOpacity={0.85}
            >
              <View style={styles.leftSection}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isSelected
                        ? themeColors.primary
                        : isDark
                        ? "#2E2E38"
                        : "#F3F1FF",
                    },
                  ]}
                >
                  <Text style={[styles.iconText, { color: isSelected ? "#fff" : themeColors.text }]}>
                    {item.icon}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.languageText, { color: themeColors.text }]}>
                    {item.sub}
                  </Text>
                  <Text style={[styles.subText, { color: themeColors.subText }]}>
                    {item.name}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radio,
                  { borderColor: themeColors.border },
                  isSelected && {
                    backgroundColor: themeColors.primary,
                    borderColor: themeColors.primary,
                  },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Done Button */}
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: themeColors.primary }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>{t("done")}</Text>
      </TouchableOpacity>
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
    marginBottom: 10,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 680 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 680 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardSelected: {
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  languageText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: Platform.OS === "web" ? 24 : Platform.OS === "ios" ? 40 : 24,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: Platform.OS === "web" ? 680 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
