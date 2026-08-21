import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Asegura rutas relativas para los assets (.html cargando desde cualquier subcarpeta)
  root: '.',
  build: {
    outDir: '../', // Compila directamente en /cotizaciones/
    emptyOutDir: false, // ¡IMPORTANTE! No vaciar para no borrar api.php, uploads, etc.
    rollupOptions: {
      input: {
        cotizador: resolve(__dirname, 'cotizador.html'),
        admin_productos: resolve(__dirname, 'admin_productos.html'),
        admin_usuarios: resolve(__dirname, 'admin_usuarios.html'),
        mis_cotizaciones: resolve(__dirname, 'mis_cotizaciones.html'),
        ver_cotizacion: resolve(__dirname, 'ver_cotizacion.html'),
      },
      output: {
        // Estructura de nombres para evitar colisiones
        entryFileNames: 'dist_assets/[name].[hash].js',
        chunkFileNames: 'dist_assets/[name].[hash].js',
        assetFileNames: 'dist_assets/[name].[hash].[ext]',
      }
    }
  }
});
