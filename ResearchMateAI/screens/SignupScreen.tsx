import React, { useState, useRef, useEffect } from "react";
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
import { useAppTheme } from "../services/ThemeContext";
import { useAuth } from "../services/AuthContext";

import { useTranslation } from '../services/localization';

export default function SignupScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { darkMode, themeColors } = useAppTheme();
  const { register, verifyOtp, resendOtp } = useAuth();
  const isDark = darkMode;

  const [step, setStep] = useState<"form" | "otp">("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(30);

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Timer countdown logic for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSignup = async () => {
    setErrorMessage("");
    if (!firstName || !lastName || !username || !email || !mobile || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    const cleanMobile = mobile.replace(/[^0-9]/g, "");
    if (!phoneRegex.test(cleanMobile)) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await register(email.trim(), cleanMobile, password, fullName, username.trim());
      Alert.alert("Check your email", "We've sent a 6-digit verification code to your email address.");
      setStep("otp");
      setResendTimer(30);
    } catch (error: any) {
      const errorMsg = error.message || "An error occurred.";
      // If user exists but isn't verified, Supabase returns "User already registered"
      if (errorMsg.includes("User already registered") || errorMsg.includes("already registered")) {
        try {
          await resendOtp(email.trim(), "signup");
          Alert.alert("Check your email", "We've sent a fresh 6-digit verification code to your email address.");
          setStep("otp");
          setResendTimer(30);
          setErrorMessage("");
        } catch (resendError: any) {
          setErrorMessage(resendError.message || "User already exists. Please login instead.");
        }
      } else {
        setErrorMessage(errorMsg);
      }
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
      await verifyOtp(email.trim(), otp.trim(), "signup");
      Alert.alert("Success", "Email verified successfully! You can now log in.");
      navigation.navigate("Login");
    } catch (error: any) {
      setErrorMessage(error.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      await resendOtp(email.trim(), "signup");
      setResendTimer(30);
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to resend code.");
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
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {step === "form" ? "Create Account" : "Verify Email"}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              {step === "form" 
                ? "Sign up to get started with ResearchMate AI" 
                : `Enter the 6-digit code sent to ${email}`}
            </Text>
          </View>

          <View style={styles.form}>
            {step === "form" ? (
              <View>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="person-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    placeholder={t("first_name_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={firstName}
                    onChangeText={setFirstName}
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="person-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    ref={lastNameRef}
                    placeholder={t("last_name_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={lastName}
                    onChangeText={setLastName}
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="at-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    ref={usernameRef}
                    placeholder={t("username_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={username}
                    onChangeText={setUsername}
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="mail-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    ref={emailRef}
                    placeholder={t("email_address_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => mobileRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="call-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    ref={mobileRef}
                    placeholder={t("mobile_number_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    ref={passwordRef}
                    placeholder={t("password_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.subText} style={styles.icon} />
                  <TextInput
                    ref={confirmPasswordRef}
                    placeholder={t("confirm_password_placeholder")}
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={[styles.input, { color: themeColors.text }, Platform.OS === "web" && (styles as any).inputWeb]}
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                  />
                </View>

                {!!errorMessage && (
                  <Text style={{ color: "#EF4444", marginBottom: 16, textAlign: "center", fontWeight: "600" }}>
                    {errorMessage}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.8 }]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t("signup_btn")}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: themeColors.subText }]}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.footerLink}>{t("login_btn")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
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
                    <Text style={styles.buttonText}>{t("verify_otp_btn")}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 10, marginBottom: 15 }}
                  onPress={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                >
                  <Text style={{ 
                    color: resendTimer > 0 ? themeColors.subText : themeColors.primary, 
                    textAlign: "center", 
                    fontWeight: resendTimer > 0 ? "normal" : "bold"
                  }}>
                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Code"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setStep("form")}>
                  <Text style={{ color: themeColors.subText, textAlign: "center", textDecorationLine: "underline" }}>
                    Change Email Address
                  </Text>
                </TouchableOpacity>
              </View>
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
    paddingTop: Platform.OS === "web" ? 0 : 80,
    paddingBottom: 40,
    alignItems: Platform.OS === "web" ? "center" : undefined,
    justifyContent: Platform.OS === "web" ? "center" : undefined,
    minHeight: Platform.OS === "web" ? ("100vh" as any) : undefined,
  },
  formCard: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 460 : undefined,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
    elevation: 1,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  inputWeb: {
    outlineWidth: 0,
    outlineStyle: "none",
  } as any,
  button: {
    backgroundColor: "#6C3EF4",
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 24,
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
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
