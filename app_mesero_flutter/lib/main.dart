import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/config/app_config.dart';
import 'src/state/auth_state.dart';
import 'src/state/theme_state.dart';
import 'src/ui/root_gate.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
    realtimeClientOptions: const RealtimeClientOptions(eventsPerSecond: 20),
  );

  final themeState = ThemeState();
  final authState = MeseroAuthState();
  await Future.wait([themeState.init(), authState.restoreSession()]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: themeState),
        ChangeNotifierProvider.value(value: authState),
      ],
      child: const MeseroApp(),
    ),
  );
}

class MeseroApp extends StatelessWidget {
  const MeseroApp({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeState>();
    final auth = context.watch<MeseroAuthState>();

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'El Mijano - Mesero',
      theme: theme.lightTheme(primaryHex: auth.restaurante?.colorPrimario),
      darkTheme: theme.darkTheme(primaryHex: auth.restaurante?.colorPrimario),
      themeMode: theme.isDark ? ThemeMode.dark : ThemeMode.light,
      home: const RootGate(),
    );
  }
}
