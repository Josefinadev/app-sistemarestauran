import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeState extends ChangeNotifier {
  static const _key = 'mesero-theme-mode';
  bool isDark = false;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final val = prefs.getString(_key);
    isDark = val == 'dark';
    notifyListeners();
  }

  Future<void> toggle() async {
    isDark = !isDark;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, isDark ? 'dark' : 'light');
  }

  ThemeData darkTheme({String? primaryHex}) {
    final primary = _parseHex(primaryHex) ?? const Color(0xFFC5A059);
    return ThemeData(
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xFF0E0F14),
      cardColor: const Color(0xFF171821),
      useMaterial3: true,
    );
  }

  ThemeData lightTheme({String? primaryHex}) {
    final primary = _parseHex(primaryHex) ?? const Color(0xFFC5A059);
    return ThemeData(
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: const Color(0xFFF4F5F7),
      cardColor: Colors.white,
      useMaterial3: true,
    );
  }

  Color? _parseHex(String? hex) {
    if (hex == null) return null;
    final h = hex.trim();
    if (!h.startsWith('#')) return null;
    final v = h.substring(1);
    if (v.length != 6) return null;
    final n = int.tryParse(v, radix: 16);
    if (n == null) return null;
    return Color(0xFF000000 | n);
  }
}
