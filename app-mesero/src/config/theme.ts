/* ═══════════════════════════════════════════════════════════
   THEME — Sistema de diseño con modo Claro / Oscuro
   Paleta limpia y profesional para El Mijano
   ═══════════════════════════════════════════════════════════ */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfacePressed: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderLight: string;
  primary: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  info: string;
  infoSoft: string;
  accent: string;
  accentSoft: string;
  overlay: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  cardShadowColor: string;
  statusBar: "light-content" | "dark-content";
}

export const DarkColors: ThemeColors = {
  background: "#0E0F14",
  surface: "#171821",
  surfaceSecondary: "#1D1E28",
  surfacePressed: "#24252F",
  text: "#EDEDF2",
  textSecondary: "#9495A5",
  textMuted: "#5D5E6E",
  textInverse: "#0E0F14",
  border: "rgba(255,255,255,0.07)",
  borderLight: "rgba(255,255,255,0.04)",
  primary: "#8578F6",
  primarySoft: "rgba(133,120,246,0.12)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.12)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.10)",
  error: "#FB7185",
  errorSoft: "rgba(251,113,133,0.10)",
  info: "#60A5FA",
  infoSoft: "rgba(96,165,250,0.10)",
  accent: "#F59E0B",
  accentSoft: "rgba(245,158,11,0.10)",
  overlay: "rgba(0,0,0,0.6)",
  tabBar: "#13141B",
  tabBarBorder: "rgba(255,255,255,0.06)",
  inputBg: "#1D1E28",
  cardShadowColor: "#000",
  statusBar: "light-content",
};

export const LightColors: ThemeColors = {
  background: "#F4F5F7",
  surface: "#FFFFFF",
  surfaceSecondary: "#EDEEF1",
  surfacePressed: "#E5E6EA",
  text: "#1B1C2B",
  textSecondary: "#5B5C6C",
  textMuted: "#9496A5",
  textInverse: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  borderLight: "rgba(0,0,0,0.03)",
  primary: "#7061EA",
  primarySoft: "rgba(112,97,234,0.10)",
  success: "#10B981",
  successSoft: "rgba(16,185,129,0.10)",
  warning: "#F59E0B",
  warningSoft: "rgba(245,158,11,0.08)",
  error: "#EF4444",
  errorSoft: "rgba(239,68,68,0.08)",
  info: "#3B82F6",
  infoSoft: "rgba(59,130,246,0.08)",
  accent: "#F59E0B",
  accentSoft: "rgba(245,158,11,0.08)",
  overlay: "rgba(0,0,0,0.35)",
  tabBar: "#FFFFFF",
  tabBarBorder: "rgba(0,0,0,0.06)",
  inputBg: "#F0F1F3",
  cardShadowColor: "rgba(0,0,0,0.06)",
  statusBar: "dark-content",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 19,
  xxl: 22,
  xxxl: 28,
  hero: 34,
};

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  black: "800" as const,
};
