import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "toss-checklist-lab",
  brand: {
    displayName: "오늘의 체크리스트",
    primaryColor: "#3182F6",
    icon: "https://static.toss.im/icons/png/4x/icon-toss-logo.png",
  },
  web: {
    host: "localhost",
    port: 3000,
    commands: {
      dev: "vite --host 0.0.0.0 --port 3000",
      build: "vite build",
    },
  },
  webViewProps: {
    type: "partner",
  },
  permissions: [],
  outdir: "dist",
});
