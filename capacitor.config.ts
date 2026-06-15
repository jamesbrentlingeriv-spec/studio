import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.novelwritingstudio.app',
  appName: 'Novel Writing Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
