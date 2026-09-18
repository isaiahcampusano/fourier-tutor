import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Project Pages site: https://isaiahcampusano.github.io/fourier-tutor/
  base: "/fourier-tutor/",
  test: {
    environment: "node"
  }
});
