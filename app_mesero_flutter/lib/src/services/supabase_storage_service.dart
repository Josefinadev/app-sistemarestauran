import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

class SupabaseStorageService {
  SupabaseStorageService._();

  /// Genera una URL pública para una imagen en Supabase Storage
  /// [path] es la ruta relativa del archivo en el bucket (ej: 'platos/imagen.jpg')
  /// [bucket] es el nombre del bucket en Supabase (por defecto: 'platos')
  static String getPublicUrl(String? path, {String bucket = 'platos'}) {
    if (path == null || path.isEmpty) {
      return '';
    }

    // Si ya es una URL completa, devolverla tal cual
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Construir la URL pública de Supabase Storage
    final url = '${AppConfig.supabaseUrl}/storage/v1/object/public/$bucket/$path';
    return url;
  }

  /// Verifica si una imagen existe y es válida
  static Future<bool> imageExists(String? imagePath, {String bucket = 'platos'}) async {
    if (imagePath == null || imagePath.isEmpty) {
      return false;
    }

    try {
      final client = Supabase.instance.client;
      final files = await client.storage.from(bucket).list(path: imagePath);
      return files.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}
