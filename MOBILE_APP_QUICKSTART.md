# Quick Start Guide - Lawyer Companion Mobile App

## 📱 What's New

Your Lawyer Companion system now includes a **complete mobile application** built with React Native + Expo. This provides cross-platform support for iOS and Android devices while maintaining full feature parity with the web application.

## 🎯 Key Features

- **Search & Explore**: Find legal entities and view their relationships
- **Conflict Detection**: Identify potential conflicts of interest
- **Risk Analysis**: Assess and track risk scores
- **Real-time Alerts**: Get notified of important issues
- **Analytics**: View system statistics and trends
- **Cross-Platform**: Works on iOS, Android, and web

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v16+): [Download](https://nodejs.org/)
2. **npm** or **yarn**: Comes with Node.js
3. **Expo CLI**: `npm install -g expo-cli`
4. **Backend Running**: Node.js server on port 5000
5. **Neo4j Database**: Running and accessible

### For Physical Device Testing

- **iPhone/iPad**: Expo Go app from App Store
- **Android Phone**: Expo Go app from Google Play

### For Emulator Testing

- **iOS**: Xcode and iOS Simulator (macOS only)
- **Android**: Android Studio and Android Emulator

## 🚀 Installation & Setup

### Step 1: Navigate to Mobile App Directory

```bash
cd expo-mobile
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Backend Connection

```bash
# Copy example env file
cp .env.example .env

# Edit .env and update API URL
nano .env  # or use your editor
```

Set `REACT_APP_API_URL` to your backend server:

```
REACT_APP_API_URL=http://your-computer-ip:5000
```

**Note**: On Android emulator, use `http://10.0.2.2:5000` instead of localhost

### Step 4: Start Expo Development Server

```bash
npm start
```

## 📱 Running the App

### Option A: On Your Phone (Easiest)

1. Install "**Expo Go**" from your app store
2. Scan the QR code shown in terminal
3. App opens automatically on your phone

### Option B: iOS Simulator (macOS only)

```bash
npm run ios
```

### Option C: Android Emulator

```bash
npm run android
```

### Option D: Web Browser

```bash
npm run web
```

## 🔍 Testing the Features

### 1. **Graph Screen**

- Search for an entity (e.g., "Person", "ABC Inc", "Case 001")
- View results displayed as cards
- Tap a node to see details
- View connections and relationships

### 2. **Conflicts Screen**

- View all detected conflicts
- Each conflict shows clients and shared organization
- Risk level indicated with color coding
- Tap to view detailed information

### 3. **Alerts Screen**

- View active alerts
- Alerts organized by severity
- Pull down to refresh

### 4. **Analytics Screen**

- View system statistics
- See total entities, active cases, conflicts
- Review recent activity timeline

### 5. **Settings Screen**

- Toggle notifications
- Toggle auto-refresh
- View app version and build info

## 🔧 Troubleshooting

### Issue: "Cannot connect to server"

**Solution**:

1. Ensure backend is running: `node lawyer-backend/server.js`
2. Verify `REACT_APP_API_URL` in `.env`
3. Check firewall isn't blocking port 5000
4. On Android emulator, use `10.0.2.2:5000` not `localhost:5000`

### Issue: "Module not found" errors

**Solution**:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Expo crashes on startup

**Solution**:

```bash
expo start -c  # Clear cache and restart
```

### Issue: QR code won't scan

**Solution**:

1. Make sure you're on the same WiFi as your computer
2. Restart Expo: Press `Ctrl+C` then `npm start` again
3. Try tunnel connection: Press `w` in terminal

## 📊 API Integration

The mobile app connects to these backend endpoints:

| Endpoint                          | Purpose              |
| --------------------------------- | -------------------- |
| `GET /api/conflicts`              | Get all conflicts    |
| `GET /api/graph/:type/:value`     | Search for entities  |
| `GET /api/alerts`                 | Get alerts           |
| `GET /api/client-connections/:id` | Get related entities |
| `GET /api/risk-analysis/:id`      | Get risk scores      |
| `GET /api/shortest-path`          | Find connections     |
| `GET /api/risk-propagation/:name` | Analyze risk spread  |

## 📦 Project Structure

```
expo-mobile/
├── src/
│   ├── screens/           # Main app screens
│   ├── navigation/        # Navigation setup
│   ├── services/          # API integration
│   ├── store/             # State management (Zustand)
│   └── utils/             # Helper functions
├── App.js                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── README.md              # Detailed documentation
```

## 🚢 Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

### Both Platforms

```bash
eas build
```

See [Expo EAS Documentation](https://docs.expo.dev/build/) for details.

## 📚 Documentation

- **README.md** - Full documentation
- **SETUP_GUIDE.md** - Detailed setup instructions
- **MIGRATION_GUIDE.md** - Web to mobile conversion guide
- **PROJECT_OVERVIEW.md** - Complete system architecture

## 🔄 Common Workflows

### Update a Screen

1. Edit file in `src/screens/`
2. Save changes
3. Expo automatically reloads on device

### Add a New Endpoint

1. Add method to `src/services/relationshipService.js`
2. Call from screen component
3. Handle loading/error states

### Change Colors/Styling

1. Edit `StyleSheet.create()` sections in component files
2. Colors are centralized in helper functions
3. Reload to see changes

### Debug Issues

```javascript
// Add console logs
console.log("Debug message:", variable);

// Check terminal output for logs
// Press `d` in Expo to open DevTools
```

## ⚡ Performance Tips

1. **Optimize Images**: Use appropriate sizes
2. **Lazy Load**: Load data when needed
3. **Avoid Re-renders**: Use proper state management
4. **Monitor Network**: Check API call frequency
5. **Test on Real Device**: Emulators can hide issues

## 🆘 Getting Help

1. **Check Logs**: Look at terminal output
2. **Read Docs**: See files in project root
3. **Clear Cache**: `expo start -c`
4. **Reinstall**: `npm install` after `rm -rf node_modules`
5. **Check Network**: Ensure backend is running

## 🎓 Next Steps

1. ✅ Get the app running on your device
2. ✅ Test all features
3. ✅ Customize colors/branding if needed
4. ✅ Build for production
5. ✅ Deploy to app stores

## 📝 Configuration Checklist

- [ ] Node.js v16+ installed
- [ ] Expo CLI installed
- [ ] Backend server running
- [ ] Neo4j database running
- [ ] `.env` file configured
- [ ] Expo Go installed on test device
- [ ] Network connectivity verified
- [ ] QR code scans successfully

## 💡 Pro Tips

- **Fast Refresh**: Edits automatically reload on device
- **Multiple Instances**: Run `expo start` in multiple terminals for different platforms
- **Offline Testing**: Use cached data (future feature)
- **DevTools**: Press `d` in terminal for debugging tools
- **Reset State**: Clear app cache to reset state

---

**Need help?** Check the detailed documentation files in the `expo-mobile/` directory.

**Last Updated**: August 30, 2026
