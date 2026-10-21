import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works both at a domain root and under a
// GitHub Pages project path (…github.io/field-notes/).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", sourcemap: true },
});
