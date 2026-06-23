import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/api_client.dart';
import '../../state/auth_state.dart';
import '../../state/theme_state.dart';

class PerfilScreen extends StatefulWidget {
  const PerfilScreen({super.key});

  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  bool loadingStats = true;
  int totalEntregados = 0;
  int pedidosHoy = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadStats());
  }

  Future<void> _loadStats() async {
    final rest = context.read<MeseroAuthState>().restaurante;
    if (rest == null) return;
    setState(() => loadingStats = true);
    try {
      final data = await ApiClient.getJson('/pedidos?id_restaurante=${rest.id}') as List<dynamic>?;
      final hoy = DateTime.now();
      int entregados = 0;
      int hoyCount = 0;

      DateTime? parseDate(String? d) {
        if (d == null || d.isEmpty) return null;
        if (!d.endsWith('Z') && !d.contains('+')) {
          final tIdx = d.indexOf('T');
          if (tIdx != -1 && d.lastIndexOf('-') < tIdx) {
            d += 'Z';
          }
        }
        return DateTime.tryParse(d)?.toLocal();
      }

      for (final p in (data ?? const [])) {
        final pedido = Map<String, dynamic>.from(p as Map);
        final created = parseDate((pedido['created_at'] ?? '').toString());
        if (created != null && created.year == hoy.year && created.month == hoy.month && created.day == hoy.day) {
          hoyCount += 1;
        }
        for (final d in (pedido['detalle_pedido'] as List<dynamic>? ?? const [])) {
          final det = Map<String, dynamic>.from(d as Map);
          if ((det['estado'] ?? '').toString() == 'ENTREGADO') entregados += 1;
        }
      }

      setState(() {
        totalEntregados = entregados;
        pedidosHoy = hoyCount;
      });
    } finally {
      if (mounted) setState(() => loadingStats = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<MeseroAuthState>();
    final theme = context.watch<ThemeState>();
    final cs = Theme.of(context).colorScheme;

    final nombre = auth.usuario?.nombre ?? 'Mesero';
    final email = auth.usuario?.email ?? '';
    final rol = (auth.usuario?.rol ?? 'mesero').toUpperCase();
    final rest = auth.restaurante;

    final initials = nombre
        .split(' ')
        .where((w) => w.trim().isNotEmpty)
        .take(2)
        .map((w) => w.trim().substring(0, 1).toUpperCase())
        .join();

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
        children: [
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: cs.outlineVariant.withOpacity(0.35))),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: cs.primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Center(
                      child: Text(initials.isEmpty ? '??' : initials, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: cs.primary)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(nombre, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: cs.onSurface)),
                  if (email.isNotEmpty) Text(email, style: TextStyle(color: cs.onSurface.withOpacity(0.6))),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: cs.primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: cs.primary.withOpacity(0.35)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.person, size: 14, color: cs.primary),
                        const SizedBox(width: 6),
                        Text(rol, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: cs.primary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          _SectionTitle('Restaurante'),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: cs.outlineVariant.withOpacity(0.35))),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                children: [
                  _InfoRow(icon: Icons.restaurant, iconBg: cs.primary.withOpacity(0.12), iconColor: cs.primary, label: 'Nombre', value: rest?.nombre ?? '—'),
                  if ((rest?.direccion ?? '').trim().isNotEmpty) const SizedBox(height: 10),
                  if ((rest?.direccion ?? '').trim().isNotEmpty)
                    _InfoRow(icon: Icons.location_on, iconBg: cs.tertiary.withOpacity(0.12), iconColor: cs.tertiary, label: 'Dirección', value: rest!.direccion!),
                  if ((rest?.telefono ?? '').trim().isNotEmpty) const SizedBox(height: 10),
                  if ((rest?.telefono ?? '').trim().isNotEmpty)
                    _InfoRow(icon: Icons.call, iconBg: Colors.green.withOpacity(0.12), iconColor: Colors.green, label: 'Teléfono', value: rest!.telefono!),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),
          _SectionTitle('Resumen de Hoy'),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.checklist,
                  color: Colors.green,
                  label: 'Entregados',
                  value: loadingStats ? '...' : '$totalEntregados',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  icon: Icons.receipt_long,
                  color: cs.primary,
                  label: 'Pedidos hoy',
                  value: loadingStats ? '...' : '$pedidosHoy',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _SectionTitle('Configuración'),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: cs.outlineVariant.withOpacity(0.35))),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
                    child: Icon(theme.isDark ? Icons.dark_mode : Icons.light_mode, size: 18, color: theme.isDark ? cs.secondary : cs.tertiary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Modo oscuro', style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface)),
                        Text(theme.isDark ? 'Activado' : 'Desactivado', style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 12)),
                      ],
                    ),
                  ),
                  Switch(
                    value: theme.isDark,
                    onChanged: (_) => context.read<ThemeState>().toggle(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          _SectionTitle('Aplicación'),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: cs.outlineVariant.withOpacity(0.35))),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                children: [
                  _InfoRow(icon: Icons.info_outline, iconBg: cs.surfaceContainerHighest, iconColor: cs.onSurface.withOpacity(0.6), label: 'Versión', value: '1.0.0'),
                  const SizedBox(height: 10),
                  _InfoRow(icon: Icons.circle, iconBg: Colors.green.withOpacity(0.12), iconColor: Colors.green, label: 'Estado del servidor', value: 'Conectado'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          FilledButton.tonalIcon(
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Cerrar sesión'),
                  content: const Text('¿Estás seguro de que deseas salir?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
                    FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Cerrar')),
                  ],
                ),
              );
              if (ok == true && mounted) {
                await context.read<MeseroAuthState>().logout();
              }
            },
            icon: Icon(Icons.logout, color: cs.error),
            label: Text('Cerrar sesión', style: TextStyle(color: cs.error, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface.withOpacity(0.75), fontSize: 12)),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final String value;
  const _InfoRow({required this.icon, required this.iconBg, required this.iconColor, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, size: 18, color: iconColor),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(color: cs.onSurface.withOpacity(0.55), fontSize: 11, fontWeight: FontWeight.w700)),
              Text(value, style: TextStyle(color: cs.onSurface, fontWeight: FontWeight.w900)),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String value;
  const _StatCard({required this.icon, required this.color, required this.label, required this.value});

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
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: cs.onSurface)),
              Text(label, style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }
}
