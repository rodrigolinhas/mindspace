/**
 * Configuração do Vite para o frontend MindSpace.
 * Configura React plugin, paths de build, e alias para imports.
 * @module vite.config
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  envDir: "../",
  assetsInclude: ["**/*.jpg", "**/*.mp3"],
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  }, //para modo dev
  preview: {
    port: 5173,
  }, //para modo start
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
