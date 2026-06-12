import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";

import { useTranslation } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";

export default function OnboardingTwo() {

  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const handleSkip = useCallback(() => {
    try {
      console.log("[OnboardingTwo] Skip pressed, navigating to Login");
      if (navigation) {
        navigation.navigate("Login");
      }
    } catch (err) {
      console.error("[OnboardingTwo] Skip navigation failed:", err);
      Alert.alert("Navigation Error", "Could not navigate to Login. Please try again.");
    }
  }, [navigation]);

  const handleNext = useCallback(() => {
    try {
      console.log("[OnboardingTwo] Next pressed, navigating to OnboardingThree");
      if (navigation) {
        navigation.navigate("OnboardingThree");
      }
    } catch (err) {
      console.error("[OnboardingTwo] Next navigation failed:", err);
      Alert.alert("Navigation Error", "Could not navigate to next screen. Please try again.");
    }
  }, [navigation]);

  return (

    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      <View style={styles.formCard}>
        <View style={styles.topRow}>

          <View style={styles.dotsContainer}>
            <View style={[styles.dot, { backgroundColor: themeColors.border }]} />
            <View style={[styles.dot, styles.activeDot, { backgroundColor: themeColors.primary }]} />
            <View style={[styles.dot, { backgroundColor: themeColors.border }]} />
          </View>

          <TouchableOpacity
            onPress={handleSkip}
          >
            <Text style={[styles.skip, { color: themeColors.subText }]}>
              {t("skip")}
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.centerSection}>

          <View style={[styles.documentCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>

            <View style={[styles.line, { backgroundColor: isDark ? "#4B5563" : "#D1D5DB" }]} />
            <View style={[styles.smallLine, { backgroundColor: isDark ? "#374151" : "#E5E7EB" }]} />
            <View style={[styles.smallLine2, { backgroundColor: isDark ? "#374151" : "#E5E7EB" }]} />

          </View>

          <View style={[styles.searchCircle, { backgroundColor: themeColors.card }]}>

            <Ionicons
              name="search"
              size={30}
              color="#06B6D4"
            />

          </View>

          <View style={[styles.tag, styles.kaggleTag]}>
            <Text style={styles.tagText}>Kaggle</Text>
          </View>

          <View style={[styles.tag, styles.uciTag]}>
            <Text style={styles.tagText}>UCI</Text>
          </View>

        </View>

        <View style={styles.textSection}>

          <Text style={[styles.title, { color: themeColors.text }]}>
            {t("onboarding2_title")}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.subText }]}>
            {t("onboarding2_sub")}
          </Text>

        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.primary }]}
          onPress={handleNext}
        >

          <Text style={styles.buttonText}>
            {t("next")}
          </Text>

        </TouchableOpacity>
      </View>

    </View>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "web" ? 20 : 60,
    paddingBottom: 40,
    justifyContent: "space-between",
    alignItems: Platform.OS === "web" ? "center" : undefined,
  },

  formCard: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 520 : undefined,
    flex: 1,
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dotsContainer: {
    flexDirection: "row",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginRight: 8,
  },

  activeDot: {
    width: 24,
    backgroundColor: "#6C3EF4",
  },

  skip: {
    color: "#666",
    fontSize: 16,
  },

  centerSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },

  documentCard: {
    width: 170,
    height: 190,
    borderRadius: 24,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },

  line: {
    width: 90,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#D1D5DB",
    marginBottom: 14,
  },

  smallLine: {
    width: 70,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    marginBottom: 14,
  },

  smallLine2: {
    width: 50,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },

  searchCircle: {
    position: "absolute",
    top: 0,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  tag: {
    position: "absolute",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  kaggleTag: {
    backgroundColor: "#6C3EF4",
    left: Platform.OS === "web" ? 110 : 20,
    bottom: Platform.OS === "web" ? 20 : 40,
  },

  uciTag: {
    backgroundColor: "#22C55E",
    right: Platform.OS === "web" ? 110 : 20,
    top: 100,
  },

  tagText: {
    color: "#fff",
    fontWeight: "bold",
  },

  textSection: {
    alignItems: "center",
    marginTop: 40,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 28,
  },

  button: {
    backgroundColor: "#6C3EF4",
    paddingVertical: 18,
    borderRadius: 16,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },

});