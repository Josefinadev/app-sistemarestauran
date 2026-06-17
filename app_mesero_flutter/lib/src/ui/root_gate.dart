import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/auth_state.dart';
import 'screens/login_screen.dart';
import 'tabs/home_tabs.dart';

const _kGold   = Color(0xFFC5A028);
const _kGoldLt = Color(0xFFE2BA50);
const _kDark   = Color(0xFF1A1408);
const _kCream  = Color(0xFFF5F0E6);

class RootGate extends StatefulWidget {
  const RootGate({super.key});

  @override
  State<RootGate> createState() => _RootGateState();
}

class _RootGateState extends State<RootGate> {
  // Controla si el splash ya terminó su animación mínima
  bool _splashDone = false;

  @override
  void initState() {
    super.initState();
    // Garantiza que el splash se muestre al menos 2 segundos
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) setState(() => _splashDone = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<MeseroAuthState>();

    // Mostrar splash mientras carga O mientras el timer no haya terminado
    if (auth.isLoading || !_splashDone) {
      return const _SplashScreen();
    }

    if (!auth.isAuthenticated) return const LoginScreen();
    return const HomeTabs();
  }
}

/* ══════════════════════════════════════════════════════════
   SPLASH / ONBOARDING SCREEN
   ══════════════════════════════════════════════════════════ */
class _SplashScreen extends StatefulWidget {
  const _SplashScreen();

  @override
  State<_SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<_SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoCtrl;
  late AnimationController _textCtrl;
  late AnimationController _dotCtrl;

  late Animation<double> _logoScale;
  late Animation<double> _logoFade;
  late Animation<double> _textFade;
  late Animation<Offset>  _textSlide;
  late Animation<double> _dotFade;

  @override
  void initState() {
    super.initState();

    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _textCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _dotCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 800),)
      ..repeat(reverse: true);

    _logoScale = Tween<double>(begin: 0.55, end: 1.0).animate(
        CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _logoCtrl, curve: const Interval(0, 0.5, curve: Curves.easeIn)));

    _textFade  = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _textCtrl, curve: Curves.easeIn));
    _textSlide = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
        CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));
    _dotFade   = Tween<double>(begin: 0.3, end: 1.0).animate(_dotCtrl);

    // Secuencia: logo → texto
    _logoCtrl.forward().then((_) => _textCtrl.forward());
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _textCtrl.dispose();
    _dotCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: _kCream,
      body: Stack(
        children: [
          // Círculos decorativos de fondo
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _kGold.withOpacity(0.06),
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -60,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _kGold.withOpacity(0.08),
              ),
            ),
          ),

          // Ornamento dorado top-left
          Positioned(
            top: 20,
            left: 20,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                  left: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                ),
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(6)),
              ),
            ),
          ),
          // Ornamento dorado top-right
          Positioned(
            top: 20,
            right: 20,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                  right: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                ),
                borderRadius: const BorderRadius.only(topRight: Radius.circular(6)),
              ),
            ),
          ),
          // Ornamento dorado bottom-left
          Positioned(
            bottom: 20,
            left: 20,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                  left: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                ),
                borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(6)),
              ),
            ),
          ),
          // Ornamento dorado bottom-right
          Positioned(
            bottom: 20,
            right: 20,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                  right: BorderSide(color: _kGold.withOpacity(0.5), width: 1.5),
                ),
                borderRadius: const BorderRadius.only(bottomRight: Radius.circular(6)),
              ),
            ),
          ),

          // Contenido central
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo animado
                FadeTransition(
                  opacity: _logoFade,
                  child: ScaleTransition(
                    scale: _logoScale,
                    child: Image.asset(
                      'assets/Ordely.png',
                      width: size.width * 0.58,
                      height: size.width * 0.40,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Línea dorada divisora
                FadeTransition(
                  opacity: _textFade,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 40,
                        height: 1,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(colors: [Colors.transparent, _kGold]),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'SISTEMA DE GESTIÓN',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.18,
                            color: _kDark.withOpacity(0.55),
                          ),
                        ),
                      ),
                      Container(
                        width: 40,
                        height: 1,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(colors: [_kGold, Colors.transparent]),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Texto animado
                SlideTransition(
                  position: _textSlide,
                  child: FadeTransition(
                    opacity: _textFade,
                    child: Column(
                      children: [
                        Text(
                          'Gestión Inteligente',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: _kDark,
                            letterSpacing: 0.02,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'para Restaurantes',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            fontStyle: FontStyle.italic,
                            color: _kGold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 52),

                // Dots de carga animados
                FadeTransition(
                  opacity: _dotFade,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (i) => AnimatedBuilder(
                      animation: _dotCtrl,
                      builder: (_, __) {
                        final t = (_dotCtrl.value - i * 0.3).clamp(0.0, 1.0);
                        return Container(
                          margin: const EdgeInsets.symmetric(horizontal: 5),
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _kGold.withOpacity(0.3 + t * 0.7),
                          ),
                        );
                      },
                    )),
                  ),
                ),
              ],
            ),
          ),

          // Footer
          Positioned(
            bottom: 36,
            left: 0,
            right: 0,
            child: FadeTransition(
              opacity: _textFade,
              child: Text(
                'TRUJILLO, PERÚ — © 2026',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.15,
                  color: _kDark.withOpacity(0.35),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
