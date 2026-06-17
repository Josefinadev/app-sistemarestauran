import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiClient {
  ApiClient._();

  static const _storage  = FlutterSecureStorage();
  static const _tokenKey = 'mesero-auth-token';
  static const _timeout  = Duration(seconds: 12);

  static Future<String?> getToken() => _storage.read(key: _tokenKey);
  static Future<void> setToken(String t) => _storage.write(key: _tokenKey, value: t);
  static Future<void> clearToken() => _storage.delete(key: _tokenKey);

  static Uri _uri(String path) => Uri.parse('${AppConfig.apiUrl}$path');

  static Map<String, String> _headers(String? token) => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  // ── GET ──────────────────────────────────────────────────
  static Future<dynamic> getJson(String path) async {
    final token = await getToken();
    late http.Response res;
    try {
      res = await http.get(_uri(path), headers: _headers(token)).timeout(_timeout);
    } on TimeoutException {
      throw ApiException('Sin respuesta del servidor. Verifica tu conexión.');
    } catch (e) {
      throw ApiException('Error de red: $e');
    }
    return _handle(res, token != null);
  }

  // ── POST ─────────────────────────────────────────────────
  static Future<dynamic> postJson(String path, Map<String, dynamic> body) async {
    final token = await getToken();
    late http.Response res;
    try {
      res = await http.post(_uri(path), headers: _headers(token), body: jsonEncode(body)).timeout(_timeout);
    } on TimeoutException {
      throw ApiException('Sin respuesta del servidor. Verifica tu conexión.');
    } catch (e) {
      throw ApiException('Error de red: $e');
    }
    return _handle(res, token != null);
  }

  // ── PATCH ────────────────────────────────────────────────
  static Future<dynamic> patchJson(String path, Map<String, dynamic> body) async {
    final token = await getToken();
    late http.Response res;
    try {
      res = await http.patch(_uri(path), headers: _headers(token), body: jsonEncode(body)).timeout(_timeout);
    } on TimeoutException {
      throw ApiException('Sin respuesta del servidor. Verifica tu conexión.');
    } catch (e) {
      throw ApiException('Error de red: $e');
    }
    return _handle(res, token != null);
  }

  // ── Manejo centralizado de respuesta ─────────────────────
  static dynamic _handle(http.Response res, bool hadToken) {
    if (res.statusCode == 401 && hadToken) {
      clearToken();
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
