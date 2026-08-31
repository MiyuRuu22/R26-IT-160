# Lawyer Companion Mobile App

A React Native mobile application for legal conflict detection and case analysis, built with Expo for cross-platform iOS and Android support.

## Features

- **Graph Visualization**: Search and visualize legal entities (Persons, Organizations, Cases) and their relationships
- **Conflict Detection**: Automatically detect conflicts of interest between clients
- **Risk Analysis**: Real-time risk scoring and propagation analysis
- **Alerts**: Receive and manage important alerts about potential issues
- **Analytics Dashboard**: View system statistics and recent activity
- **Settings**: Manage app preferences and account settings

## Quick Start

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:

```
REACT_APP_API_URL=http://your-backend-server:5000
```

### Running the App

**Start Expo development server:**

```bash
npm start
```

**Run on iOS:**

```bash
npm run ios
```

**Run on Android:**

```bash
npm run android
```

**Run on Web:**

```bash
npm run web
```

## Project Structure

```
expo-mobile/
├── src/
│   ├── screens/              # Screen components
│   │   ├── GraphScreen.js       # Entity graph visualization
│   │   ├── ConflictsScreen.js   # Conflict detection
│   │   ├── AlertsScreen.js      # Alert management
│   │   ├── AnalyticsScreen.js   # Analytics dashboard
│   │   ├── SettingsScreen.js    # Settings
│   │   └── NodeDetailScreen.js  # Node details view
│   ├── navigation/          # Navigation configuration
│   │   └── RootNavigator.js     # Main tab navigator
│   ├── services/            # API services
│   │   ├── apiClient.js         # Axios client with interceptors
│   │   └── relationshipService.js # Relationship API methods
│   └── store/               # State management (Zustand)
│       └── appStore.js          # Global app state
├── App.js                   # Root component
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── babel.config.js          # Babel configuration
```

## API Integration

The app connects to the Node.js backend API at the configured `REACT_APP_API_URL`. Ensure the backend is running before using the mobile app.

### Available Endpoints

- `GET /api/conflicts` - Get all conflicts
- `GET /api/graph/:entityType/:searchValue` - Get graph data
- `GET /api/alerts` - Get all alerts
- `GET /api/client-connections/:clientId` - Get client connections
- `GET /api/risk-analysis/:clientId` - Get risk analysis
- `GET /api/shortest-path` - Find shortest path between entities
- `GET /api/risk-propagation/:name` - Get risk propagation data

## State Management

Uses **Zustand** for global state management. See `src/store/appStore.js` for available actions and state.

## Development

### ESLint

```bash
npm run lint
```

### Build for Production

```bash
npm run build
```

## Deployment

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

See [Expo EAS Build](https://docs.expo.dev/build/setup/) for more information.

## Technologies

- **React Native** - Cross-platform mobile framework
- **Expo** - Managed React Native development platform
- **React Navigation** - Navigation library
- **Axios** - HTTP client
- **Zustand** - State management
- **Expo Vector Icons** - Icon library

## Configuration

### Environment Variables

- `REACT_APP_API_URL` - Backend API base URL (default: `http://localhost:5000`)
- `REACT_APP_API_TIMEOUT` - API request timeout in ms (default: `30000`)

## Troubleshooting

### Connection Issues

- Ensure the backend server is running
- Check that `REACT_APP_API_URL` is correctly set
- On Android emulator, use `10.0.2.2` instead of `localhost`

### Build Issues

- Clear cache: `expo start -c`
- Clear node_modules: `rm -rf node_modules && npm install`

## License

ISC

## Support

For issues and questions, contact the development team.
