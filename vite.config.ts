import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  base: process.env.GAME_BASE_PATH || (command === "build" ? "/game/" : "/"),
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        game: resolve(__dirname, "game.html"),
        station: resolve(__dirname, "station.html"),
        lottery: resolve(__dirname, "lottery.html"),
        diorama: resolve(__dirname, "diorama.html"),
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8788",
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
}));
