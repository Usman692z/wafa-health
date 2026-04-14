import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medigo.app',
    appName: 'mediGO',
    webDir: 'out',
    server: {
    androidScheme: 'https',
      },
  android: {
    buildOptions: {
      keystorePath: undefined,
              keystoreAlias: undefined,
        },
        },
          plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
              backgroundColor: '#0f172a',
              androidSplashResourceName: 'splash',
              androidScaleType: 'CENTER_CROP',
              showSpinner: false,
        },
            PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
        },
    },
          };

export default config;
