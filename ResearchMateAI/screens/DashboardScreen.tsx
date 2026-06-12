import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import React, { useCallback } from "react";

import { useTranslation } from "../services/localization";

import { useAppTheme } from "../services/ThemeContext";
import { useAuth } from "../services/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const features = [
    {
      title: t("title_generator"),
      subtitle: t("generate_topics_desc"),
      icon: "bulb-outline",
      screen: "TitleGenerator",
      type: "stack",
      color: "#6C3EF4",
    },

    {
      title: t("datasets"),
      subtitle: t("explore_datasets"),
      icon: "server-outline",
      screen: "Datasets",
      type: "tab",
      color: "#06B6D4",
    },

    {
      title: t("analysis"),
      subtitle: t("analyze_csv_desc"),
      icon: "analytics-outline",
      screen: "Analysis",
      type: "tab",
      color: "#22C55E",
    },

    {
      title: t("tools"),
      subtitle: t("rewrite_content"),
      icon: "create-outline",
      screen: "Tools",
      type: "tab",
      color: "#EC4899",
    },

    {
      title: t("research"),
      subtitle: t("explore_research_papers"),
      icon: "library-outline",
      screen: "Research",
      type: "tab",
      color: "#F59E0B",
    },
  ];

  const handleNavigate = useCallback((screenName: string, isTab: boolean = false, nestedScreen?: string) => {
    try {
      console.log(`[DashboardScreen] Navigating to: ${screenName}, isTab: ${isTab}, nestedScreen: ${nestedScreen}`);
      if (!navigation) {
        console.warn("[DashboardScreen] Navigation reference is missing!");
        return;
      }
      
      if (isTab) {
        navigation.navigate(screenName, {
          screen: nestedScreen,
        });
      } else {
        navigation.navigate(screenName);
      }
    } catch (err) {
      console.error(`[DashboardScreen] Central navigation failed to ${screenName}:`, err);
      Alert.alert("Navigation Error", "Failed to load the selected screen. Please try again.");
    }
  }, [navigation]);

  const getInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.trim().split(" ");
      if (parts.length > 1 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0] ? parts[0][0].toUpperCase() : "RM";
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "RM";
  };

  return (

    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Platform.OS === "web" ? 20 : Math.max(60, insets.top + 20) }]}>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.welcome, { color: themeColors.subText }]}>
                {t("welcome_back")}
              </Text>
              <Text style={[styles.name, { color: themeColors.text }]}>
                {user?.fullName || user?.username || "Researcher"}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.avatarCircle, { backgroundColor: themeColors.primary }]}
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarCircleText}>
                {getInitials()}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.banner}>

            <View style={styles.bannerContent}>

              <Text style={styles.bannerTitle}>
                {t("ai_research_assistant")}
              </Text>

              <Text style={styles.bannerSubtitle}>
                {t("smart_tools_desc")}
              </Text>

            </View>

            <Ionicons
              name="sparkles-outline"
              size={60}
              color="#fff"
            />

          </View>

          <Text style={[styles.sectionTitle, { color: themeColors.title }]}>
            {t("quick_access")}
          </Text>

          <View style={styles.grid}>

            {features.map((item, index) => (

              <TouchableOpacity
                key={index}
                style={[styles.card, { backgroundColor: themeColors.card }]}
                onPress={() => {

                  if (item.type === "tab") {

                    handleNavigate("MainApp", true, item.screen);

                  } else {

                    handleNavigate(item.screen);

                  }

                }}
              >

                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: item.color },
                  ]}
                >

                  <Ionicons
                    name={item.icon as any}
                    size={28}
                    color="#fff"
                  />

                </View>

                <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                  {item.title}
                </Text>

                <Text style={[styles.cardSubtitle, { color: themeColors.subText }]}>
                  {item.subtitle}
                </Text>

              </TouchableOpacity>

            ))}

          </View>
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
  },

  contentWrapper: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1100 : undefined,
    alignSelf: Platform.OS === "web" ? "center" : undefined,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  headerLeft: {
    flexDirection: "column",
    justifyContent: "center",
  },

  welcome: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  name: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -0.5,
  },

  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  avatarCircleText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },



  banner: {
    backgroundColor: "#6C3EF4",
    borderRadius: 30,
    padding: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 34,
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  bannerSubtitle: {
    color: "#E9D5FF",
    fontSize: 16,
    lineHeight: 24,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Platform.OS === "web" ? 16 : undefined,
  },

  card: {
    width: Platform.OS === "web" ? "23%" : "47%",
    minWidth: Platform.OS === "web" ? 180 : undefined,
    maxWidth: Platform.OS === "web" ? 280 : undefined,
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
  },

  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },

  cardSubtitle: {
    color: "#6B7280",
    lineHeight: 22,
  },

});