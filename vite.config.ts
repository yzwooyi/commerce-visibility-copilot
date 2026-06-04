import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = dirname(fileURLToPath(import.meta.url));

function copyExtensionManifest() {
  return {
    name: "copy-extension-assets",
    writeBundle() {
      mkdirSync(resolve(rootDir, "dist"), { recursive: true });
      copyFileSync(resolve(rootDir, "extension/manifest.json"), resolve(rootDir, "dist/manifest.json"));
      mkdirSync(resolve(rootDir, "dist/icons"), { recursive: true });
      for (const size of [16, 32, 48, 128]) {
        copyFileSync(
          resolve(rootDir, `extension/icons/icon-${size}.png`),
          resolve(rootDir, `dist/icons/icon-${size}.png`)
        );
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionManifest()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: resolve(rootDir, "index.html"),
        sidepanel: resolve(rootDir, "extension/sidepanel.html"),
        background: resolve(rootDir, "extension/src/background.ts")
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") {
            return "assets/[name].js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
