import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../screens/mesas_screen.dart';
import '../screens/pedidos_screen.dart';
import '../screens/perfil_screen.dart';
import '../screens/tomar_pedido_screen.dart';
import '../../state/auth_state.dart';

class HomeTabs extends StatefulWidget {
  const HomeTabs({super.key});

  @override
  State<HomeTabs> createState() => _HomeTabsState();
}

class _HomeTabsState extends State<HomeTabs> {
  int index = 0;

  final pages = const [
    PedidosScreen(),
    TomarPedidoScreen(),
    MesasScreen(),
    PerfilScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: IndexedStack(
        index: index,
        children: pages,
      ),
      bottomNavigationBar: NavigationBar(
        height: 74,
        backgroundColor: Theme.of(context).cardColor,
        indicatorColor: cs.primary.withOpacity(0.14),
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.receipt_outlined), selectedIcon: Icon(Icons.receipt), label: 'Pedidos'),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: 'Nuevo'),
          NavigationDestination(icon: Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view), label: 'Mesas'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }
}
