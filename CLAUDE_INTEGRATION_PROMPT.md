# Paste this into Claude in the integrating project

```text
Integrate the Lawyer Companion Relationship Network as one new screen launched
from our existing home-screen button. Do not replace, rename, or restructure
our current root navigator, tabs, authentication, theme, API client, or any
unrelated screen.

Use the accompanying INTEGRATION_HANDOFF.md as the source of truth.

Requirements:
1. Add one route named RelationshipNetwork, rendered by NetworkScreen.
2. Make our existing home-screen button navigate to RelationshipNetwork.
3. Preserve all existing navigation routes and behaviour.
4. Register/map NodeDetail only if our app uses a different details route name;
   update NetworkScreen's navigation call to that existing route name.
5. Keep the backend contract unchanged: GET {BACKEND_URL}/api/network returns
   nodes and edges. Do not expose Neo4j Aura credentials in the mobile app.
6. Reuse our existing API base URL configuration where possible. Otherwise set
   EXPO_PUBLIC_API_URL; do not hardcode localhost for a physical device.
7. Install only missing dependencies: react-native-svg,
   react-native-reanimated, react-native-gesture-handler, axios.
8. Ensure the app root uses GestureHandlerRootView. Do not add a second nested
   root if one already exists.
9. Keep NetworkScreen's tiny-dot constellation graph for the Network view.
   Do not replace the existing focused Graph search view.
10. After changes, run the app's existing typecheck/lint/tests and report only:
    files changed, packages added, navigation route added, and any integration
    assumption that needs my decision.

Before editing, inspect the existing navigator, home button, details route,
state store, and API configuration. Make the smallest compatible change.
```
