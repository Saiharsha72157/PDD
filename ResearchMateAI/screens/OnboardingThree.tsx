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

export default function OnboardingThree() {

  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const handleSkip = useCallback(() => {
    try {
      console.log("[OnboardingThree] Skip pressed, navigating to Login");
      if (navigation) {
        navigation.navigate("Login");
      }
    } catch (err) {
      console.error("[OnboardingThree] Skip navigation failed:", err);
      Alert.alert("Navigation Error", "Could not navigate to Login. Please try again.");
    }
  }, [navigation]);

  const handleGetStarted = useCallback(() => {
    try {
      console.log("[OnboardingThree] Get Started pressed, navigating to Login");
      if (navigation) {
        navigation.navigate("Login");
      }
    } catch (err) {
      console.error("[OnboardingThree] Get Started navigation failed:", err);
      Alert.alert("Navigation Error", "Could not navigate to Login. Please try again.");
    }
  }, [navigation]);

  return (

    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      <View style={styles.formCard}>
        <View style={styles.topRow}>

          <View style={styles.dotsContainer}>
            <View style={[styles.dot, { backgroundColor: themeColors.border }]} />
            <View style={[styles.dot, { backgroundColor: themeColors.border }]} />
            <View style={[styles.dot, styles.activeDot, { backgroundColor: themeColors.primary }]} />
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

          <View style={styles.chartContainer}>

            <View style={[styles.bar, { height: 70 }]} />
            <View style={[styles.bar, { height: 120 }]} />
            <View style={[styles.bar, { height: 180 }]} />
            <View style={[styles.bar, { height: 100 }]} />
            <View style={[styles.bar, { height: 150 }]} />

          </View>

          <View style={[styles.editCircle, { backgroundColor: themeColors.card }]}>

            <Ionicons
              name="create-outline"
              size={30}
              color="#EC4899"
            />

          </View>

          <View style={[styles.tag, styles.csvTag]}>
            <Text style={styles.tagText}>CSV</Text>
          </View>

          <View style={[styles.tag, styles.aiTag]}>
            <Text style={styles.tagText}>AI</Text>
          </View>

        </View>

        <View style={styles.textSection}>

          <Text style={[styles.title, { color: themeColors.text }]}>
            {t("onboarding3_title")}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.subText }]}>
            {t("onboarding3_sub")}
          </Text>

        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.primary }]}
          onPress={handleGetStarted}
        >

          <Text style={styles.buttonText}>
            {t("get_started")}
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

  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },

  bar: {
    width: 34,
    backgroundColor: "#6C3EF4",
    borderRadius: 10,
    marginHorizontal: 6,
  },

  editCircle: {
    position: "absolute",
    top: 10,
    right: Platform.OS === "web" ? 120 : 30,
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

  csvTag: {
    backgroundColor: "#22C55E",
    left: Platform.OS === "web" ? 110 : 10,
    top: 100,
  },

  aiTag: {
    backgroundColor: "#EC4899",
    right: Platform.OS === "web" ? 110 : 10,
    bottom: Platform.OS === "web" ? 20 : 40,
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