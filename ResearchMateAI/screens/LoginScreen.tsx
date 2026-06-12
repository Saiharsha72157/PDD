import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "../services/localization";
import { useAppTheme } from "../services/ThemeContext";
import { useAuth } from "../services/AuthContext";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { darkMode, themeColors } = useAppTheme();
  const { login, resetPassword, verifyOtp, updatePassword, logout } = useAuth();
  const isDark = darkMode;

  const [resetStep, setResetStep] = useState<"login" | "forgot" | "otp" | "newPassword">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      // AuthContext will handle navigation via AppNavigator
    } catch (error: any) {
      const errorMsg = error.message || "";
      if (errorMsg.includes("Invalid login credentials") || errorMsg.includes("Invalid credentials")) {
        setErrorMessage("Incorrect password or email. Please try again.");
      } else {
        setErrorMessage(errorMsg || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setErrorMessage("");
    setResetStep("forgot");
  };

  const handleSendResetCode = async () => {
    setErrorMessage("");
    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email.trim());
      Alert.alert(
        "Recovery Code Sent",
        "A 6-digit password reset code has been sent to your email. Please check your inbox (and spam folder)."
      );
      setResetStep("otp");
    } catch (err: any) {
      setErrorMessage(err.message || "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage("");
    if (!otp || otp.length < 6) {
      setErrorMessage("Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(email.trim(), otp.trim(), "recovery");
      // Verification successful, user is temporarily signed in, now ask for new password
      setResetStep("newPassword");
      setOtp("");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid or expired recovery code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewPassword = async () => {
    setErrorMessage("");
    if (!newPassword || newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await updatePassword(newPassword);
      Alert.alert("Success", "Your password has been successfully reset! Please login with your new password.");
      await logout(); // Ensure they are logged out so they can log in properly with the new creds
      setResetStep("login");
      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <View style={styles.formCard}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="bulb-outline" size={36} color="#fff" />
            </View>
            <Text style={[styles.logoText, { color: themeColors.primary }]}>
              ResearchMate AI
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {resetStep === "login" && t("welcome_back")}
              {resetStep === "forgot" && "Forgot Password"}
              {resetStep === "otp" && "Verify Reset Code"}
              {resetStep === "newPassword" && "Create New Password"}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              {resetStep === "login" 
                ? "Sign in to continue to ResearchMate AI" 
                : resetStep === "forgot"
                  ? "Enter your email to receive a recovery code"
                  : resetStep === "otp"
                    ? `Enter the 6-digit code sent to ${email}`
                    : "Create a new strong password"}
            </Text>
          </View>

          <View style={styles.form}>
            {resetStep === "login" && (
              <>
                {/* Email Input */}
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: themeColors.card },
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={themeColors.subText}
                    style={styles.icon}
                  />
                  <TextInput
                    placeholder={t("email_address_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Password Input */}
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: themeColors.card },
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={themeColors.subText}
                    style={styles.icon}
                  />
                  <TextInput
                    ref={passwordRef}
                    placeholder={t("password_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>

                <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPasswordClick} disabled={loading}>
                  <Text style={styles.forgotPasswordText}>{t("forgot_password_btn")}</Text>
                </TouchableOpacity>

                {!!errorMessage && (
                  <Text style={{ color: "#EF4444", marginBottom: 16, textAlign: "center", fontWeight: "600" }}>
                    {errorMessage}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.8 }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t("login_btn")}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: themeColors.subText }]}>
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                    <Text style={styles.footerLink}>{t("signup_btn")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {resetStep === "forgot" && (
              <>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: themeColors.card },
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={themeColors.subText}
                    style={styles.icon}
                  />
                  <TextInput
                    placeholder={t("email_address_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSendResetCode}
                  />
                </View>

                {!!errorMessage && (
                  <Text style={{ color: "#EF4444", marginBottom: 16, textAlign: "center", fontWeight: "600" }}>
                    {errorMessage}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.8 }]}
                  onPress={handleSendResetCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t("send_reset_code")}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 10 }} onPress={() => { setResetStep("login"); setErrorMessage(""); }}>
                  <Text style={{ color: themeColors.subText, textAlign: "center", textDecorationLine: "underline" }}>
                    {t("back_to_login")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {resetStep === "otp" && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="keypad-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    placeholder="6-Digit OTP"
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, { color: themeColors.text, letterSpacing: 8, fontSize: 20, textAlign: "center" }, Platform.OS === "web" && (styles as any).inputWeb]}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>

                {!!errorMessage && (
                  <Text style={{ color: "#EF4444", marginBottom: 16, textAlign: "center", fontWeight: "600" }}>
                    {errorMessage}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.8 }]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t("verify_code")}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setResetStep("login")}>
                  <Text style={{ color: themeColors.subText, textAlign: "center", textDecorationLine: "underline" }}>
                    {t("back_to_login")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {resetStep === "newPassword" && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    placeholder={t("new_password_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    returnKeyType="next"
                  />
                </View>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    placeholder={t("confirm_new_password_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveNewPassword}
                  />
                </View>

                {!!errorMessage && (
                  <Text style={{ color: "#EF4444", marginBottom: 16, textAlign: "center", fontWeight: "600" }}>
                    {errorMessage}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.8 }]}
                  onPress={handleSaveNewPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t("save_new_password")}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ marginTop: 10 }} 
                  onPress={async () => {
                    setLoading(true);
                    await logout();
                    setLoading(false);
                    setResetStep("login");
                    setErrorMessage("");
                  }}
                  disabled={loading}
                >
                  <Text style={{ color: themeColors.subText, textAlign: "center", textDecorationLine: "underline" }}>
                    {t("cancel_back_to_login")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "web" ? 0 : 60,
    paddingBottom: 40,
    alignItems: Platform.OS === "web" ? "center" : undefined,
    justifyContent: Platform.OS === "web" ? "center" : undefined,
    minHeight: Platform.OS === "web" ? ("100vh" as any) : undefined,
  },
  formCard: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 460 : undefined,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: "#6C3EF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  textContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 17,
    fontSize: 15,
  },
  // Web-only: removes the browser's default blue outline on <input>
  inputWeb: {
    outlineWidth: 0,
    outlineStyle: "none",
  } as any,
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 22,
  },
  forgotPasswordText: {
    color: "#6C3EF4",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#6C3EF4",
    paddingVertical: 17,
    borderRadius: 16,
    marginBottom: 28,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#6C3EF4",
  },
});