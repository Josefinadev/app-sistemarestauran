import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/auth_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  bool showPass = false;
  bool loading = false;
  String? error;

  @override
  void dispose() {
    emailCtrl.dispose();
    passCtrl.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    final email = emailCtrl.text.trim();
    final pass = passCtrl.text;

    if (email.isEmpty || pass.trim().isEmpty) {
      setState(() => error = 'Completa todos los campos.');
      return;
    }

    setState(() {
      loading = true;
      error = null;
    });

    try {
      await context.read<MeseroAuthState>().login(email, pass);
      
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -120,
            right: -90,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: cs.primary.withOpacity(0.12),
              ),
            ),
          ),
          Positioned(
            bottom: -80,
            left: -110,
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: cs.tertiary.withOpacity(0.10),
              ),
            ),
          ),
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: cs.primary.withOpacity(0.12),
                      ),
                      child: Icon(Icons.restaurant, color: cs.primary, size: 36),
                    ),
                    const SizedBox(height: 12),
                    Text('El Mijano', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: cs.onSurface)),
                    Text('Panel del Mesero', style: TextStyle(color: cs.onSurface.withOpacity(0.6))),
                    const SizedBox(height: 18),
                    Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('Iniciar Sesion', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: cs.onSurface)),
                            const SizedBox(height: 6),
                            Text('Ingresa con tu cuenta de mesero', style: TextStyle(color: cs.onSurface.withOpacity(0.6))),
                            if (error != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  color: cs.error.withOpacity(0.10),
                                  border: Border.all(color: cs.error.withOpacity(0.25)),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.error_outline, color: cs.error, size: 18),
                                    const SizedBox(width: 8),
                                    Expanded(child: Text(error!, style: TextStyle(color: cs.error))),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 14),
                            TextField(
                              controller: emailCtrl,
                              enabled: !loading,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                prefixIcon: Icon(Icons.mail_outline),
                              ),
                              onSubmitted: (_) => submit(),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: passCtrl,
                              enabled: !loading,
                              obscureText: !showPass,
                              decoration: InputDecoration(
                                labelText: 'Contrasena',
                                prefixIcon: const Icon(Icons.lock_outline),
                                suffixIcon: IconButton(
                                  onPressed: () => setState(() => showPass = !showPass),
                                  icon: Icon(showPass ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                                ),
                              ),
                              onSubmitted: (_) => submit(),
                            ),
                            const SizedBox(height: 14),
                            FilledButton(
                              onPressed: loading ? null : submit,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: loading
                                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text('Ingresar'),
                                          SizedBox(width: 8),
                                          Icon(Icons.arrow_forward, size: 18),
                                        ],
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text('El Mijano © ${DateTime.now().year}', style: TextStyle(color: cs.onSurface.withOpacity(0.5))),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
