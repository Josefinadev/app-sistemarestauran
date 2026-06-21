import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

class SupabaseStorageService {
  SupabaseStorageService._();

  static String getPublicUrl(String? path, {String bucket = 'platos'}) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    var normalized = path.startsWith('/') ? path.substring(1) : path;
    normalized = Uri.encodeFull(normalized);

    try {
      final client = Supabase.instance.client;
      final publicUrl = client.storage.from(bucket).getPublicUrl(normalized);
      if (publicUrl != null && publicUrl != '') {
        return publicUrl;
      }
    } catch (_) {
      // Ignore if this SDK version doesn't support getPublicUrl
    }

    return '${AppConfig.supabaseUrl}/storage/v1/object/public/$bucket/$normalized';
  }
}
