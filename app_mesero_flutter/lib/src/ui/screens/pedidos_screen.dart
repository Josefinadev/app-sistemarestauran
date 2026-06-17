import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../state/auth_state.dart';

typedef _Filtro = String; // todos | platos | bebidas

class PedidosScreen extends StatefulWidget {
  const PedidosScreen({super.key});

  @override
  State<PedidosScreen> createState() => _PedidosScreenState();
}

class _PedidosScreenState extends State<PedidosScreen> {
  final _fmtHora = DateFormat('HH:mm');
  bool loading = true;
  bool refreshing = false;
  _Filtro filtro = 'todos';
  String? updatingKey;
  List<ItemServir> items = [];
  final Set<String> _prevListos = <String>{};
  final Set<String> _expandedPedidos = <String>{};

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
        .channel('mesero-realtime')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'pedido',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'id_restaurante', value: restId),
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
    _debounceReload = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      _load();
    });
  }

  Future<void> _load() async {
    final rest = context.read<MeseroAuthState>().restaurante;
    if (rest == null) return;

    setState(() {
      if (!refreshing) loading = true;
    });

    try {
      final data = await ApiClient.getJson('/pedidos?id_restaurante=${rest.id}');
      final List<ItemServir> newItems = [];

      for (final p in (data as List<dynamic>? ?? const [])) {
        final pedido = Map<String, dynamic>.from(p as Map);
        final mesaNum = (pedido['mesa']?['numero'] ?? 0) is int
            ? (pedido['mesa']['numero'] as int)
            : int.tryParse((pedido['mesa']?['numero'] ?? '0').toString()) ?? 0;

        final pedidoId = (pedido['id'] ?? '').toString();
        final numeroPedido = (pedido['numero_pedido'] ?? 0) is int
            ? (pedido['numero_pedido'] as int)
            : int.tryParse((pedido['numero_pedido'] ?? '0').toString()) ?? 0;
        final horaPedido = DateTime.tryParse((pedido['created_at'] ?? '').toString()) ?? DateTime.now();

        for (final d in (pedido['detalle_pedido'] as List<dynamic>? ?? const [])) {
          final det = Map<String, dynamic>.from(d as Map);
          final estado = (det['estado'] ?? '').toString();
          if (estado != 'LISTO' && estado != 'ENTREGADO') continue;

          final prod = det['producto'] is Map ? Map<String, dynamic>.from(det['producto']) : <String, dynamic>{};
          final agregados = (det['detalle_pedido_agregado'] as List<dynamic>? ?? const [])
              .map((a) => (a is Map && a['agregado'] is Map) ? (a['agregado']['nombre'] ?? '').toString() : '')
              .where((s) => s.trim().isNotEmpty)
              .toList();

          final created = DateTime.tryParse((det['created_at'] ?? pedido['created_at'] ?? '').toString()) ?? horaPedido;

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

      // new LISTO notification
      final currentListos = newItems.where((i) => i.estado == 'LISTO').map((i) => i.id).toSet();
      final hasNew = currentListos.any((id) => !_prevListos.contains(id));
      _prevListos
        ..clear()
        ..addAll(currentListos);
      if (hasNew) {
        SystemSound.play(SystemSoundType.alert);
        HapticFeedback.heavyImpact();
      }

      setState(() {
        items = newItems;
      });
    } catch (_) {
      // keep silent; UI already has pull-to-refresh
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
          refreshing = false;
        });
      }
    }
  }

  Future<void> _marcarEntregado(List<String> ids, String updating) async {
    setState(() => updatingKey = updating);
    try {
      for (final id in ids) {
        await ApiClient.patchJson('/pedidos/detalle/$id/estado', {'estado': 'ENTREGADO'});
      }
      setState(() {
        items = items
            .map((i) => ids.contains(i.id)
                ? ItemServir(
                    id: i.id,
                    nombre: i.nombre,
                    mesa: i.mesa,
                    hora: i.hora,
                    estado: 'ENTREGADO',
                    esBebida: i.esBebida,
                    pedidoId: i.pedidoId,
                    numeroPedido: i.numeroPedido,
                    horaPedido: i.horaPedido,
                    notas: i.notas,
                    imagenUrl: i.imagenUrl,
                    agregados: i.agregados,
                  )
                : i)
            .toList();
      });
    } finally {
      if (mounted) setState(() => updatingKey = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final listosCount = items.where((i) => i.estado == 'LISTO').length;
    final platosListosCount = items.where((i) => i.estado == 'LISTO' && !i.esBebida).length;
    final bebidasListasCount = items.where((i) => i.estado == 'LISTO' && i.esBebida).length;

    final filtered = items.where((i) {
      if (filtro == 'platos') return !i.esBebida;
      if (filtro == 'bebidas') return i.esBebida;
      return true;
    }).toList();

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
        title: const Text('Pedidos'),
        centerTitle: false,
        actions: [
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
            Row(
              children: [
                Expanded(child: _PedidoStatCard(label: 'Por servir', value: '$listosCount', color: cs.primary, icon: Icons.flash_on_outlined)),
                const SizedBox(width: 10),
                Expanded(child: _PedidoStatCard(label: 'Platos', value: '$platosListosCount', color: cs.secondary, icon: Icons.restaurant_outlined)),
                const SizedBox(width: 10),
                Expanded(child: _PedidoStatCard(label: 'Bebidas', value: '$bebidasListasCount', color: cs.tertiary, icon: Icons.local_bar_outlined)),
              ],
            ),
            const SizedBox(height: 12),
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
            if (!loading && pedidoIds.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Center(
                  child: Text('¡Todo servido! Sin items pendientes', style: TextStyle(color: cs.onSurface.withOpacity(0.6))),
                ),
              ),
            for (final pedidoId in pedidoIds)
              _PedidoCard(
                pedidoId: pedidoId,
                items: byPedido[pedidoId]!,
                expanded: _expandedPedidos.contains(pedidoId),
                updatingKey: updatingKey,
                onToggle: () {
                  setState(() {
                    if (_expandedPedidos.contains(pedidoId)) {
                      _expandedPedidos.remove(pedidoId);
                    } else {
                      _expandedPedidos.add(pedidoId);
                    }
                  });
                },
                formatHora: (d) => _fmtHora.format(d),
                onEntregarIds: (ids, key) => _marcarEntregado(ids, key),
              ),
          ],
        ),
      ),
    );
  }
}

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
          border: Border.all(color: selected ? cs.primary.withOpacity(0.5) : cs.outlineVariant.withOpacity(0.5)),
        ),
        child: Text(label, style: TextStyle(color: selected ? cs.primary : cs.onSurface.withOpacity(0.65), fontWeight: FontWeight.w700, fontSize: 12)),
      ),
    );
  }
}

class _Aggregated {
  final String key;
  final String nombre;
  final int cantidad;
  final int mesa;
  final DateTime hora;
  final bool esBebida;
  final String? notas;
  final List<String> agregados;
  final List<String> listosIds;
  final bool allEntregado;

  _Aggregated({
    required this.key,
    required this.nombre,
    required this.cantidad,
    required this.mesa,
    required this.hora,
    required this.esBebida,
    required this.notas,
    required this.agregados,
    required this.listosIds,
    required this.allEntregado,
  });
}

class _PedidoCard extends StatelessWidget {
  final String pedidoId;
  final List<ItemServir> items;
  final bool expanded;
  final String? updatingKey;
  final VoidCallback onToggle;
  final String Function(DateTime) formatHora;
  final Future<void> Function(List<String> ids, String key) onEntregarIds;

  const _PedidoCard({
    required this.pedidoId,
    required this.items,
    required this.expanded,
    required this.updatingKey,
    required this.onToggle,
    required this.formatHora,
    required this.onEntregarIds,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final first = items.first;
    final mesa = first.mesa;
    final listos = items.where((i) => i.estado == 'LISTO').toList();
    final entregados = items.where((i) => i.estado == 'ENTREGADO').toList();

    final aggregated = _aggregate(items);

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: cs.outlineVariant.withOpacity(0.35))),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            InkWell(
              onTap: onToggle,
              borderRadius: BorderRadius.circular(14),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: cs.primary.withOpacity(0.12),
                    ),
                    child: Center(
                      child: Text(
                        '$mesa',
                        style: TextStyle(color: cs.primary, fontWeight: FontWeight.w900, fontSize: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Mesa $mesa', style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface)),
                        const SizedBox(height: 2),
                        Text(
                          '${listos.length} por entregar · ${entregados.length} entregados · ${formatHora(first.horaPedido)}',
                          style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Icon(expanded ? Icons.expand_less : Icons.expand_more, color: cs.onSurface.withOpacity(0.6)),
                ],
              ),
            ),
            if (expanded) ...[
              const SizedBox(height: 12),
              for (final a in aggregated)
                _AggRow(
                  a: a,
                  updatingKey: updatingKey,
                  formatHora: formatHora,
                  onEntregar: a.listosIds.isEmpty
                      ? null
                      : () => onEntregarIds(a.listosIds, a.key),
                ),
              if (listos.isNotEmpty) ...[
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.tonal(
                    onPressed: updatingKey == 'pedido-all-$pedidoId'
                        ? null
                        : () => onEntregarIds(listos.map((e) => e.id).toList(), 'pedido-all-$pedidoId'),
                    child: updatingKey == 'pedido-all-$pedidoId'
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Marcar todo como entregado'),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  List<_Aggregated> _aggregate(List<ItemServir> raw) {
    final map = <String, List<ItemServir>>{};
    for (final i in raw) {
      final normalizedAgregados = [...i.agregados]..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
      final normalizedNotas = (i.notas ?? '').trim();
      final key = '${i.esBebida ? 'B' : 'P'}|${i.nombre}|$normalizedNotas|${normalizedAgregados.join(',')}';
      (map[key] ??= []).add(i);
    }
    final out = <_Aggregated>[];
    for (final e in map.entries) {
      final list = e.value;
      list.sort((a, b) => b.hora.compareTo(a.hora));
      final listosIds = list.where((x) => x.estado == 'LISTO').map((x) => x.id).toList();
      out.add(
        _Aggregated(
          key: 'agg-${pedidoId}-${e.key}',
          nombre: list.first.nombre,
          cantidad: list.length,
          mesa: list.first.mesa,
          hora: list.first.hora,
          esBebida: list.first.esBebida,
          notas: list.first.notas,
          agregados: list.first.agregados,
          listosIds: listosIds,
          allEntregado: list.every((x) => x.estado == 'ENTREGADO'),
        ),
      );
    }
    // show newest first
    out.sort((a, b) => b.hora.compareTo(a.hora));
    return out;
  }
}

class _AggRow extends StatelessWidget {
  final _Aggregated a;
  final String? updatingKey;
  final String Function(DateTime) formatHora;
  final VoidCallback? onEntregar;

  const _AggRow({required this.a, required this.updatingKey, required this.formatHora, required this.onEntregar});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isUpdating = updatingKey == a.key;
    final canEntregar = onEntregar != null;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: a.allEntregado ? cs.surfaceContainerHighest.withOpacity(0.35) : cs.surfaceContainerHighest,
        border: Border.all(color: cs.outlineVariant.withOpacity(0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: (a.esBebida ? cs.tertiary : cs.primary).withOpacity(0.14),
            ),
            child: Icon(a.esBebida ? Icons.local_bar_outlined : Icons.restaurant_outlined, size: 18, color: a.esBebida ? cs.tertiary : cs.primary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${a.nombre}${a.cantidad > 1 ? ' x${a.cantidad}' : ''}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.w900, color: a.allEntregado ? cs.onSurface.withOpacity(0.55) : cs.onSurface),
                ),
                if ((a.notas ?? '').trim().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('📝 ${a.notas}', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: cs.onSurface.withOpacity(0.65), fontSize: 12)),
                  ),
                if (a.agregados.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('＋ ${a.agregados.join(', ')}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: cs.onSurface.withOpacity(0.65), fontSize: 12)),
                  ),
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(formatHora(a.hora), style: TextStyle(color: cs.onSurface.withOpacity(0.55), fontSize: 11)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (canEntregar)
            IconButton.filledTonal(
              onPressed: isUpdating ? null : onEntregar,
              icon: isUpdating
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Icon(Icons.check_circle, color: cs.primary),
            )
          else
            Icon(Icons.check_circle, color: cs.onSurface.withOpacity(0.25)),
        ],
      ),
    );
  }
}

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
                width: 26,
                height: 26,
                decoration: BoxDecoration(color: color.withOpacity(0.14), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 14, color: color),
              ),
              const Spacer(),
              Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: cs.onSurface)),
            ],
          ),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 11, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
