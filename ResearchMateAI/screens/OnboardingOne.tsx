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

export default function OnboardingOne() {

  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const handleSkip = useCallback(() => {
    try {
      console.log("[OnboardingOne] Skip pressed, navigating to Login");
      if (navigation) {
        navigation.navigate("Login");
      }
    } catch (err) {
      console.error("[OnboardingOne] Skip navigation failed:", err);
      Alert.alert("Navigation Error", "Could not navigate to Login. Please try again.");
    }
  }, [navigation]);

  const handleNext = useCallback(() => {
    try {
      console.log("[OnboardingOne] Next pressed, navigating to OnboardingTwo");
      if (navigation) {
        navigation.navigate("OnboardingTwo");
      }
    } catch (err) {
      console.error("[OnboardingOne] Next navigation failed:", err);
      Alert.alert("Navigation Error", "Could not navigate to next screen. Please try again.");
    }
  }, [navigation]);

  return (

    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      <View style={styles.formCard}>
        <View style={styles.topRow}>

          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.activeDot, { backgroundColor: themeColors.primary }]} />
            <View style={[styles.dot, { backgroundColor: themeColors.border }]} />
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

          <View style={[styles.bigCircle, { backgroundColor: isDark ? "#2A1F52" : "#F1EEFF" }]}>

            <View style={[styles.smallCircle, { backgroundColor: themeColors.card }]}>

              <Ionicons
                name="bulb-outline"
                size={40}
                color="#6C3EF4"
              />

            </View>

          </View>

          <View style={[styles.tag, styles.aiTag]}>
            <Text style={styles.tagText}>AI</Text>
          </View>

          <View style={[styles.tag, styles.mlTag]}>
            <Text style={styles.tagText}>ML</Text>
          </View>

          <View style={[styles.tag, styles.iotTag]}>
            <Text style={styles.tagText}>IoT</Text>
          </View>

        </View>

        <View style={styles.textSection}>

          <Text style={[styles.title, { color: themeColors.text }]}>
            {t("onboarding1_title")}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.subText }]}>
            {t("onboarding1_sub")}
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

  bigCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#F1EEFF",
    justifyContent: "center",
    alignItems: "center",
  },

  smallCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  tag: {
    position: "absolute",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  aiTag: {
    backgroundColor: "#16A3FF",
    left: Platform.OS === "web" ? 140 : 20,
    top: 80,
  },

  mlTag: {
    backgroundColor: "#22C55E",
    right: Platform.OS === "web" ? 140 : 20,
    top: 90,
  },

  iotTag: {
    backgroundColor: "#D946EF",
    right: Platform.OS === "web" ? 160 : 40,
    bottom: Platform.OS === "web" ? 0 : 40,
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
    paddingHorizontal: 10,
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