import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import path from "path";

// Resolución robusta del directorio del proyecto.
// import.meta.url funciona correctamente en ESM/TypeScript configs
// a diferencia de __dirname que puede fallar en .ts configs.
const __projectDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Forzar a Turbopack a usar ESTA carpeta como raíz del proyecto.
    // Previene que detecte un package.json padre (ej. C:\Users\Lenovo)
    // como workspace root, lo que causa "Can't resolve tailwindcss"
    // y recompilación infinita con heap out of memory.
    root: __projectDir,
  },
};

export default nextConfig;
