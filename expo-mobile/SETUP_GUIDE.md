# Mobile App Setup Guide

## Overview

This is an Expo + React Native mobile application that provides cross-platform iOS and Android support for the Lawyer Companion system.

## Prerequisites

1. **Node.js & npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

2. **Expo CLI**

   ```bash
   npm install -g expo-cli
   ```

3. **iOS (macOS only)**
   - Xcode installed from App Store
   - Or use iOS Simulator: `expo run:ios`

4. **Android**
   - Android Studio installed
   - Android SDK configured
   - Or use Android Emulator: `expo run:android`

5. **Backend Services**
   - Node.js backend running on port 5000
   - Neo4j database accessible

## Installation Steps

1. **Navigate to the mobile directory:**

   ```bash
   cd expo-mobile
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

4. **Update .env with your backend URL:**

   ```
   REACT_APP_API_URL=http://your-server-ip:5000
   ```

5. **Start Expo:**
   ```bash
   npm start
   ```

## Running the App

### Option 1: Expo Go (Fastest for Testing)

- Install "Expo Go" app on your phone from App Store/Play Store
- Scan QR code from terminal
- App will open on your phone

### Option 2: iOS Simulator

```bash
npm run ios
# or
expo run:ios
```

### Option 3: Android Emulator

```bash
npm run android
# or
expo run:android
```

### Option 4: Web Browser

```bash
npm run web
```

## Key Features

1. **Graph View**
   - Search for legal entities
   - View relationships and connections
   - Detailed node information

2. **Conflicts Tab**
   - List of detected conflicts
   - Risk assessment
   - Client associations

3. **Alerts Tab**
   - Real-time alerts
   - Severity indicators
   - Alert details

4. **Analytics Tab**
   - System statistics
   - Risk metrics
   - Activity timeline

5. **Settings Tab**
   - App preferences
   - About information
   - Account management

## API Connection

The app uses the following endpoints from the backend:

- `/api/conflicts`
- `/api/graph/:entityType/:searchValue`
- `/api/alerts`
- `/api/client-connections/:clientId`
- `/api/risk-analysis/:clientId`
- `/api/shortest-path`
- `/api/risk-propagation/:name`

Ensure these are available on your backend before running the app.

## Debugging

### Using Expo DevTools

- Press `d` in terminal to open developer menu
- Enables network inspection, performance monitoring, etc.

### React Native Debugger

```bash
npm install -g react-native-debugger
react-native-debugger
```

### Console Logs

- Check terminal output
- Use `console.log()` for debugging

## Building for Release

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

### Both

```bash
eas build
```

See [Expo Deployment](https://docs.expo.dev/build/setup/) for details.

## Common Issues

| Issue                       | Solution                                                       |
| --------------------------- | -------------------------------------------------------------- |
| Port already in use         | Kill process on port 5000: `lsof -ti:5000 \| xargs kill -9`    |
| Cannot connect to backend   | Check `REACT_APP_API_URL` in `.env`, ensure backend is running |
| Android emulator connection | Use `10.0.2.2` instead of `localhost`                          |
| Module not found            | Run `npm install` again                                        |
| Expo Go crashes             | Clear app data and reinstall from app store                    |

## Project Structure

```
expo-mobile/
├── src/
│   ├── screens/              # Screen components
│   ├── navigation/           # Navigation setup
│   ├── services/             # API services
│   └── store/                # State management
├── App.js                    # Root component
├── app.json                  # Expo config
└── package.json              # Dependencies
```

## Next Steps

1. Install dependencies: `npm install`
2. Configure `.env` with backend URL
3. Start dev server: `npm start`
4. Run on device/emulator
5. Test all features
6. Build for release

## Support

For issues:

1. Check [Expo Documentation](https://docs.expo.dev/)
2. Review error messages in terminal
3. Clear cache: `expo start -c`
4. Reinstall dependencies: `rm -rf node_modules && npm install`
