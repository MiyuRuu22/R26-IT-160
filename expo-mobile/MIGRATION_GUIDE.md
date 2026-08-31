# Mobile App Architecture & Migration Guide

## From Web to Mobile

### Key Changes

#### 1. **Navigation**

- **Web**: React Router (URL-based)
- **Mobile**: React Navigation (stack & tab-based)

```javascript
// Web: useNavigate() from react-router
// Mobile: useNavigation() from @react-navigation
```

#### 2. **Styling**

- **Web**: CSS, className, styled-components
- **Mobile**: React Native StyleSheet

```javascript
// Web CSS
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
  },
};

// Mobile StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
});
```

#### 3. **Components**

- **Web**: `<div>`, `<button>`, `<input />`
- **Mobile**: `<View>`, `<TouchableOpacity>`, `<TextInput />`

```javascript
// Web
<div onClick={handleClick}>Click me</div>

// Mobile
<TouchableOpacity onPress={handleClick}>
  <Text>Click me</Text>
</TouchableOpacity>
```

#### 4. **Lists**

- **Web**: `map()` with `<div>`
- **Mobile**: `FlatList`, `SectionList` for performance

```javascript
// Web
{
  items.map((item) => <div key={item.id}>{item.name}</div>);
}

// Mobile
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Text>{item.name}</Text>}
/>;
```

#### 5. **Forms**

- **Web**: HTML forms with onChange
- **Mobile**: TextInput with state

```javascript
// Web
<input value={name} onChange={(e) => setName(e.target.value)} />

// Mobile
<TextInput value={name} onChangeText={setName} />
```

#### 6. **Icons**

- **Web**: Custom SVGs or icon library
- **Mobile**: `expo-vector-icons` (MaterialIcons, FontAwesome, etc.)

```javascript
import { MaterialIcons } from "@expo/vector-icons";
<MaterialIcons name="home" size={24} color="black" />;
```

### Screen Comparison

| Feature  | Web               | Mobile                     |
| -------- | ----------------- | -------------------------- |
| Graph    | ReactFlow library | Text + card representation |
| Search   | Inline input      | Modal/dedicated screen     |
| Sidebar  | Always visible    | Drawer/tab navigation      |
| Modals   | react-modal       | Navigation stack           |
| Tooltips | Hover on desktop  | Long press on mobile       |

### State Management

Both use **Zustand** for global state, but mobile app handles lifecycle differently:

```javascript
// Mobile app initialization
useEffect(() => {
  const unsubscribe = useAppStore.subscribe(
    (state) => state.alerts,
    (alerts) => handleAlertsUpdate(alerts),
  );
  return unsubscribe;
}, []);
```

### API Integration

Same endpoints, same axios client, but:

- Mobile handles network state changes
- Mobile needs offline support planning
- Mobile should cache data locally

```javascript
// Future: SQLite local cache
import SQLite from "expo-sqlite";
const db = await SQLite.openDatabaseAsync("databaseName");
```

### Performance Considerations

1. **FlatList instead of map()** - Better memory management
2. **Image optimization** - Resize and cache images
3. **Lazy loading** - Load data on demand
4. **Remove web-only dependencies** - Reduce bundle size

### Platform-Specific Code

```javascript
import { Platform } from "react-native";

if (Platform.OS === "ios") {
  // iOS-specific code
} else if (Platform.OS === "android") {
  // Android-specific code
}
```

### File Structure Best Practices

```
src/
├── screens/              # Full-screen components
├── components/           # Reusable components
├── services/             # API & external services
├── store/                # Zustand state stores
├── utils/                # Helper functions
├── constants/            # App constants
└── hooks/                # Custom React hooks
```

### Testing

```bash
# Install test dependencies
npm install --save-dev jest jest-expo @testing-library/react-native

# Run tests
npm test

# With coverage
npm test -- --coverage
```

### Debugging Tools

1. **Expo DevTools** - Press `d` in terminal
2. **React Native Debugger** - Inspect network, storage, performance
3. **Console logs** - Check terminal output
4. **Performance Profiler** - Identify bottlenecks

### Common Pitfalls to Avoid

1. ❌ Using `position: absolute` without thinking about screen size
2. ❌ Forgetting to optimize images for mobile
3. ❌ Not handling network errors gracefully
4. ❌ Memory leaks from subscriptions
5. ❌ Blocking the UI thread with synchronous operations

### Optimization Checklist

- [ ] Images are optimized (size, format)
- [ ] Lists use FlatList
- [ ] Unnecessary re-renders are minimized
- [ ] External dependencies are bundled properly
- [ ] No console errors or warnings
- [ ] API calls have timeout handling
- [ ] Error messages are user-friendly
- [ ] Loading states are clearly shown

### Next Steps for Enhancement

1. **Offline Support**
   - Cache data locally with SQLite
   - Sync when reconnected

2. **Push Notifications**
   - Expo Notifications
   - Alert users to new conflicts

3. **Authentication**
   - Secure login
   - Biometric support

4. **Advanced Graph**
   - React Native Skia for complex visualizations
   - Gesture-based zoom/pan

5. **Export Features**
   - PDF generation with react-native-pdf
   - Export conflict reports
