import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import { useAppTheme } from "../services/ThemeContext";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const quickActions = [
    {
      title: "Generate Topics",
      subtitle: "AI-powered research ideas",
      icon: "bulb-outline",
      color: "#6C3EF4",
      screen: "TitleGenerator",
    },

    {
      title: "Explore Datasets",
      subtitle: "Find research datasets",
      icon: "server-outline",
      color: "#06B6D4",
      screen: "Datasets",
    },

    {
      title: "CSV Analysis",
      subtitle: "Analyze uploaded data",
      icon: "analytics-outline",
      color: "#22C55E",
      screen: "Analysis",
    },

    {
      title: "Paraphrase",
      subtitle: "Rewrite academic content",
      icon: "create-outline",
      color: "#EC4899",
      screen: "Tools",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: themeColors.subText }]}>
              Good Morning 👋
            </Text>
            <Text style={[styles.name, { color: themeColors.text }]}>
              ResearchMate AI
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Smart AI Research Assistant
            </Text>
            <Text style={styles.heroSubtitle}>
              Generate topics, analyze data and improve academic writing.
            </Text>
          </View>

          <Ionicons
            name="sparkles-outline"
            size={64}
            color="#fff"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.title }]}>
          Quick Actions
        </Text>

        <View style={styles.grid}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { backgroundColor: themeColors.card }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View
                style={[
                  styles.iconContainer,
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

        <Text style={[styles.sectionTitle, { color: themeColors.title }]}>
          Recent Activity
        </Text>

        <View style={[styles.activityCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.activityRow}>
            <View
              style={[
                styles.activityIcon,
                { backgroundColor: isDark ? "#2E255C" : "#DDD6FE" },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={isDark ? "#818CF8" : "#6C3EF4"}
              />
            </View>

            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: themeColors.text }]}>
                CSV Analysis Completed
              </Text>
              <Text style={[styles.activitySubtitle, { color: themeColors.subText }]}>
                Dataset analyzed successfully
              </Text>
            </View>
          </View>

          <View style={styles.activityRow}>
            <View
              style={[
                styles.activityIcon,
                { backgroundColor: isDark ? "#4C1C45" : "#FCE7F3" },
              ]}
            >
              <Ionicons
                name="bulb-outline"
                size={22}
                color={isDark ? "#F472B6" : "#EC4899"}
              />
            </View>

            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: themeColors.text }]}>
                New AI Topics Generated
              </Text>
              <Text style={[styles.activitySubtitle, { color: themeColors.subText }]}>
                3 research topics available
              </Text>
            </View>
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
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  greeting: {
    color: "#6B7280",
    fontSize: 16,
  },

  name: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 6,
  },



  heroCard: {
    backgroundColor: "#6C3EF4",
    borderRadius: 30,
    padding: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 34,
  },

  heroContent: {
    flex: 1,
    paddingRight: 10,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  heroSubtitle: {
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
  },

  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
  },

  iconContainer: {
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

  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    marginBottom: 40,
  },

  activityRow: {
    flexDirection: "row",
    marginBottom: 20,
  },

  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  activityContent: {
    flex: 1,
    justifyContent: "center",
  },

  activityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },

  activitySubtitle: {
    color: "#6B7280",
  },

});