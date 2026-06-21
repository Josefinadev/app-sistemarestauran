import 'package:flutter/material.dart';

import '../../services/supabase_storage_service.dart';

class SupabaseImageWidget extends StatefulWidget {
  final String? imagePath;
  final double width;
  final double height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final String bucket;

  const SupabaseImageWidget({
    Key? key,
    required this.imagePath,
    this.width = 100,
    this.height = 100,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.bucket = 'platos',
  }) : super(key: key);

  @override
  State<SupabaseImageWidget> createState() => _SupabaseImageWidgetState();
}

class _SupabaseImageWidgetState extends State<SupabaseImageWidget> {
  late String imageUrl;
  bool imageLoadError = false;

  @override
  void initState() {
    super.initState();
    imageUrl = SupabaseStorageService.getPublicUrl(
      widget.imagePath,
      bucket: widget.bucket,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (imageUrl.isEmpty) {
      return _buildPlaceholder(cs);
    }

    if (imageLoadError) {
      return _buildPlaceholder(cs);
    }

    return ClipRRect(
      borderRadius: widget.borderRadius ?? BorderRadius.zero,
      child: Image.network(
        imageUrl,
        width: widget.width,
        height: widget.height,
        fit: widget.fit,
        errorBuilder: (context, error, stackTrace) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() => imageLoadError = true);
            }
          });
          return _buildPlaceholder(cs);
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: widget.borderRadius,
            ),
            child: Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: cs.primary,
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                            loadingProgress.expectedTotalBytes!
                      : null,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPlaceholder(ColorScheme cs) {
    return Container(
      width: widget.width,
      height: widget.height,
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: widget.borderRadius,
      ),
      child: Center(
        child: Icon(
          Icons.restaurant_outlined,
          size: widget.width > 50 ? 32 : 16,
          color: cs.onSurface.withOpacity(0.3),
        ),
      ),
    );
  }
}
