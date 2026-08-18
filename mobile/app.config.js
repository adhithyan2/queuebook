// app.config.js
//
// The Android Firebase config (google-services.json) contains build-time
// credentials and is intentionally kept out of Git (see .gitignore). It is
// provided to EAS Build either through the `GOOGLE_SERVICES_JSON` env variable
// (created via `eas env:create` or the EAS dashboard) or via the local
// ./google-services.json fallback. `googleServicesFile` is only set when one of
// those is actually available, so Metro keeps running before Firebase is added.
const fs = require('fs');
const path = require('path');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ||
  (fs.existsSync(path.join(__dirname, 'google-services.json')) ? './google-services.json' : undefined);

module.exports = {
  expo: {
    name: 'QueueBook',
    slug: 'queuebook',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'queuebook',
    userInterfaceStyle: 'automatic',
    ios: {
      icon: './assets/images/icon.png'
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#FFFFFF',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png'
      },
      predictiveBackGestureEnabled: false,
      package: 'com.queuebook.app',
      ...(googleServicesFile ? { googleServicesFile } : {})
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router',
      'expo-dev-client',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FFFFFF',
          image: './assets/images/splash-icon.png',
          imageWidth: 76
        }
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#6366f1',
          defaultChannel: 'queuebook-default'
        }
      ]
    ],
    experiments: {
      typedRoutes: false,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: 'a8618b67-a23f-438b-9813-de7555b084d4'
      }
    },
    runtimeVersion: {
      policy: 'appVersion'
    },
    updates: {
      url: 'https://u.expo.dev/a8618b67-a23f-438b-9813-de7555b084d4'
    }
  }
};
