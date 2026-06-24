import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

class ApiClient {
  ApiClient._();

  static const _storage  = FlutterSecureStorage();
  static const _tokenKey = 'mesero-auth-token';
  static const _refreshKey = 'mesero-refresh-token';
  static const _timeout  = Duration(seconds: 12);

  static Future<String?> getToken() => _storage.read(key: _tokenKey);
  static Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);
  
  static Future<void> setTokens(String access, String refresh) async {
    await _storage.write(key: _tokenKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }
  
  static Future<void> clearTokens() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshKey);
  }

  static Uri _uri(String path) => Uri.parse('${AppConfig.apiUrl}$path');

  static Map<String, String> _headers(String? token) => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  // ── Retry Logic ──────────────────────────────────────────
  static Future<dynamic> _requestWithRetry(
    Future<http.Response> Function(String? token) requestFn,
  ) async {
    String? token = await getToken();
    http.Response res;
    
    try {
      res = await requestFn(token).timeout(_timeout);
    } on TimeoutException {
      throw ApiException('Sin respuesta del servidor. Verifica tu conexión.');
    } catch (e) {
      throw ApiException('Error de red: $e');
    }

    if (res.statusCode == 401 && token != null) {
      final refresh = await getRefreshToken();
      if (refresh != null && refresh.isNotEmpty) {
        try {
          final authRes = await Supabase.instance.client.auth.setSession(refresh);
          if (authRes.session != null) {
            final newAccess = authRes.session!.accessToken;
            final newRefresh = authRes.session!.refreshToken ?? '';
            await setTokens(newAccess, newRefresh);
            token = newAccess;
            try {
              res = await requestFn(token).timeout(_timeout);
            } catch (_) {}
          }
        } catch (_) {
          // If refresh fails, it will fall through and handle the original 401
        }
      }
    }
    
    return _handle(res, token != null);
  }

  // ── GET ──────────────────────────────────────────────────
  static Future<dynamic> getJson(String path) {
    return _requestWithRetry((t) => http.get(_uri(path), headers: _headers(t)));
  }

  // ── POST ─────────────────────────────────────────────────
  static Future<dynamic> postJson(String path, Map<String, dynamic> body) {
    return _requestWithRetry((t) => http.post(_uri(path), headers: _headers(t), body: jsonEncode(body)));
  }

  // ── PATCH ────────────────────────────────────────────────
  static Future<dynamic> patchJson(String path, Map<String, dynamic> body) {
    return _requestWithRetry((t) => http.patch(_uri(path), headers: _headers(t), body: jsonEncode(body)));
  }

  // ── Manejo centralizado de respuesta ─────────────────────
  static dynamic _handle(http.Response res, bool hadToken) {
    if (res.statusCode == 401 && hadToken) {
      clearTokens();
      throw ApiException('SESSION_EXPIRED', status: 401);
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final b = _tryJson(res.bodyBytes);
      throw ApiException(
        (b is Map && (b['message'] ?? b['error']) != null)
            ? (b['message'] ?? b['error']).toString()
            : 'Error ${res.statusCode}',
        status: res.statusCode,
      );
    }
    if (res.bodyBytes.isEmpty) return null;
    final json = _tryJson(res.bodyBytes);
    if (json is Map && json.containsKey('data')) return json['data'];
    return json;
  }

  static dynamic _tryJson(Object bytesOrString) {
    try {
      if (bytesOrString is List<int>) return jsonDecode(utf8.decode(bytesOrString));
      if (bytesOrString is String)    return jsonDecode(bytesOrString);
      return bytesOrString;
    } catch (_) { return null; }
  }
}

class ApiException implements Exception {
  final String message;
  final int?   status;
  ApiException(this.message, {this.status});

  @override
  String toString() => message;
}
