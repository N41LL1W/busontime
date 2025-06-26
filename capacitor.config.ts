// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.n41ll1w.busontime',
  appName: 'BusOnTime',
  webDir: 'out', // <--- ESTA É A LINHA MAIS IMPORTANTE!

  plugins: {
    AdMob: {
      appId: 'ca-app-pub-2852931130226129~6004139674', // <--- Coloque o ID do aplicativo AdMob aqui
    }
  }
};

export default config;