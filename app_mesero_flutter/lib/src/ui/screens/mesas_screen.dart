import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../services/api_client.dart';
import '../../state/auth_state.dart';

class MesasScreen extends StatefulWidget {
  const MesasScreen({super.key});

  @override
  State<MesasScreen> createState() => _MesasScreenState();
}

class _MesasScreenState extends State<MesasScreen> {
  bool loading = true;
  bool refreshing = false;
  List<_MesaEstado> mesas = [];

  RealtimeChannel? _channel;
  Timer? _debounce;

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
    _debounce?.cancel();
    if (_channel != null) Supabase.instance.client.removeChannel(_channel!);
    super.dispose();
  }

  void _setupRealtime() {
    final restId = context.read<MeseroAuthState>().restaurante?.id;
    if (restId == null) return;

    final client = Supabase.instance.client;
    _channel = client
        .channel('mesas-realtime')
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
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
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
      final results = await Future.wait([
        ApiClient.getJson('/mesas?id_restaurante=${rest.id}'),
        ApiClient.getJson('/pedidos?id_restaurante=${rest.id}'),
      ]);
      final mesasData = results[0] as List<dynamic>?;
      final pedidosData = results[1] as List<dynamic>?;

      final map = <String, _MesaEstado>{};
      for (final m in (mesasData ?? const [])) {
        final mm = Map<String, dynamic>.from(m as Map);
        map[(mm['id'] ?? '').toString()] = _MesaEstado(
          id: (mm['id'] ?? '').toString(),
          numero: (mm['numero'] ?? 0) is int ? mm['numero'] as int : int.tryParse((mm['numero'] ?? '0').toString()) ?? 0,
          pedidoActivo: false,
          platosListos: 0,
          platosEntregados: 0,
          totalPlatos: 0,
        );
      }

      for (final p in (pedidosData ?? const [])) {
        final pedido = Map<String, dynamic>.from(p as Map);
        final mesaId = (pedido['id_mesa'] ?? '').toString();
        final mesa = map[mesaId];
        if (mesa == null) continue;
        if ((pedido['estado'] ?? '').toString() == 'CANCELADO') continue;

        for (final d in (pedido['detalle_pedido'] as List<dynamic>? ?? const [])) {
          final det = Map<String, dynamic>.from(d as Map);
          mesa.totalPlatos += 1;
          mesa.pedidoActivo = true;
          final estado = (det['estado'] ?? '').toString();
          if (estado == 'LISTO') mesa.platosListos += 1;
          if (estado == 'ENTREGADO') mesa.platosEntregados += 1;
        }
      }

      final out = map.values.toList()..sort((a, b) => a.numero.compareTo(b.numero));
      if (mounted) setState(() => mesas = out);
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
          refreshing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<MeseroAuthState>();
    final cs = Theme.of(context).colorScheme;

    final mesasActivas = mesas.where((m) => m.pedidoActivo).length;
    final mesasLibres = mesas.where((m) => !m.pedidoActivo).length;
    final mesasConListos = mesas.where((m) => m.platosListos > 0).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mesas'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(42),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(auth.restaurante?.nombre ?? 'Restaurante', style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 12)),
            ),
          ),
        ),
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
                Expanded(child: _Stat(label: 'Activas', value: '$mesasActivas', color: cs.primary, icon: Icons.people_outline)),
                const SizedBox(width: 10),
                Expanded(child: _Stat(label: 'Libres', value: '$mesasLibres', color: cs.onSurface.withOpacity(0.6), icon: Icons.table_restaurant_outlined)),
                const SizedBox(width: 10),
                Expanded(child: _Stat(label: 'Por servir', value: '$mesasConListos', color: Colors.green, icon: Icons.flash_on_outlined)),
              ],
            ),
            const SizedBox(height: 14),
            if (loading)
              Center(child: Padding(padding: const EdgeInsets.only(top: 30), child: CircularProgressIndicator(color: cs.primary))),
            if (!loading && mesas.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Center(child: Text('No hay mesas configuradas', style: TextStyle(color: cs.onSurface.withOpacity(0.6)))),
              ),
            if (mesas.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.25,
                ),
                itemCount: mesas.length,
                itemBuilder: (context, idx) => _MesaCard(m: mesas[idx]),
              ),
          ],
        ),
      ),
    );
  }
}

class _MesaEstado {
  final String id;
  final int numero;
  bool pedidoActivo;
  int platosListos;
  int totalPlatos;
  int platosEntregados;

  _MesaEstado({
    required this.id,
    required this.numero,
    required this.pedidoActivo,
    required this.platosListos,
    required this.totalPlatos,
    required this.platosEntregados,
  });
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  const _Stat({required this.label, required this.value, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: cs.surfaceContainerHighest,
        border: Border.all(color: cs.outlineVariant.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(color: color.withOpacity(0.14), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 16, color: color),
              ),
              const Spacer(),
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: cs.onSurface)),
            ],
          ),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _MesaCard extends StatelessWidget {
  final _MesaEstado m;
  const _MesaCard({required this.m});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final progress = m.totalPlatos == 0 ? 0.0 : ((m.platosListos + m.platosEntregados) / m.totalPlatos).clamp(0.0, 1.0);

    String label;
    Color color;
    IconData icon;
    if (!m.pedidoActivo) {
      label = 'Libre';
      color = cs.onSurface.withOpacity(0.55);
      icon = Icons.remove_circle_outline;
    } else if (m.platosListos > 0) {
      label = '${m.platosListos} por servir';
      color = Colors.green;
      icon = Icons.check_circle;
    } else if (m.platosEntregados == m.totalPlatos && m.totalPlatos > 0) {
      label = 'Todo entregado';
      color = cs.tertiary;
      icon = Icons.verified;
    } else {
      label = 'En preparación';
      color = cs.secondary;
      icon = Icons.local_fire_department;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: cs.surface,
        border: Border.all(color: m.pedidoActivo ? cs.primary.withOpacity(0.20) : cs.outlineVariant.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: m.pedidoActivo ? cs.primary.withOpacity(0.12) : cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    '${m.numero}',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: m.pedidoActivo ? cs.primary : cs.onSurface.withOpacity(0.6)),
                  ),
                ),
              ),
              const Spacer(),
              if (m.pedidoActivo)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(999)),
                  child: Text('${m.platosListos + m.platosEntregados}/${m.totalPlatos}', style: TextStyle(color: cs.onSurface.withOpacity(0.7), fontSize: 10, fontWeight: FontWeight.w800)),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text('Mesa ${m.numero}', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: cs.onSurface)),
          const SizedBox(height: 4),
          Row(
            children: [
              Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Expanded(child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 11), overflow: TextOverflow.ellipsis)),
              Icon(icon, size: 14, color: color.withOpacity(0.85)),
            ],
          ),
          if (m.pedidoActivo) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 6,
                backgroundColor: cs.surfaceContainerHighest,
                valueColor: AlwaysStoppedAnimation<Color>(progress >= 1 ? cs.tertiary : Colors.green),
              ),
            ),
            const SizedBox(height: 4),
            Text('${(progress * 100).round()}%', style: TextStyle(color: cs.onSurface.withOpacity(0.55), fontSize: 10)),
          ],
        ],
      ),
    );
  }
}
