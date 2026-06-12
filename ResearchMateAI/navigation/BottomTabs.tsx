import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import AnalysisScreen from "../screens/AnalysisScreen";
import DashboardScreen from "../screens/DashboardScreen";
import DatasetScreen from "../screens/DatasetScreen";
import ParaphraseScreen from "../screens/ParaphraseScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ResearchExplorerScreen from "../screens/ResearchExplorerScreen";

import { useTranslation } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Datasets: "server",
  Analysis: "bar-chart",
  Tools: "build",
  Profile: "person",
  Research: "library",
};

export default function BottomTabs() {
  const { t } = useTranslation();
  const { themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (

    <Tab.Navigator

      initialRouteName="Home"

      screenOptions={({ route }) => ({

        headerShown: false,

        tabBarActiveTintColor: themeColors.primary,

        tabBarInactiveTintColor: themeColors.subText,

        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
        },

        tabBarIcon: ({ color, size }) => {

          return (
            <Ionicons
              name={TAB_ICONS[route.name] ?? "ellipse"}
              size={size}
              color={color}
            />
          );
        },

      })}
    >

      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: t("home")
        }}
      />

      <Tab.Screen
        name="Datasets"
        component={DatasetScreen}
        options={{
          tabBarLabel: t("datasets")
        }}
      />

      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          tabBarLabel: t("analysis")
        }}
      />

      <Tab.Screen
        name="Tools"
        component={ParaphraseScreen}
        options={{
          tabBarLabel: t("tools")
        }}
      />

      <Tab.Screen
        name="Research"
        component={ResearchExplorerScreen}
        options={{
          tabBarLabel: t("research")
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("profile")
        }}
      />

    </Tab.Navigator>

  );
}