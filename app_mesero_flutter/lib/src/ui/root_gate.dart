import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/auth_state.dart';
import 'screens/login_screen.dart';
import 'tabs/home_tabs.dart';

class RootGate extends StatelessWidget {
  const RootGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<MeseroAuthState>();

    if (auth.isLoading) {
      return const _LoadingScreen();
    }

    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }

    return const HomeTabs();
  }
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(Icons.restaurant, color: cs.primary, size: 36),
            ),
            const SizedBox(height: 20),
            CircularProgressIndicator(color: cs.primary),
            const SizedBox(height: 14),
            Text('El Mijano', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: cs.onSurface)),
            const SizedBox(height: 4),
            Text('Cargando...', style: TextStyle(color: cs.onSurface.withOpacity(0.6))),
          ],
        ),
      ),
    );
  }
}
