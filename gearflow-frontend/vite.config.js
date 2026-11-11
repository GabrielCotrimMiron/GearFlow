import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// A API e a sessão ficam na mesma origem do navegador durante o desenvolvimento.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
