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
      final mesasData = await ApiClient.getJson('/mesas?id_restaurante=${rest.id}') as List<dynamic>?;
      final prodsData = await ApiClient.getJson('/productos?id_restaurante=${rest.id}&disponible=true') as List<dynamic>?;
      final catsData = await ApiClient.getJson('/categorias?id_restaurante=${rest.id}') as List<dynamic>?;

      mesas
        ..clear()
        ..addAll((mesasData ?? const []).map((m) => Mesa.fromJson(Map<String, dynamic>.from(m as Map))));
      mesas.sort((a, b) => a.numero.compareTo(b.numero));

      productos
        ..clear()
        ..addAll((prodsData ?? const []).map((p) => Producto.fromJson(Map<String, dynamic>.from(p as Map))));

      categorias
        ..clear()
        ..addAll((catsData ?? const []).map((c) => Categoria.fromJson(Map<String, dynamic>.from(c as Map))));
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
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          title: const Text('Pedido enviado'),
          content: const Text('El pedido fue registrado correctamente.'),
        ),
      );

      await Future.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
      Navigator.of(context).pop();

      setState(() {
        cart.clear();
        notasPedido = '';
        selectedMesa = null;
        selectedCategoria = null;
        searchText = '';
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

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Tomar Pedido')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: cs.primary),
              const SizedBox(height: 10),
              Text('Cargando menu...', style: TextStyle(color: cs.onSurface.withOpacity(0.6))),
            ],
          ),
        ),
      );
    }

    // Step 1: mesas
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

    // Step 2: productos
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
}

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

class _CartSheet extends StatelessWidget {
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
                    Expanded(child: Text('Pedido — Mesa $mesaNumero', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: cs.onSurface))),
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  children: [
                    for (final item in cart) _CartRow(item: item, onUpdateQty: onUpdateQty, onRemove: onRemove, onUpdateNotasItem: onUpdateNotasItem),
                    const SizedBox(height: 10),
                    Text('Notas del pedido', style: TextStyle(color: cs.onSurface.withOpacity(0.7), fontWeight: FontWeight.w900, fontSize: 12)),
                    const SizedBox(height: 8),
                    TextField(
                      minLines: 2,
                      maxLines: 5,
                      decoration: const InputDecoration(hintText: 'Notas generales...'),
                      onChanged: onUpdateNotasPedido,
                      controller: TextEditingController(text: notasPedido),
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
                        Text('S/ ${total.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: cs.primary)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: sending ? null : () async {
                          await onSend();
                          if (context.mounted) Navigator.pop(context);
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          child: sending
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

class _CartRow extends StatelessWidget {
  final _CartItem item;
  final void Function(String id, int delta) onUpdateQty;
  final void Function(String id) onRemove;
  final void Function(String id, String notas) onUpdateNotasItem;

  const _CartRow({required this.item, required this.onUpdateQty, required this.onRemove, required this.onUpdateNotasItem});

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
                Icon(item.esBebida ? Icons.local_bar_outlined : Icons.restaurant_outlined, size: 18, color: item.esBebida ? cs.tertiary : cs.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(item.nombre, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface))),
                IconButton(onPressed: () => onRemove(item.idProducto), icon: Icon(Icons.delete_outline, color: cs.error)),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                IconButton.filledTonal(onPressed: () => onUpdateQty(item.idProducto, -1), icon: const Icon(Icons.remove, size: 18)),
                const SizedBox(width: 6),
                Text('${item.cantidad}', style: TextStyle(fontWeight: FontWeight.w900, color: cs.onSurface)),
                const SizedBox(width: 6),
                IconButton.filledTonal(onPressed: () => onUpdateQty(item.idProducto, 1), icon: const Icon(Icons.add, size: 18)),
                const Spacer(),
                Text('S/ ${(item.precio * item.cantidad).toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.w900, color: cs.primary)),
              ],
            ),
            const SizedBox(height: 6),
            TextField(
              minLines: 1,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Notas (sin sal, extra picante...)'),
              onChanged: (v) => onUpdateNotasItem(item.idProducto, v),
              controller: TextEditingController(text: item.notas),
            ),
          ],
        ),
      ),
    );
  }
}
