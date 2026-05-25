class AuthUsuario {
  final String id;
  final String nombre;
  final String email;
  final String rol;
  final String authId;

  AuthUsuario({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
    required this.authId,
  });

  factory AuthUsuario.fromJson(Map<String, dynamic> json) {
    return AuthUsuario(
      id: (json['id'] ?? '').toString(),
      nombre: (json['nombre'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      rol: (json['rol'] ?? '').toString(),
      authId: (json['auth_id'] ?? '').toString(),
    );
  }
}

class Restaurante {
  final String id;
  final String nombre;
  final String slug;
  final String? colorPrimario;
  final String? colorSecundario;
  final String? direccion;
  final String? telefono;

  Restaurante({
    required this.id,
    required this.nombre,
    required this.slug,
    this.colorPrimario,
    this.colorSecundario,
    this.direccion,
    this.telefono,
  });

  factory Restaurante.fromJson(Map<String, dynamic> json) {
    return Restaurante(
      id: (json['id'] ?? '').toString(),
      nombre: (json['nombre'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      colorPrimario: json['color_primario']?.toString(),
      colorSecundario: json['color_secundario']?.toString(),
      direccion: json['direccion']?.toString(),
      telefono: json['telefono']?.toString(),
    );
  }
}

class ItemServir {
  final String id;
  final String nombre;
  final int mesa;
  final DateTime hora;
  final String estado; // LISTO/ENTREGADO
  final bool esBebida;
  final String pedidoId;
  final int numeroPedido;
  final DateTime horaPedido;
  final String? notas;
  final String? imagenUrl;
  final List<String> agregados;

  ItemServir({
    required this.id,
    required this.nombre,
    required this.mesa,
    required this.hora,
    required this.estado,
    required this.esBebida,
    required this.pedidoId,
    required this.numeroPedido,
    required this.horaPedido,
    required this.notas,
    required this.imagenUrl,
    required this.agregados,
  });
}

class Mesa {
  final String id;
  final int numero;

  Mesa({required this.id, required this.numero});

  factory Mesa.fromJson(Map<String, dynamic> json) {
    return Mesa(
      id: (json['id'] ?? '').toString(),
      numero: (json['numero'] ?? 0) is int
          ? (json['numero'] as int)
          : int.tryParse((json['numero'] ?? '0').toString()) ?? 0,
    );
  }
}

class Categoria {
  final String id;
  final String nombre;

  Categoria({required this.id, required this.nombre});

  factory Categoria.fromJson(Map<String, dynamic> json) {
    return Categoria(
      id: (json['id'] ?? '').toString(),
      nombre: (json['nombre'] ?? '').toString(),
    );
  }
}

class Producto {
  final String id;
  final String nombre;
  final double precio;
  final bool esBebida;
  final bool disponible;
  final String idCategoria;

  Producto({
    required this.id,
    required this.nombre,
    required this.precio,
    required this.esBebida,
    required this.disponible,
    required this.idCategoria,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: (json['id'] ?? '').toString(),
      nombre: (json['nombre'] ?? '').toString(),
      precio: (json['precio'] is num)
          ? (json['precio'] as num).toDouble()
          : double.tryParse((json['precio'] ?? '0').toString()) ?? 0,
      esBebida: json['es_bebida'] == true,
      disponible: json['disponible'] == true,
      idCategoria: (json['id_categoria'] ?? '').toString(),
    );
  }
}
