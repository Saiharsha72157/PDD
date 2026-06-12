import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught unhandled rendering error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    console.log("[ErrorBoundary] User requested crash recovery reset");
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar backgroundColor="#6C3EF4" barStyle="light-content" />
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={48} color="#fff" />
            </View>
            <Text style={styles.title}>System Recovered</Text>
            <Text style={styles.subtitle}>
              ResearchMate AI encountered a rendering exception. We have protected the app from crashing.
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.errorLabel}>Technical Details:</Text>
            <View style={styles.errorBox}>
              <ScrollView showsVerticalScrollIndicator>
                <Text style={styles.errorText}>
                  {this.state.error?.toString() ?? "Unknown error"}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.buttonText}>Restart Component Stack</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F1FF",
    justifyContent: "space-between",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "#6C3EF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  content: {
    flex: 1,
    marginTop: 30,
    marginBottom: 30,
  },
  errorLabel: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 14,
    marginBottom: 8,
  },
  errorBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "System",
    color: "#B91C1C",
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 10,
  },
  stackText: {
    fontSize: 11,
    fontFamily: "System",
    color: "#4B5563",
    lineHeight: 16,
  },
  button: {
    backgroundColor: "#6C3EF4",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
});
