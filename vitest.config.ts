import { defineConfig } from "vitest/config";

// Configuración propia de Vitest: no reutiliza vite.config.ts para no cargar los plugins de Electron.
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "electron/**/*.test.ts"],
    environment: "node",
  },
});
