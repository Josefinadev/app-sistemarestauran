import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiClient {
  ApiClient._();

  static const _storage = FlutterSecureStorage();

  static const _tokenKey = 'mesero-auth-token';

  static Future<String?> getToken() => _storage.read(key: _tokenKey);

  static Future<void> setToken(String token) => _storage.write(key: _tokenKey, value: token);

  static Future<void> clearToken() => _storage.delete(key: _tokenKey);

  static Uri _uri(String path) => Uri.parse('${AppConfig.apiUrl}$path');

  static Future<dynamic> getJson(String path) async {
    final token = await getToken();
    final res = await http.get(
      _uri(path),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (res.statusCode == 401 && token != null) {
      await clearToken();
      throw ApiException('SESSION_EXPIRED', status: 401);
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      final body = _tryJson(res.bodyBytes);
      throw ApiException(
        (body is Map && (body['message'] ?? body['error']) != null)
            ? (body['message'] ?? body['error']).toString()
            : 'Error ${res.statusCode}',
        status: res.statusCode,
      );
    }

    if (res.bodyBytes.isEmpty) return null;
    final json = _tryJson(res.bodyBytes);
    if (json is Map && json.containsKey('data')) return json['data'];
    return json;
  }

  static Future<dynamic> postJson(String path, Map<String, dynamic> body) async {
    final token = await getToken();
    final res = await http.post(
      _uri(path),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    if (res.statusCode == 401 && token != null) {
      await clearToken();
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

    final json = _tryJson(res.bodyBytes);
    if (json is Map && json.containsKey('data')) return json['data'];
    return json;
  }

  static Future<dynamic> patchJson(String path, Map<String, dynamic> body) async {
    final token = await getToken();
    final res = await http.patch(
      _uri(path),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    if (res.statusCode == 401 && token != null) {
      await clearToken();
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

    final json = _tryJson(res.bodyBytes);
    if (json is Map && json.containsKey('data')) return json['data'];
    return json;
  }

  static dynamic _tryJson(Object bytesOrString) {
    try {
      if (bytesOrString is List<int>) {
        return jsonDecode(utf8.decode(bytesOrString));
      }
      if (bytesOrString is String) return jsonDecode(bytesOrString);
      return bytesOrString;
    } catch (_) {
      return null;
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, {this.status});

  @override
  String toString() => message;
}
