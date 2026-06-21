# Guía de Carga de Imágenes desde Supabase Storage

## Resumen de Cambios Implementados

He implementado el sistema completo para cargar imágenes de platos desde Supabase Storage en tu app Flutter. Aquí está lo que se ha configurado:

## Archivos Creados/Modificados

### 1. **SupabaseStorageService** (`lib/src/services/supabase_storage_service.dart`)
Servicio que gestiona la carga de URLs públicas de Supabase Storage:
- `getPublicUrl()`: Genera URLs públicas para las imágenes
- `imageExists()`: Verifica si una imagen existe

### 2. **SupabaseImageWidget** (`lib/src/ui/widgets/supabase_image_widget.dart`)
Widget reutilizable para mostrar imágenes:
- Maneja errores de carga
- Muestra un placeholder mientras carga
- Muestra un icono predeterminado si no hay imagen

### 3. **PedidosScreen** (modificado)
Actualizado para mostrar imágenes de platos:
- Agregado import del widget de imagen
- Agregado campo `imagenUrl` a la clase `_Aggregated`
- Modificado `_AggRow` para mostrar la imagen con tamaño 56x56px

## Configuración Necesaria en Supabase

Asegúrate de que en tu Supabase tienes:

1. **Bucket de Storage**: El bucket debe llamarse `platos` (o cambia el nombre en `supabase_storage_service.dart`)
2. **Permisos Públicos**: El bucket debe permitir acceso público en lectura
3. **Ruta de Imágenes**: Las imágenes deben estar guardadas en el bucket con rutas consistentes

### Configurar Bucket Público en Supabase:

```sql
-- En Supabase SQL Editor, ejecuta:
INSERT INTO storage.buckets (id, name, public) VALUES ('platos', 'platos', true);

-- Permitir lectura pública:
CREATE POLICY "Lectura pública de imágenes" ON storage.objects
FOR SELECT USING (bucket_id = 'platos');
```

## Cómo se Cargan las Imágenes

1. **Backend**: El campo `imagen_url` en tu BD debe contener la ruta relativa (ej: `platos/ceviche.jpg`)
2. **App**: El servicio genera automáticamente la URL pública completa
3. **Widget**: Descarga y muestra la imagen con manejo de errores

## Ejemplo de Ruta Correcta

Si tu imagen está en: `https://bkcaoijyzunfkntcjzcd.supabase.co/storage/v1/object/public/platos/comidas/ceviche.jpg`

Debes guardar en la BD solo: `comidas/ceviche.jpg`

## Personalizar el Tamaño de las Imágenes

En `_AggRow`, puedes cambiar los parámetros del widget:

```dart
SupabaseImageWidget(
  imagePath: a.imagenUrl,
  width: 56,      // Ancho en pixels
  height: 56,     // Alto en pixels
  borderRadius: BorderRadius.circular(12), // Radio de esquinas
  bucket: 'platos', // Nombre del bucket
)
```

## Solución de Problemas

### Las imágenes no se cargan:
1. Verifica que el bucket `platos` exista en Supabase Storage
2. Comprueba que el bucket es público (RLS deshabilitado o políticas correctas)
3. Asegúrate que la ruta en BD sea correcta (sin URL completa)
4. Abre DevTools y revisa los logs de red

### Ver URLs generadas:
Puedes depurar agregando un print en `supabase_storage_service.dart`:

```dart
final url = '${AppConfig.supabaseUrl}/storage/v1/object/public/$bucket/$path';
print('Imagen URL: $url'); // Para debug
return url;
```

## Próximas Mejoras Opcionales

- [ ] Caché de imágenes (usar `cached_network_image` package)
- [ ] Comprimir imágenes al subirlas
- [ ] Mostrar imágenes en modal al tocar
- [ ] Agregar animación de entrada
