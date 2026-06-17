import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/auth_state.dart';

const _kGold    = Color(0xFFC5A028);
const _kGoldDk  = Color(0xFFA8841A);
const _kDark    = Color(0xFF1A1408);
const _kGray    = Color(0xFF6B5F40);
const _kBorder  = Color(0xFFDDD5C0);
const _kBg      = Color(0xFFF5F0E6);
const _kSurface = Color(0xFFFFFFFF);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _showPass   = false;
  bool _loading    = false;
  String? _error;

  late AnimationController _animCtrl;
  late Animation<double>   _fadeAnim;
  late Animation<Offset>   _slideAnim;
  late Animation<double>   _logoAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _fadeAnim  = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _animCtrl, curve: const Interval(0, 0.65, curve: Curves.easeIn)));
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.18), end: Offset.zero).animate(
        CurvedAnimation(parent: _animCtrl, curve: const Interval(0.1, 1, curve: Curves.easeOut)));
    _logoAnim  = Tween<double>(begin: 0.6, end: 1.0).animate(
        CurvedAnimation(parent: _animCtrl, curve: const Interval(0, 0.75, curve: Curves.elasticOut)));
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
    final pass  = _passCtrl.text;
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Completa todos los campos.');
      return;
    }
    setState(() { _loading = true; _error = null; });
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
    final size   = MediaQuery.of(context).size;
    final isWide = size.width > 480;

    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: EdgeInsets.symmetric(
                  horizontal: isWide ? size.width * 0.12 : 24,
                  vertical: 24,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Logo ──
                      ScaleTransition(
                        scale: _logoAnim,
                        child: Center(
                          child: Image.asset(
                            'assets/Ordely.png',
                            width: isWide ? size.width * 0.35 : size.width * 0.55,
                            height: isWide ? 140 : 120,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      SizedBox(height: size.height * 0.025),

                      // ── SISTEMA DE GESTIÓN ──
                      _SystemBadge(),
                      SizedBox(height: size.height * 0.03),

                      // ── Heading ──
                      Text(
                        'Bienvenido',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: isWide ? 32 : 28,
                          fontWeight: FontWeight.w700,
                          color: _kDark,
                          height: 1.1,
                        ),
                      ),
                      Text(
                        'de vuelta',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: isWide ? 28 : 24,
                          fontWeight: FontWeight.w400,
                          fontStyle: FontStyle.italic,
                          color: _kGold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Center(child: Container(width: 32, height: 2, color: _kGold)),
                      SizedBox(height: size.height * 0.035),

                      // ── Email ──
                      _FieldLabel('CORREO ELECTRÓNICO'),
                      const SizedBox(height: 6),
                      _InputBox(
                        controller: _emailCtrl,
                        hint: 'tu@email.com',
                        icon: Icons.mail_outline,
                        keyboardType: TextInputType.emailAddress,
                        onSubmitted: (_) => _submit(),
                      ),
                      SizedBox(height: size.height * 0.018),

                      // ── Contraseña ──
                      _FieldLabel('CONTRASEÑA'),
                      const SizedBox(height: 6),
                      _InputBox(
                        controller: _passCtrl,
                        hint: '••••••••',
                        icon: Icons.lock_outline,
                        obscure: !_showPass,
                        onSubmitted: (_) => _submit(),
                        suffix: GestureDetector(
                          onTap: () => setState(() => _showPass = !_showPass),
                          child: Padding(
                            padding: const EdgeInsets.only(right: 12),
                            child: Icon(
                              _showPass ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              size: 18,
                              color: _kGray,
                            ),
                          ),
                        ),
                      ),

                      // ── Error ──
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.07),
                            border: Border.all(color: Colors.red.withOpacity(0.2)),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, color: Colors.red, size: 15),
                              const SizedBox(width: 8),
                              Expanded(child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12))),
                            ],
                          ),
                        ),
                      ],
                      SizedBox(height: size.height * 0.025),

                      // ── Botón ──
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _kGold,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: _kGold.withOpacity(0.5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            elevation: 0,
                          ),
                          child: _loading
                              ? const SizedBox(width: 20, height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.login, size: 17),
                                    SizedBox(width: 10),
                                    Text('INICIAR SESIÓN',
                                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.12)),
                                  ],
                                ),
                        ),
                      ),
                      SizedBox(height: size.height * 0.03),

                      // ── Stats ──
                      _StatsRow(),
                      SizedBox(height: size.height * 0.025),

                      // ── Footer ──
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: const [
                        Icon(Icons.shield_outlined, size: 12, color: _kGray),
                        SizedBox(width: 4),
                        Text('Conexión segura · Supabase Auth',
                            style: TextStyle(fontSize: 10, color: _kGray)),
                      ]),
                      const SizedBox(height: 4),
                      const Text('TRUJILLO, PERU — © 2026',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 9, color: _kGray, letterSpacing: 0.08, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Widgets de soporte
// ─────────────────────────────────────────────

class _SystemBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(child: Container(height: 1,
            decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [Colors.transparent, _kGold])))),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text('SISTEMA DE GESTIÓN',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                  letterSpacing: 0.15, color: _kGray)),
        ),
        Expanded(child: Container(height: 1,
            decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [_kGold, Colors.transparent])))),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);
  @override
  Widget build(BuildContext context) =>
      Text(text, style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700,
          letterSpacing: 0.13, color: _kGray));
}

class _InputBox extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final TextInputType keyboardType;
  final ValueChanged<String> onSubmitted;
  final Widget? suffix;

  const _InputBox({
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    required this.onSubmitted,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: _kSurface,
        border: Border.all(color: _kBorder, width: 1.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Icon(icon, size: 17, color: _kGray),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: obscure,
              keyboardType: keyboardType,
              onSubmitted: onSubmitted,
              style: const TextStyle(fontSize: 14, color: _kDark),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(color: _kGray.withOpacity(0.6), fontSize: 14),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          if (suffix != null) suffix!,
        ],
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
        border: Border.all(color: _kBorder, width: 1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            _StatCell(icon: Icons.people_outline, value: '4', label: 'ROLES'),
            VerticalDivider(color: _kBorder, width: 1, thickness: 1),
            _StatCell(icon: Icons.access_time_outlined, value: '24/7', label: 'REAL-TIME'),
            VerticalDivider(color: _kBorder, width: 1, thickness: 1),
            _StatCell(icon: Icons.grid_view_outlined, value: '8', label: 'MULTI-TENANT'),
          ],
        ),
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  const _StatCell({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: _kGold),
            const SizedBox(height: 3),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: _kDark, height: 1)),
            const SizedBox(height: 1),
            Text(label, style: const TextStyle(fontSize: 7.5, fontWeight: FontWeight.w700, letterSpacing: 0.08, color: _kGray)),
          ],
        ),
      ),
    );
  }
}
