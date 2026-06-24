import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:audioplayers/audioplayers.dart';

import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../state/auth_state.dart';
import '../widgets/supabase_image_widget.dart';

typedef _Filtro = String; // todos | platos | bebidas

class PedidosScreen extends StatefulWidget {
  const PedidosScreen({super.key});

  @override
  State<PedidosScreen> createState() => _PedidosScreenState();
}

class _PedidosScreenState extends State<PedidosScreen> {
  // Use LOCAL time format
  final _fmtHora = DateFormat('HH:mm');
  bool loading = true;
  bool refreshing = false;
  _Filtro filtro = 'todos';
  String? updatingKey;

  // Only LISTO items (no history, no ENTREGADO)
  List<ItemServir> items = [];
  static final Set<String> _prevListos = <String>{};

  RealtimeChannel? _channel;
  Timer? _debounceReload;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _load();
      _setupRealtime();
    });
  }

  @override
  void dispose() {
    _debounceReload?.cancel();
    if (_channel != null) Supabase.instance.client.removeChannel(_channel!);
    super.dispose();
  }

  void _setupRealtime() {
    final restId = context.read<MeseroAuthState>().restaurante?.id;
    if (restId == null) return;

    final client = Supabase.instance.client;
    _channel = client
        .channel('mesero-realtime-v2')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'pedido',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id_restaurante',
            value: restId,
          ),
          callback: (_) => _scheduleReload(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'detalle_pedido',
          callback: (_) => _scheduleReload(),
        )
        .subscribe();
  }

  void _scheduleReload() {
    _debounceReload?.cancel();
    // Fast debounce: 150ms for near-instant response
    _debounceReload = Timer(const Duration(milliseconds: 150), () {
      if (!mounted) return;
      _load();
    });
  }

  DateTime _parseSupaDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return DateTime.now();
    try {
      if (!dateStr.endsWith('Z') && !dateStr.contains('+')) {
        final tIdx = dateStr.indexOf('T');
        if (tIdx != -1 && dateStr.lastIndexOf('-') < tIdx) {
          dateStr += 'Z';
        }
      }
      return (DateTime.tryParse(dateStr) ?? DateTime.now()).toLocal();
    } catch (_) {
      return DateTime.now();
    }
  }

  Future<void> _load() async {
    final rest = context.read<MeseroAuthState>().restaurante;
    if (rest == null) return;

    if (!refreshing && mounted) setState(() => loading = true);

    try {
      final data = await ApiClient.getJson(
        '/pedidos?id_restaurante=${rest.id}',
      );
      final List<ItemServir> newItems = [];

      for (final p in (data as List<dynamic>? ?? const [])) {
        final pedido = Map<String, dynamic>.from(p as Map);
        final mesaNum = int.tryParse((pedido['mesa']?['numero'] ?? '0').toString()) ?? 0;
        final pedidoId = (pedido['id'] ?? '').toString();
        final numeroPedido = int.tryParse((pedido['numero_pedido'] ?? '0').toString()) ?? 0;

        // Convert to LOCAL time
        final horaPedido = _parseSupaDate((pedido['created_at'] ?? '').toString());

        for (final d
            in (pedido['detalle_pedido'] as List<dynamic>? ?? const [])) {
          final det = Map<String, dynamic>.from(d as Map);
          final estado = (det['estado'] ?? '').toString();

          // ── KEY FIX: Only include LISTO items (no ENTREGADO history) ──
          if (estado != 'LISTO') continue;

          final prod = det['producto'] is Map
              ? Map<String, dynamic>.from(det['producto'])
              : <String, dynamic>{};
          final agregados =
              (det['detalle_pedido_agregado'] as List<dynamic>? ?? const [])
                  .map(
                    (a) => (a is Map && a['agregado'] is Map)
                        ? (a['agregado']['nombre'] ?? '').toString()
                        : '',
                  )
                  .where((s) => s.trim().isNotEmpty)
                  .toList();

          // Convert detail time to LOCAL
          final createdStr = (det['updated_at'] ?? det['created_at'] ?? pedido['created_at'] ?? '').toString();
          final created = createdStr.isNotEmpty ? _parseSupaDate(createdStr) : horaPedido;

          newItems.add(
            ItemServir(
              id: (det['id'] ?? '').toString(),
              nombre: (prod['nombre'] ?? 'Plato').toString(),
              mesa: mesaNum,
              hora: created,
              estado: estado,
              esBebida: prod['es_bebida'] == true,
              pedidoId: pedidoId,
              numeroPedido: numeroPedido,
              horaPedido: horaPedido,
              notas: det['notas']?.toString(),
              imagenUrl: prod['imagen_url']?.toString(),
              agregados: agregados,
            ),
          );
        }
      }

      // Sound/haptic when new LISTO items arrive
      final currentListos = newItems.map((i) => i.id).toSet();
      // Si _prevListos está vacío y es la primera carga real, no debe sonar todo de golpe,
      // PERO al ser static, conservará los previos entre reconstrucciones.
      final isFirstLoad = _prevListos.isEmpty && currentListos.isNotEmpty;
      final hasNew = currentListos.any((id) => !_prevListos.contains(id));
      _prevListos..clear()..addAll(currentListos);

      if (hasNew && !isFirstLoad) {
        AudioPlayer().play(AssetSource('campanilla.mp3'));
        HapticFeedback.heavyImpact();
      }

      if (mounted) setState(() => items = newItems);
    } catch (e) {
      if (e is ApiException && e.message == 'SESSION_EXPIRED') {
        if (mounted) context.read<MeseroAuthState>().logout();
      }
      // Keep silent for network errors; pull-to-refresh available
    } finally {
      if (mounted) setState(() { loading = false; refreshing = false; });
    }
  }

  Future<void> _marcarEntregado(List<String> ids, String updating) async {
    setState(() => updatingKey = updating);
    try {
      for (final id in ids) {
        await ApiClient.patchJson('/pedidos/detalle/$id/estado', {
          'estado': 'ENTREGADO',
        });
      }
      // ── KEY FIX: Remove ENTREGADO items immediately, don't wait for reload ──
      if (mounted) {
        setState(() {
          items = items.where((i) => !ids.contains(i.id)).toList();
        });
      }
      // Also trigger a real reload to stay in sync
      _scheduleReload();
    } finally {
      if (mounted) setState(() => updatingKey = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final listosCount = items.length;
    final platosCount = items.where((i) => !i.esBebida).length;
    final bebidasCount = items.where((i) => i.esBebida).length;

    // Filter by tipo
    final filtered = items.where((i) {
      if (filtro == 'platos') return !i.esBebida;
      if (filtro == 'bebidas') return i.esBebida;
      return true;
    }).toList();

    // Group by pedido
    final byPedido = <String, List<ItemServir>>{};
    for (final i in filtered) {
      (byPedido[i.pedidoId] ??= []).add(i);
    }

    final pedidoIds = byPedido.keys.toList()
      ..sort((a, b) {
        final ha = byPedido[a]!.first.horaPedido;
        final hb = byPedido[b]!.first.horaPedido;
        return hb.compareTo(ha);
      });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pedidos por servir'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.volume_up),
            onPressed: () async {
              print('🔊 TEST SONIDO: Intentando reproducir campanilla.mp3...');
              try {
                final player = AudioPlayer();
                await player.play(AssetSource('campanilla.mp3'));
                print('🔊 TEST SONIDO: Reproducción iniciada sin errores.');
              } catch (e) {
                print('🔊 ERROR DE SONIDO: $e');
              }
            },
          ),
          if (listosCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 14),
              child: Badge(
                label: Text('$listosCount'),
                child: const Icon(Icons.notifications_outlined),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => refreshing = true);
          await _load();
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
          children: [
            // Stat cards
            Row(
              children: [
                Expanded(
                  child: _PedidoStatCard(
                    label: 'Por servir',
                    value: '$listosCount',
                    color: cs.primary,
                    icon: Icons.flash_on_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _PedidoStatCard(
                    label: 'Platos',
                    value: '$platosCount',
                    color: cs.secondary,
                    icon: Icons.restaurant_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _PedidoStatCard(
                    label: 'Bebidas',
                    value: '$bebidasCount',
                    color: cs.tertiary,
                    icon: Icons.local_bar_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Filter chips
            Wrap(
              spacing: 8,
              children: [
                _FilterChip(label: 'Todos', selected: filtro == 'todos', onTap: () => setState(() => filtro = 'todos')),
                _FilterChip(label: 'Platos', selected: filtro == 'platos', onTap: () => setState(() => filtro = 'platos')),
                _FilterChip(label: 'Bebidas', selected: filtro == 'bebidas', onTap: () => setState(() => filtro = 'bebidas')),
              ],
            ),
            const SizedBox(height: 12),
            if (loading) ...[
              Center(child: CircularProgressIndicator(color: cs.primary)),
              const SizedBox(height: 12),
            ],
            // Empty state — clean, no history
            if (!loading && pedidoIds.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 48),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_outline, size: 56, color: cs.primary.withOpacity(0.5)),
                      const SizedBox(height: 12),
                      Text(
                        '¡Todo servido!',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: cs.onSurface),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'No hay nada pendiente por atender',
                        style: TextStyle(color: cs.onSurface.withOpacity(0.55), fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
            for (final pedidoId in pedidoIds)
              _PedidoCard(
                pedidoId: pedidoId,
                items: byPedido[pedidoId]!,
                updatingKey: updatingKey,
                formatHora: (d) => _fmtHora.format(d.toLocal()),
                onEntregarIds: (ids, key) => _marcarEntregado(ids, key),
              ),
          ],
        ),
      ),
    );
  }
}

// ── FilterChip ──
class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          color: selected ? cs.primary.withOpacity(0.14) : Colors.transparent,
          border: Border.all(
            color: selected ? cs.primary.withOpacity(0.5) : cs.outlineVariant.withOpacity(0.5),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? cs.primary : cs.onSurface.withOpacity(0.65),
            fontWeight: FontWeight.w700,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

// ── Pedido Card — no expand needed, show all LISTO items directly ──
class _PedidoCard extends StatelessWidget {
  final String pedidoId;
  final List<ItemServir> items;
  final String? updatingKey;
  final String Function(DateTime) formatHora;
  final Future<void> Function(List<String> ids, String key) onEntregarIds;

  const _PedidoCard({
    required this.pedidoId,
    required this.items,
    required this.updatingKey,
    required this.formatHora,
    required this.onEntregarIds,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final first = items.first;
    final mesa = first.mesa;
    final allIds = items.map((i) => i.id).toList();
    final updatingAll = updatingKey == 'pedido-all-$pedidoId';

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: cs.primary.withOpacity(0.25)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mesa header
            Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: cs.primary.withOpacity(0.12),
                  ),
                  child: Center(
                    child: Text('$mesa',
                      style: TextStyle(color: cs.primary, fontWeight: FontWeight.w900, fontSize: 17)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Mesa $mesa',
                        style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface, fontSize: 15)),
                      Text('${items.length} item${items.length > 1 ? "s" : ""} · ${formatHora(first.horaPedido)}',
                        style: TextStyle(color: cs.onSurface.withOpacity(0.55), fontSize: 12)),
                    ],
                  ),
                ),
                // Entregar todo button
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: cs.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  onPressed: updatingAll ? null : () => onEntregarIds(allIds, 'pedido-all-$pedidoId'),
                  child: updatingAll
                      ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Todo listo', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),
            // Items list — all LISTO, no history
            ...items.map((item) => _ItemRow(
              item: item,
              updatingKey: updatingKey,
              formatHora: formatHora,
              onEntregar: () => onEntregarIds([item.id], item.id),
            )),
          ],
        ),
      ),
    );
  }
}

// ── Item Row ──
class _ItemRow extends StatelessWidget {
  final ItemServir item;
  final String? updatingKey;
  final String Function(DateTime) formatHora;
  final VoidCallback onEntregar;

  const _ItemRow({
    required this.item,
    required this.updatingKey,
    required this.formatHora,
    required this.onEntregar,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isUpdating = updatingKey == item.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: cs.surfaceContainerHighest,
        border: Border.all(color: cs.outlineVariant.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          // Thumbnail
          if (item.imagenUrl != null && item.imagenUrl!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SupabaseImageWidget(
                imagePath: item.imagenUrl,
                width: 44, height: 44, fit: BoxFit.cover,
                placeholder: Container(width: 44, height: 44, color: cs.surfaceVariant),
                errorWidget: Container(
                  width: 44, height: 44, color: cs.surfaceVariant,
                  child: const Center(child: Icon(Icons.broken_image_outlined, size: 18)),
                ),
              ),
            )
          else
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: (item.esBebida ? cs.tertiary : cs.primary).withOpacity(0.14),
              ),
              child: Icon(
                item.esBebida ? Icons.local_bar_outlined : Icons.restaurant_outlined,
                size: 18,
                color: item.esBebida ? cs.tertiary : cs.primary,
              ),
            ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.nombre,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.w700, color: cs.onSurface, fontSize: 13),
                ),
                if ((item.notas ?? '').trim().isNotEmpty)
                  Text('📝 ${item.notas}',
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 11)),
                Text(formatHora(item.hora),
                  style: TextStyle(color: cs.onSurface.withOpacity(0.5), fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Entregar button
          FilledButton.tonal(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
            ),
            onPressed: isUpdating ? null : onEntregar,
            child: isUpdating
                ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Entregar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ── Stat Card ──
class _PedidoStatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  const _PedidoStatCard({required this.label, required this.value, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: cs.surfaceContainerHighest,
        border: Border.all(color: cs.outlineVariant.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 26, height: 26,
                decoration: BoxDecoration(color: color.withOpacity(0.14), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 14, color: color),
              ),
              const Spacer(),
              Text('$value', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: cs.onSurface)),
            ],
          ),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 11, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
