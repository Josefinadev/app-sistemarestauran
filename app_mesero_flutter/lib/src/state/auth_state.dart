import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_client.dart';

class MeseroAuthState extends ChangeNotifier {
  AuthUsuario? usuario;
  Restaurante? restaurante;
  bool isLoading = true;

  bool get isAuthenticated => usuario != null;

  Future<void> restoreSession() async {
    isLoading = true;
    notifyListeners();

    try {
      final token = await ApiClient.getToken();
      if (token == null) {
        isLoading = false;
        notifyListeners();
        return;
      }

      final me = await ApiClient.getJson('/auth/me');
      usuario = AuthUsuario.fromJson(Map<String, dynamic>.from(me['usuario']));
      restaurante = Restaurante.fromJson(Map<String, dynamic>.from(me['restaurante']));
    } catch (_) {
      await ApiClient.clearToken();
      usuario = null;
      restaurante = null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final data = await ApiClient.postJson('/auth/login', {
      'email': email.trim().toLowerCase(),
      'password': password,
    });

    final user = AuthUsuario.fromJson(Map<String, dynamic>.from(data['usuario']));
    if (user.rol != 'mesero' && user.rol != 'admin') {
      throw ApiException('Esta app es exclusiva para meseros. Contacta al administrador.');
    }

    await ApiClient.setToken((data['access_token'] ?? '').toString());
    usuario = user;
    restaurante = Restaurante.fromJson(Map<String, dynamic>.from(data['restaurante']));
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiClient.clearToken();
    usuario = null;
    restaurante = null;
    notifyListeners();
  }
}
