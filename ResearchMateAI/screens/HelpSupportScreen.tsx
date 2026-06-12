// screens/HelpSupportScreen.tsx

import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";
import { useAuth } from "../services/AuthContext";
import { supabase } from "../services/supabase";
import { submitSupportTicket } from "../services/api";

export default function HelpSupportScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const { user } = useAuth();
  const isDark = darkMode;

  // Help & Support States
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "question">("bug");
  const [feedbackEmail, setFeedbackEmail] = useState(user?.email || "");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Auto pre-fill email if logged-in user details change
  useEffect(() => {
    if (user?.email) {
      setFeedbackEmail(user.email);
    }
  }, [user]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleSubmitTicket = async () => {
    if (!feedbackEmail || !feedbackMessage) {
      Alert.alert(t("required_fields"), t("required_fields_message"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(feedbackEmail.trim())) {
      Alert.alert(t("invalid_email"), t("invalid_email_message"));
      return;
    }

    try {
      setSubmittingTicket(true);

      await submitSupportTicket({
        ticket_type: feedbackType,
        email: feedbackEmail.trim(),
        message: feedbackMessage.trim()
      });

      Alert.alert(
        t("ticket_submitted"),
        t("ticket_submitted_message")
      );
      setFeedbackMessage("");
    } catch (err: any) {
      console.error("[SUPPORT] Failed to submit ticket:", err);
      if (err.message?.includes("relation \"public.support_tickets\" does not exist")) {
        Alert.alert(
          "Table Missing",
          "The 'support_tickets' database table was not found in your Supabase project.\n\nPlease run the SQL script provided to create it, then try submitting again!"
        );
      } else {
        Alert.alert("Submission Failed", err.message || "An error occurred while submitting.");
      }
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: themeColors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("help_support")}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* FAQs Accordion Section */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.cardTitle, { color: themeColors.primary }]}>{t("faq_title")}</Text>
          <Text style={[styles.cardSub, { color: themeColors.subText }]}>{t("faq_sub")}</Text>

          {[
            {
              q: t("faq_q1"),
              a: t("faq_a1"),
            },
            {
              q: t("faq_q2"),
              a: t("faq_a2"),
            },
            {
              q: t("faq_q3"),
              a: t("faq_a3"),
            },
            {
              q: t("faq_q4"),
              a: t("faq_a4"),
            },
          ].map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <View
                key={idx}
                style={[
                  styles.faqCard,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: isDark ? "#24242B" : "#F9FAFB",
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFaq(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestion, { color: themeColors.text }]}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={themeColors.subText}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <Text style={[styles.faqAnswer, { color: themeColors.subText }]}>{faq.a}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Submit Ticket Form Section */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.cardTitle, { color: themeColors.primary }]}>{t("submit_ticket")}</Text>
          <Text style={[styles.cardSub, { color: themeColors.subText }]}>{t("submit_ticket_sub")}</Text>

          {/* Request Type Selector */}
          <Text style={[styles.inputLabel, { color: themeColors.subText }]}>{t("request_type")}</Text>
          <View style={styles.typeSelector}>
            {(["bug", "feature", "question"] as const).map((type) => {
              const isSelected = feedbackType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                      backgroundColor: isSelected ? (isDark ? "rgba(108, 62, 244, 0.2)" : "#EDE9FE") : themeColors.inputBg,
                    },
                  ]}
                  onPress={() => setFeedbackType(type)}
                >
                  <Text style={[styles.typeBtnText, { color: isSelected ? themeColors.primary : themeColors.text }]}>
                    {type === "bug" ? t("bug_report") : type === "feature" ? t("feature_request") : t("question")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Email Input */}
          <Text style={[styles.inputLabel, { color: themeColors.subText }]}>{t("email_address")}</Text>
          <TextInput
            style={[styles.formInput, { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
            value={feedbackEmail}
            onChangeText={setFeedbackEmail}
            placeholder={t("email_placeholder")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Message Input */}
          <Text style={[styles.inputLabel, { color: themeColors.subText }]}>{t("message_details")}</Text>
          <TextInput
            style={[
              styles.formInput,
              styles.textArea,
              { color: themeColors.inputText, backgroundColor: themeColors.inputBg, borderColor: themeColors.border },
            ]}
            value={feedbackMessage}
            onChangeText={setFeedbackMessage}
            placeholder={t("message_placeholder")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            multiline={true}
            numberOfLines={4}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: themeColors.primary }, submittingTicket && { opacity: 0.6 }]}
            onPress={handleSubmitTicket}
            disabled={submittingTicket}
          >
            {submittingTicket ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>{t("submit_request")}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "web" ? 20 : 60,
    alignItems: Platform.OS === "web" ? "center" as const : undefined,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 680 : undefined,
    alignSelf: Platform.OS === "web" ? "center" as const : undefined,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  faqCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 6,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  formInput: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    fontSize: 13,
    marginBottom: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
