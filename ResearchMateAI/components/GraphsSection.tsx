import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { AnalysisResult, Graph } from "../types/analysis";
import { useAppTheme } from "../services/ThemeContext";

interface GraphsSectionProps {
  result: AnalysisResult;
}

const GraphsSection: React.FC<GraphsSectionProps> = ({ result }) => {
  const graphs = result.graphs || {
    histograms: [],
    bar_charts: [],
    pie_charts: [],
    scatter_plots: [],
  };
  const screenWidth = Dimensions.get("window").width - 32;
  const { darkMode, themeColors } = useAppTheme();
  const isDark = darkMode;

  const downloadGraph = async (base64Image: string, title: string) => {
    try {
      console.log("[GraphsSection] Initiating graph download for:", title);
      
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = base64Image;
        link.download = `${cleanTitle}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("[GraphsSection] Web download triggered");
        return;
      }
      
      const filename = `${FileSystem.documentDirectory}${cleanTitle}.png`;
      
      await FileSystem.writeAsStringAsync(filename, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(filename, {
          mimeType: "image/png",
          dialogTitle: `Download ${title}`,
          UTI: "public.png",
        });
        console.log("[GraphsSection] Sharing dialog opened successfully");
      } else {
        Alert.alert("Download Failed", "Sharing is not available on this device.");
      }
    } catch (err: any) {
      console.error("[GraphsSection] Error saving graph:", err);
      Alert.alert("Download Failed", `Could not save graph: ${err.message}`);
    }
  };

  const renderGraph = (graph: Graph, idx: number) => {
    if (graph.error) {
      return (
        <View key={idx} style={[styles.errorGraphContainer, { backgroundColor: isDark ? "#2D1D1D" : "#FEF2F2", borderLeftColor: "#DC2626" }]}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={32}
            color="#DC2626"
          />
          <Text style={styles.errorText}>{graph.error}</Text>
        </View>
      );
    }

    if (!graph.image) {
      return (
        <View key={idx} style={[styles.loadingGraphContainer, { backgroundColor: isDark ? "#24242B" : "#F3F1FF" }]}>
          <ActivityIndicator size="large" color="#6C3EF4" />
          <Text style={[styles.loadingText, { color: themeColors.primary }]}>Generating graph...</Text>
        </View>
      );
    }

    const title = `${graph.type.replace(/_/g, " ").toUpperCase()}${
      graph.column ? `: ${graph.column}` : ""
    }${
      graph.columns && graph.columns.length > 0
        ? `: ${graph.columns.join(", ")}`
        : ""
    }`;

    return (
      <View key={idx} style={[styles.graphCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={[styles.graphHeader, { borderBottomColor: themeColors.border }]}>
          <Text style={[styles.graphTitle, { color: themeColors.text }]}>{title}</Text>
          <View style={[styles.graphBadge, { backgroundColor: isDark ? "#2A1F52" : "#F3F1FF" }]}>
            <Text style={[styles.graphBadgeText, { color: themeColors.primary }]}>
              {graph.type.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
        <Image
          source={{ uri: graph.image }}
          style={[styles.graphImage, { width: screenWidth - 32, backgroundColor: isDark ? "#24242B" : "#F9FAFB" }]}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => downloadGraph(graph.image!, title)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="download" size={18} color="#fff" />
          <Text style={styles.downloadButtonText}>Download Graph</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const hasGraphs =
    graphs.histograms.length > 0 ||
    graphs.bar_charts.length > 0 ||
    graphs.pie_charts.length > 0 ||
    graphs.scatter_plots.length > 0 ||
    graphs.box_plot ||
    graphs.heatmap;

  if (!hasGraphs) {
    return (
      <View style={[styles.noGraphsContainer, { backgroundColor: themeColors.background }]}>
        <MaterialCommunityIcons
          name="chart-box-outline"
          size={48}
          color={isDark ? "#4B5563" : "#D1D5DB"}
        />
        <Text style={[styles.noGraphsText, { color: themeColors.text }]}>No graphs available</Text>
        <Text style={[styles.noGraphsSubtext, { color: themeColors.subText }]}>
          Try uploading a dataset with numeric or categorical columns
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Histograms */}
      {graphs.histograms.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="chart-histogram"
              size={20}
              color="#6C3EF4"
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Distributions ({graphs.histograms.length})
            </Text>
          </View>
          {graphs.histograms.map((graph: Graph, idx: number) => renderGraph(graph, idx))}
        </View>
      )}

      {/* Bar Charts */}
      {graphs.bar_charts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={20}
              color="#6C3EF4"
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Category Counts ({graphs.bar_charts.length})
            </Text>
          </View>
          {graphs.bar_charts.map((graph: Graph, idx: number) => renderGraph(graph, idx))}
        </View>
      )}

      {/* Pie Charts */}
      {graphs.pie_charts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="chart-pie"
              size={20}
              color="#6C3EF4"
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Compositions ({graphs.pie_charts.length})
            </Text>
          </View>
          {graphs.pie_charts.map((graph: Graph, idx: number) => renderGraph(graph, idx))}
        </View>
      )}

      {/* Scatter Plots */}
      {graphs.scatter_plots.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="chart-scatter-plot-hexbin"
              size={20}
              color="#6C3EF4"
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Relationships ({graphs.scatter_plots.length})
            </Text>
          </View>
          {graphs.scatter_plots.map((graph: Graph, idx: number) => renderGraph(graph, idx))}
        </View>
      )}

      {/* Box Plot */}
      {graphs.box_plot && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={20}
              color="#6C3EF4"
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Distribution Analysis</Text>
          </View>
          {renderGraph(graphs.box_plot, 0)}
        </View>
      )}

      {/* Correlation Heatmap */}
      {graphs.heatmap && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="table-large"
              size={20}
              color="#6C3EF4"
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Correlation Heatmap</Text>
          </View>
          {renderGraph(graphs.heatmap, 0)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },

  graphCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  graphTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },

  graphBadge: {
    backgroundColor: "#F3F1FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },

  graphBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6C3EF4",
    textTransform: "capitalize",
  },

  graphImage: {
    height: 300,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },

  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6C3EF4",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  errorGraphContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 32,
    marginBottom: 12,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },

  errorText: {
    fontSize: 13,
    color: "#DC2626",
    marginTop: 12,
    textAlign: "center",
  },

  loadingGraphContainer: {
    backgroundColor: "#F3F1FF",
    borderRadius: 12,
    padding: 40,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 13,
    color: "#6C3EF4",
    marginTop: 12,
  },

  noGraphsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  noGraphsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },

  noGraphsSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

export default GraphsSection;
