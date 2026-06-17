import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../state/auth_state.dart';

class TomarPedidoScreen extends StatefulWidget {
  const TomarPedidoScreen({super.key});

  @override
  State<TomarPedidoScreen> createState() => _TomarPedidoScreenState();
}

class _TomarPedidoScreenState extends State<TomarPedidoScreen> {
  bool loading = true;
  Mesa? selectedMesa;
  List<Mesa> mesas = [];
  List<Categoria> categorias = [];
  List<Producto> productos = [];
  String? selectedCategoria;
  String searchText = '';

  final List<_CartItem> cart = [];
  String notasPedido = '';
  bool sending = false;

  // Success overlay state
  bool _showSuccess = false;
  int _successMesa = 0;
  double _successTotal = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final rest = context.read<MeseroAuthState>().restaurante;
    if (rest == null) return;
    setState(() => loading = true);
    try {
      final results = await Future.wait([
        ApiClient.getJson('/mesas?id_restaurante=${rest.id}'),
        ApiClient.getJson('/productos?id_restaurante=${rest.id}&disponible=true'),
        ApiClient.getJson('/categorias?id_restaurante=${rest.id}'),
      ]);

      mesas
        ..clear()
        ..addAll(((results[0] as List<dynamic>?) ?? const []).map((m) => Mesa.fromJson(Map<String, dynamic>.from(m as Map))));
      mesas.sort((a, b) => a.numero.compareTo(b.numero));

      productos
        ..clear()
        ..addAll(((results[1] as List<dynamic>?) ?? const []).map((p) => Producto.fromJson(Map<String, dynamic>.from(p as Map))));

      categorias
        ..clear()
        ..addAll(((results[2] as List<dynamic>?) ?? const []).map((c) => Categoria.fromJson(Map<String, dynamic>.from(c as Map))));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  List<Producto> get _filtered {
    Iterable<Producto> list = productos;
    if (selectedCategoria != null) {
      list = list.where((p) => p.idCategoria == selectedCategoria);
    }
    final q = searchText.trim().toLowerCase();
    if (q.isNotEmpty) {
      list = list.where((p) => p.nombre.toLowerCase().contains(q));
    }
    return list.toList();
  }

  int _qty(String productId) {
    final idx = cart.indexWhere((c) => c.idProducto == productId);
    return idx < 0 ? 0 : cart[idx].cantidad;
  }

  void _add(Producto p) {
    final idx = cart.indexWhere((c) => c.idProducto == p.id);
    setState(() {
      if (idx >= 0) {
        cart[idx] = cart[idx].copyWith(cantidad: cart[idx].cantidad + 1);
      } else {
        cart.add(_CartItem(
          idProducto: p.id,
          nombre: p.nombre,
          precio: p.precio,
          cantidad: 1,
          notas: '',
          esBebida: p.esBebida,
        ));
      }
    });
  }

  void _updateQty(String id, int delta) {
    final idx = cart.indexWhere((c) => c.idProducto == id);
    if (idx < 0) return;
    final next = cart[idx].cantidad + delta;
    setState(() {
      if (next <= 0) {
        cart.removeAt(idx);
      } else {
        cart[idx] = cart[idx].copyWith(cantidad: next);
      }
    });
  }

  double get _total => cart.fold(0, (s, c) => s + (c.precio * c.cantidad));
  int get _count => cart.fold(0, (s, c) => s + c.cantidad);

  Future<void> _send() async {
    final rest = context.read<MeseroAuthState>().restaurante;
    final user = context.read<MeseroAuthState>().usuario;
    if (rest == null || selectedMesa == null || cart.isEmpty) return;

    final mesaNumero = selectedMesa!.numero;
    final total = _total;

    setState(() => sending = true);
    try {
      await ApiClient.postJson('/pedidos', {
        'id_restaurante': rest.id,
        'id_mesa': selectedMesa!.id,
        'id_usuario': user?.id,
        if (notasPedido.trim().isNotEmpty) 'notas': notasPedido.trim(),
        'items': cart
            .map((c) => {
                  'id_producto': c.idProducto,
                  'cantidad': c.cantidad,
                  if (c.notas.trim().isNotEmpty) 'notas': c.notas.trim(),
                })
            .toList(),
      });

      if (!mounted) return;

      // Cierra el bottom sheet del carrito
      Navigator.of(context).pop();

      // Resetea estado y muestra el overlay de éxito
      setState(() {
        cart.clear();
        notasPedido = '';
        selectedMesa = null;
        selectedCategoria = null;
        searchText = '';
        _showSuccess = true;
        _successMesa = mesaNumero;
        _successTotal = total;
      });

      // Auto-descarta el overlay tras 2 segundos
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _showSuccess = false);
      });
    } catch (e) {
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Error'),
          content: Text(e.toString()),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
        ),
      );
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  Future<void> _openCart() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _CartSheet(
        mesaNumero: selectedMesa!.numero,
        cart: cart,
        notasPedido: notasPedido,
        total: _total,
        sending: sending,
        onUpdateQty: (id, delta) => _updateQty(id, delta),
        onRemove: (id) => setState(() => cart.removeWhere((c) => c.idProducto == id)),
        onUpdateNotasItem: (id, notas) {
          final idx = cart.indexWhere((c) => c.idProducto == id);
          if (idx < 0) return;
          setState(() => cart[idx] = cart[idx].copyWith(notas: notas));
        },
        onUpdateNotasPedido: (v) => setState(() => notasPedido = v),
        onSend: _send,
      ),
    );
  }

  Widget _buildScreen(BuildContext context, ColorScheme cs) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Tomar Pedido')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: cs.primary),
              const SizedBox(height: 10),
              Text('Cargando menú...', style: TextStyle(color: cs.onSurface.withOpacity(0.6))),
            ],
          ),
        ),
      );
    }

    // Paso 1: selección de mesa
    if (selectedMesa == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Tomar Pedido'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(38),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Selecciona una mesa', style: TextStyle(color: cs.onSurface.withOpacity(0.6), fontSize: 12)),
              ),
            ),
          ),
        ),
        body: GridView.builder(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.95,
          ),
          itemCount: mesas.length,
          itemBuilder: (context, idx) {
            final m = mesas[idx];
            return InkWell(
              onTap: () => setState(() => selectedMesa = m),
              borderRadius: BorderRadius.circular(18),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  color: cs.surface,
                  border: Border.all(color: cs.outlineVariant.withOpacity(0.35)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.table_restaurant, color: cs.primary, size: 34),
                    const SizedBox(height: 8),
                    Text('${m.numero}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: cs.onSurface)),
                    Text('Mesa', style: TextStyle(color: cs.onSurface.withOpacity(0.55), fontSize: 11, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    // Paso 2: selección de productos
    final filtered = _filtered;
    return Scaffold(
      appBar: AppBar(
        title: Text('Mesa ${selectedMesa!.numero}'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => selectedMesa = null),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 130),
        children: [
          TextField(
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search),
              suffixIcon: searchText.trim().isEmpty
                  ? null
                  : IconButton(
                      onPressed: () => setState(() => searchText = ''),
                      icon: const Icon(Icons.close),
                    ),
              hintText: 'Buscar producto...',
            ),
            onChanged: (v) => setState(() => searchText = v),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _CatChip(
                  label: 'Todos',
                  selected: selectedCategoria == null,
                  onTap: () => setState(() => selectedCategoria = null),
                ),
                for (final c in categorias)
                  _CatChip(
                    label: c.nombre,
                    selected: selectedCategoria == c.id,
                    onTap: () => setState(() => selectedCategoria = selectedCategoria == c.id ? null : c.id),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 40),
              child: Center(child: Text('No se encontraron productos', style: TextStyle(color: cs.onSurface.withOpacity(0.6)))),
            ),
          if (filtered.isNotEmpty)
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.92,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, idx) {
                final p = filtered[idx];
                final qty = _qty(p.id);
                return InkWell(
                  onTap: () => _add(p),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      color: qty > 0 ? cs.primary.withOpacity(0.08) : cs.surface,
                      border: Border.all(color: qty > 0 ? cs.primary.withOpacity(0.35) : cs.outlineVariant.withOpacity(0.35)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                color: (p.esBebida ? cs.tertiary : cs.primary).withOpacity(0.14),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(p.esBebida ? Icons.local_bar_outlined : Icons.restaurant_outlined, size: 16, color: p.esBebida ? cs.tertiary : cs.primary),
                            ),
                            const Spacer(),
                            if (qty > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: cs.primary, borderRadius: BorderRadius.circular(999)),
                                child: Text('$qty', style: TextStyle(color: cs.onPrimary, fontWeight: FontWeight.w900, fontSize: 11)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(p.nombre, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface)),
                        const Spacer(),
                        Text('S/ ${p.precio.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.w900, color: cs.primary)),
                        if (qty > 0) ...[
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              IconButton.filledTonal(
                                onPressed: () => _updateQty(p.id, -1),
                                icon: const Icon(Icons.remove, size: 18),
                              ),
                              Expanded(
                                child: Center(child: Text('$qty', style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface))),
                              ),
                              IconButton.filledTonal(
                                onPressed: () => _updateQty(p.id, 1),
                                icon: const Icon(Icons.add, size: 18),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: cart.isEmpty
          ? null
          : SizedBox(
              width: MediaQuery.of(context).size.width - 32,
              child: FilledButton(
                onPressed: sending ? null : _openCart,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_cart),
                      const SizedBox(width: 10),
                      Text('Ver pedido ($_count) · S/ ${_total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Stack(
      children: [
        _buildScreen(context, cs),
        if (_showSuccess)
          _SuccessOverlay(mesaNumero: _successMesa, total: _successTotal),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// Widgets auxiliares
// ─────────────────────────────────────────────

class _CatChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _CatChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: selected ? cs.primary.withOpacity(0.14) : Colors.transparent,
            border: Border.all(color: selected ? cs.primary.withOpacity(0.5) : cs.outlineVariant.withOpacity(0.5)),
          ),
          child: Text(label, style: TextStyle(color: selected ? cs.primary : cs.onSurface.withOpacity(0.65), fontWeight: FontWeight.w800, fontSize: 12)),
        ),
      ),
    );
  }
}

class _CartItem {
  final String idProducto;
  final String nombre;
  final double precio;
  final int cantidad;
  final String notas;
  final bool esBebida;

  _CartItem({
    required this.idProducto,
    required this.nombre,
    required this.precio,
    required this.cantidad,
    required this.notas,
    required this.esBebida,
  });

  _CartItem copyWith({int? cantidad, String? notas}) => _CartItem(
        idProducto: idProducto,
        nombre: nombre,
        precio: precio,
        cantidad: cantidad ?? this.cantidad,
        notas: notas ?? this.notas,
        esBebida: esBebida,
      );
}

// ── Cart Sheet ──────────────────────────────────

class _CartSheet extends StatefulWidget {
  final int mesaNumero;
  final List<_CartItem> cart;
  final String notasPedido;
  final double total;
  final bool sending;
  final void Function(String id, int delta) onUpdateQty;
  final void Function(String id) onRemove;
  final void Function(String id, String notas) onUpdateNotasItem;
  final void Function(String v) onUpdateNotasPedido;
  final Future<void> Function() onSend;

  const _CartSheet({
    required this.mesaNumero,
    required this.cart,
    required this.notasPedido,
    required this.total,
    required this.sending,
    required this.onUpdateQty,
    required this.onRemove,
    required this.onUpdateNotasItem,
    required this.onUpdateNotasPedido,
    required this.onSend,
  });

  @override
  State<_CartSheet> createState() => _CartSheetState();
}

class _CartSheetState extends State<_CartSheet> {
  late TextEditingController _notasPedidoCtrl;

  @override
  void initState() {
    super.initState();
    _notasPedidoCtrl = TextEditingController(text: widget.notasPedido);
  }

  @override
  void dispose() {
    _notasPedidoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.85,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                child: Row(
                  children: [
                    Expanded(child: Text('Pedido — Mesa ${widget.mesaNumero}', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: cs.onSurface))),
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  children: [
                    for (final item in widget.cart)
                      _CartRow(
                        item: item,
                        onUpdateQty: widget.onUpdateQty,
                        onRemove: widget.onRemove,
                        onUpdateNotasItem: widget.onUpdateNotasItem,
                      ),
                    const SizedBox(height: 10),
                    Text('Notas del pedido', style: TextStyle(color: cs.onSurface.withOpacity(0.7), fontWeight: FontWeight.w900, fontSize: 12)),
                    const SizedBox(height: 8),
                    TextField(
                      minLines: 2,
                      maxLines: 5,
                      decoration: const InputDecoration(hintText: 'Notas generales...'),
                      controller: _notasPedidoCtrl,
                      onChanged: widget.onUpdateNotasPedido,
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Text('Total', style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface)),
                        const Spacer(),
                        Text('S/ ${widget.total.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: cs.primary)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: widget.sending
                            ? null
                            : () async {
                                await widget.onSend();
                                // El cierre del sheet lo maneja _send() en caso de éxito
                              },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          child: widget.sending
                              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Enviar pedido', style: TextStyle(fontWeight: FontWeight.w900)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Cart Row ──────────────────────────────────

class _CartRow extends StatefulWidget {
  final _CartItem item;
  final void Function(String id, int delta) onUpdateQty;
  final void Function(String id) onRemove;
  final void Function(String id, String notas) onUpdateNotasItem;

  const _CartRow({required this.item, required this.onUpdateQty, required this.onRemove, required this.onUpdateNotasItem});

  @override
  State<_CartRow> createState() => _CartRowState();
}

class _CartRowState extends State<_CartRow> {
  late TextEditingController _notasCtrl;

  @override
  void initState() {
    super.initState();
    _notasCtrl = TextEditingController(text: widget.item.notas);
  }

  @override
  void didUpdateWidget(_CartRow old) {
    super.didUpdateWidget(old);
    if (old.item.notas != widget.item.notas && _notasCtrl.text != widget.item.notas) {
      _notasCtrl.text = widget.item.notas;
    }
  }

  @override
  void dispose() {
    _notasCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: cs.outlineVariant.withOpacity(0.35))),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(widget.item.esBebida ? Icons.local_bar_outlined : Icons.restaurant_outlined, size: 18, color: widget.item.esBebida ? cs.tertiary : cs.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(widget.item.nombre, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface))),
                IconButton(onPressed: () => widget.onRemove(widget.item.idProducto), icon: Icon(Icons.delete_outline, color: cs.error)),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                IconButton.filledTonal(onPressed: () => widget.onUpdateQty(widget.item.idProducto, -1), icon: const Icon(Icons.remove, size: 18)),
                const SizedBox(width: 6),
                Text('${widget.item.cantidad}', style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface)),
                const SizedBox(width: 6),
                IconButton.filledTonal(onPressed: () => widget.onUpdateQty(widget.item.idProducto, 1), icon: const Icon(Icons.add, size: 18)),
                const Spacer(),
                Text('S/ ${(widget.item.precio * widget.item.cantidad).toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.w900, color: cs.primary)),
              ],
            ),
            const SizedBox(height: 6),
            TextField(
              minLines: 1,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Notas (sin sal, extra picante...)'),
              controller: _notasCtrl,
              onChanged: (v) => widget.onUpdateNotasItem(widget.item.idProducto, v),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Success Overlay ──────────────────────────────────

class _SuccessOverlay extends StatelessWidget {
  final int mesaNumero;
  final double total;

  const _SuccessOverlay({required this.mesaNumero, required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black87,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.green,
              ),
              child: const Icon(Icons.check_rounded, color: Colors.white, size: 46),
            ),
            const SizedBox(height: 22),
            const Text(
              '¡Pedido Enviado!',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Mesa $mesaNumero · S/ ${total.toStringAsFixed(2)}',
              style: TextStyle(fontSize: 16, color: Colors.white.withOpacity(0.8)),
            ),
          ],
        ),
      ),
    );
  }
}
