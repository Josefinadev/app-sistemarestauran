/* ═══════════════════════════════════════════════════════════
   LOGIN SCREEN — Autenticación del mesero
   Diseño premium con gradiente y animaciones sutiles
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { Spacing, Radius, FontSize, FontWeight, type ThemeColors } from "../config/theme";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(errorAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setError(""));
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.message || "Error de conexión. Verifica tu red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Background decorative elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Logo / Brand */}
          <Animated.View
            style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}
          >
            <View style={styles.logoIcon}>
              <Ionicons name="restaurant" size={36} color={colors.primary} />
            </View>
            <Text style={styles.brandName}>El Mijano</Text>
            <Text style={styles.brandSub}>Panel del Mesero</Text>
          </Animated.View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa con tu cuenta de mesero
            </Text>

            {/* Error */}
            <Animated.View
              style={[
                styles.errorBox,
                {
                  opacity: errorAnim,
                  transform: [{ scale: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                  display: error ? "flex" : "none",
                },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Ingresar</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            El Mijano © {new Date().getFullYear()}
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    bgCircle1: {
      position: "absolute",
      top: -100,
      right: -80,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: c.primarySoft,
    },
    bgCircle2: {
      position: "absolute",
      bottom: -60,
      left: -100,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: c.infoSoft,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing.xxl,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: Spacing.xxxl,
    },
    logoIcon: {
      width: 72,
      height: 72,
      borderRadius: Radius.xl,
      backgroundColor: c.primarySoft,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.lg,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    brandName: {
      fontSize: FontSize.xxxl,
      fontWeight: FontWeight.bold,
      color: c.text,
      letterSpacing: 0.5,
    },
    brandSub: {
      fontSize: FontSize.md,
      color: c.textMuted,
      marginTop: Spacing.xs,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xxl,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.cardShadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    cardTitle: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    cardSubtitle: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginBottom: Spacing.xl,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.errorSoft,
      borderRadius: Radius.sm,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    errorText: {
      fontSize: FontSize.sm,
      color: c.error,
      flex: 1,
    },
    inputGroup: {
      marginBottom: Spacing.lg,
    },
    inputLabel: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      color: c.textSecondary,
      marginBottom: Spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.inputBg,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.lg,
    },
    inputIcon: {
      marginRight: Spacing.md,
    },
    input: {
      flex: 1,
      fontSize: FontSize.md,
      color: c.text,
      paddingVertical: Platform.OS === "ios" ? 16 : 14,
    },
    eyeBtn: {
      padding: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    loginBtn: {
      flexDirection: "row",
      backgroundColor: c.primary,
      borderRadius: Radius.md,
      paddingVertical: 16,
      justifyContent: "center",
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    loginBtnDisabled: {
      opacity: 0.6,
    },
    loginBtnText: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.semibold,
      color: "#fff",
    },
    footer: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: FontSize.xs,
      marginTop: Spacing.xxxl,
      letterSpacing: 0.5,
    },
  });
