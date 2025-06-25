// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.n41ll1w.busontime',
  appName: 'BusOnTime',
  webDir: 'out', // <--- ESTA É A LINHA MAIS IMPORTANTE!
};

export default config;