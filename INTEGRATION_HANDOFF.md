# Relationship Network integration handoff

## What is ready

This component has two complementary mobile views:

| View | Purpose | Renderer |
| --- | --- | --- |
| **Graph** | Investigate a known Case, Person, or Organisation | Labelled relationship cards |
| **Network** | Explore all available Aura entities | Living dot constellation |

The Network view does not require Neo4j on an integrator's device. It calls the
existing Express backend, which owns all Aura credentials.

## Minimal integration boundary

Copy these mobile files into the integrating Expo app, preserving their relative
imports or updating them to that app's structure:

```text
src/screens/NetworkScreen.js
src/components/GraphNetwork.js
src/utils/graphNetwork.js
src/services/apiClient.js
src/services/relationshipService.js
```

`NetworkScreen` also uses `useAppStore().setSelectedNode`. If the host app does
not use Zustand, remove that one call or replace it with the host app's selected
entity store. It navigates to a route named `NodeDetail`; map that name to the
host application's details screen if it differs.

The host app needs these dependencies (already present in this project):

```text
react-native-svg
react-native-reanimated
react-native-gesture-handler
axios
```

Its root must be wrapped in `GestureHandlerRootView` for pinch and two-finger
navigation. This project already does that in `expo-mobile/App.js`.

## Navigation hook

Do not replace the integrating app's existing navigator. Add one screen/route
and point its home button to it:

```js
import NetworkScreen from './src/screens/NetworkScreen';

<Stack.Screen
  name="RelationshipNetwork"
  component={NetworkScreen}
  options={{ title: 'Relationship Network' }}
/>

// Home button handler
navigation.navigate('RelationshipNetwork');
```

If Node Details lives in the same stack, ensure a `NodeDetail` route is also
registered because `NetworkScreen` opens it when a dot is tapped.

## Backend contract

Configure the mobile app with only the backend URL:

```dotenv
EXPO_PUBLIC_API_URL=https://YOUR_BACKEND_HOST
EXPO_PUBLIC_API_TIMEOUT=30000
```

The only new endpoint required for the Network tab is:

```text
GET /api/network
```

It returns:

```json
{
  "nodes": [{ "id": "…", "label": "…", "type": "Person|Organization|Case", "properties": {} }],
  "edges": [{ "id": "…", "source": "…", "target": "…", "label": "…", "riskScore": 20, "riskLevel": "LOW" }]
}
```

The endpoint deliberately returns all currently available nodes, while
deduplicating visible links to prevent repeated lines from cluttering the map.

## Server and Aura

Keep Aura variables only in the backend/deployment secret store:

```dotenv
NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=secret
NEO4J_DATABASE=neo4j
```

See `AURA_DEPLOYMENT.md` for deployment and loader instructions. Validate with
`GET /api/health` before integrating.

## Pre-integration checks

1. Backend: `GET /api/health` returns `{ "status": "ok" }`.
2. Backend: `GET /api/network` returns nodes and unique edges.
3. Mobile: open Network, pinch, two-finger drag, and tap a dot.
4. Mobile: tap a dot, open Node Details, then use **Explore network** to run a
   focused graph search.
