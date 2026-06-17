import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/auth_state.dart';

const _kGold = Color(0xFFC5A059);
const _kTextDark = Color(0xFF1A1814);
const _kTextMuted = Color(0xFF9B9386);
const _kTextSec = Color(0xFF4A4539);
const _kBg = Color(0xFFF7F6F3);
const _kBorder = Color(0xFFE5E2DC);
const _kSurface = Color(0xFFFFFFFF);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _showPass = false;
  bool _loading = false;
  String? _error;
  bool _emailFocus = false;
  bool _passFocus = false;

  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  late Animation<double> _logoScaleAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
          parent: _animCtrl,
          curve: const Interval(0.0, 0.65, curve: Curves.easeIn)),
    );
    _slideAnim = Tween<Offset>(
            begin: const Offset(0, 0.2), end: Offset.zero)
        .animate(CurvedAnimation(
            parent: _animCtrl,
            curve: const Interval(0.1, 1.0, curve: Curves.easeOut)));
    _logoScaleAnim = Tween<double>(begin: 0.55, end: 1.0).animate(
      CurvedAnimation(
          parent: _animCtrl,
          curve: const Interval(0.0, 0.8, curve: Curves.elasticOut)),
    );
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Completa todos los campos.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<MeseroAuthState>().login(email, pass);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(28, 32, 28, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // ── Logo Ordely ──
                  ScaleTransition(
                    scale: _logoScaleAnim,
                    child: Image.asset(
                      'assets/Ordely.png',
                      width: 170,
                      height: 115,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // ── — SISTEMA DE GESTIÓN — ──
                  _SystemLabel(),
                  const SizedBox(height: 22),

                  // ── Heading ──
                  const Text(
                    'Bienvenido',
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      color: _kTextDark,
                      height: 1.1,
                    ),
                  ),
                  const Text(
                    'de vuelta',
                    style: TextStyle(
                      fontSize: 25,
                      fontWeight: FontWeight.w400,
                      fontStyle: FontStyle.italic,
                      color: _kGold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(width: 36, height: 2, color: _kGold),
                  const SizedBox(height: 26),

                  // ── Campo Email ──
                  _FieldLabel('CORREO ELECTRÓNICO'),
                  const SizedBox(height: 6),
                  _InputField(
                    controller: _emailCtrl,
                    hint: 'tu@email.com',
                    icon: Icons.mail_outline,
                    keyboardType: TextInputType.emailAddress,
                    isFocused: _emailFocus,
                    onFocusChange: (v) => setState(() => _emailFocus = v),
                    onSubmitted: (_) => _submit(),
                  ),
                  const SizedBox(height: 16),

                  // ── Campo Contraseña ──
                  _FieldLabel('CONTRASEÑA'),
                  const SizedBox(height: 6),
                  _InputField(
                    controller: _passCtrl,
                    hint: '••••••••',
                    icon: Icons.lock_outline,
                    obscure: !_showPass,
                    isFocused: _passFocus,
                    onFocusChange: (v) => setState(() => _passFocus = v),
                    onSubmitted: (_) => _submit(),
                    suffix: IconButton(
                      onPressed: () => setState(() => _showPass = !_showPass),
                      icon: Icon(
                        _showPass
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 18,
                        color: _kTextMuted,
                      ),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ),

                  // ── Error ──
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 9),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.07),
                        border: Border.all(
                            color: Colors.red.withOpacity(0.2), width: 1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline,
                              color: Colors.red, size: 14),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(_error!,
                                style: const TextStyle(
                                    color: Colors.red, fontSize: 12)),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),

                  // ── Botón INICIAR SESIÓN ──
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _kGold,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: _kGold.withOpacity(0.5),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      child: _loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.login, size: 16),
                                SizedBox(width: 10),
                                Text(
                                  'INICIAR SESIÓN',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    letterSpacing: 0.12,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Stats ──
                  _StatsRow(),
                  const SizedBox(height: 22),

                  // ── Footer ──
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.shield_outlined, size: 12, color: _kTextMuted),
                      SizedBox(width: 4),
                      Text(
                        'Conexión segura · Supabase Auth',
                        style: TextStyle(fontSize: 10, color: _kTextMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'TRUJILLO, PERU — © 2026',
                    style: TextStyle(
                        fontSize: 9,
                        color: _kTextMuted,
                        letterSpacing: 0.08,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Widgets auxiliares
// ─────────────────────────────────────────────

class _SystemLabel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: Container(
            height: 1,
            margin: const EdgeInsets.only(right: 10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                  colors: [Colors.transparent, _kGold.withOpacity(0.5)]),
            ),
          ),
        ),
        const Text(
          'SISTEMA DE GESTIÓN',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.14,
            color: _kTextMuted,
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            margin: const EdgeInsets.only(left: 10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                  colors: [_kGold.withOpacity(0.5), Colors.transparent]),
            ),
          ),
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.13,
          color: _kTextSec,
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final bool isFocused;
  final TextInputType keyboardType;
  final ValueChanged<bool> onFocusChange;
  final ValueChanged<String> onSubmitted;
  final Widget? suffix;

  const _InputField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscure = false,
    required this.isFocused,
    this.keyboardType = TextInputType.text,
    required this.onFocusChange,
    required this.onSubmitted,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: onFocusChange,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          color: isFocused ? _kSurface : _kBg,
          border: Border.all(
            color: isFocused ? _kGold : _kBorder,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Icon(icon, size: 16, color: _kTextMuted),
            ),
            Expanded(
              child: TextField(
                controller: controller,
                obscureText: obscure,
                keyboardType: keyboardType,
                onSubmitted: onSubmitted,
                style: const TextStyle(fontSize: 14, color: _kTextDark),
                decoration: InputDecoration(
                  hintText: hint,
                  hintStyle: const TextStyle(color: _kTextMuted, fontSize: 14),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding:
                      const EdgeInsets.symmetric(vertical: 13, horizontal: 0),
                ),
              ),
            ),
            if (suffix != null)
              Padding(
                  padding: const EdgeInsets.only(right: 10), child: suffix!),
          ],
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _kSurface,
        border: Border.all(color: _kGold.withOpacity(0.25), width: 1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _StatCell(icon: Icons.people_outline, value: '4', label: 'ROLES'),
          _StatDivider(),
          _StatCell(
              icon: Icons.access_time_outlined, value: '24/7', label: 'REAL-TIME'),
          _StatDivider(),
          _StatCell(
              icon: Icons.grid_view_outlined,
              value: '8',
              label: 'MULTI-TENANT'),
        ],
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  const _StatCell(
      {required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          children: [
            Icon(icon, size: 16, color: _kGold),
            const SizedBox(height: 3),
            Text(value,
                style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: _kTextDark)),
            const SizedBox(height: 1),
            Text(label,
                style: const TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.09,
                    color: _kTextMuted)),
          ],
        ),
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
        width: 1,
        height: 48,
        color: _kGold.withOpacity(0.2));
  }
}
