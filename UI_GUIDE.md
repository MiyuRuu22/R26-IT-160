# LegalDraft — Frontend & UI Guide

**Read this before building any screen.** Every feature in this app must look and
behave the same. This guide is the single source of truth for colours, spacing,
typography, components and theming. Copy the patterns here — **do not invent new
colours, hardcoded hex values, or one-off styles.**

Stack: **React Native + Expo (expo-router)**, TypeScript, `@expo/vector-icons`
(Feather icons only). Styling is **inline `StyleProp` objects** (no NativeWind /
styled-components). There is **no CSS file** — the "CSS" of this app is the
`COLORS` token object + the shared components below.

---

## 1. Golden rules

1. **Never hardcode a colour.** Always use `COLORS.*` from `constants/ui.ts`.
   The one exception is the document-preview "paper" (`#ffffff` / `#111`), which
   must stay white regardless of theme.
2. **Never import a colour library or a second UI kit.** Use what's here.
3. **Wrap every card in `<GlassCard>`** (see §5). Don't build ad-hoc bordered boxes.
4. **Use Feather icons only** (`import { Feather } from "@expo/vector-icons"`).
   One icon family across the whole app.
5. **Every screen is theme-aware automatically** — because it reads `COLORS`.
   Just don't cache colours in module scope or hardcode them.
6. **Corners:** cards use `RADIUS` (22). Buttons/inputs use 12–14. Pills/tags 6–8.
7. **Primary action = solid `COLORS.text` background with `COLORS.bg` text.**
   (In light mode that's a near-black button with white text; it inverts in dark.)

---

## 2. Design tokens — `constants/ui.ts`

The **only** place colours are defined. `COLORS` is a live object that is mutated
on theme toggle; screens read from it directly.

```ts
export const LIGHT = {
  bg:          "#FFFFFF",             // screen background
  surface:     "#F5F6F8",            // cards, inputs, chips
  text:        "#26262B",            // primary text + primary buttons
  textDim:     "#8A8D94",            // secondary text, hints, placeholders
  glassBorder: "rgba(20,20,30,0.08)",// hairline borders / dividers
  navActive:   "#26262B",            // active tab icon/label
  navInactive: "#B6B9BF",            // inactive tab icon/label
  danger:      "#C0392B",            // destructive / errors
  shadow:      "#151520",
};

export const DARK = {
  bg:          "#0F1216",
  surface:     "#191D23",
  text:        "#ECEDEF",
  textDim:     "#8B9098",
  glassBorder: "rgba(255,255,255,0.10)",
  navActive:   "#ECEDEF",
  navInactive: "#6B7079",
  danger:      "#E06C5B",
  shadow:      "#000000",
};

export const COLORS = { ...LIGHT };  // <-- read THIS everywhere
export const RADIUS = 22;
```

**Token meanings (use the right token for the job):**

| Token | Use it for |
|---|---|
| `COLORS.bg` | Screen background; icon-well background; text on a primary button |
| `COLORS.surface` | Card fill, input fill, chip/tag fill, secondary button fill |
| `COLORS.text` | Headings, body text, **primary button background** |
| `COLORS.textDim` | Sub-labels, hints, placeholders, timestamps, meta |
| `COLORS.glassBorder` | All 1px borders and hairline dividers |
| `COLORS.danger` | Destructive actions, validation error text |
| `COLORS.navActive/navInactive` | Bottom tab bar only |

There is **no accent/brand colour** by design — the look is monochrome +
one danger red. If your feature truly needs an accent, propose it as a new token
in `ui.ts`; don't inline it.

---

## 3. Theming — how light/dark works (don't break it)

`context/ThemeContext.tsx` holds `mode` and a `toggle()`. On toggle it (a) mutates
the live `COLORS` object via `applyMode()`, then (b) `setMode()` which forces a
**remount of the whole navigator via `key={mode}`** in `app/_layout.tsx`, so every
screen re-reads the new `COLORS`.

**What this means for you:**

- **Just read `COLORS.*` at render time.** Your screen re-renders/remounts on
  toggle and picks up the new values for free.
- **DO NOT** copy a colour into a `const` at module scope, into `StyleSheet.create`
  (which caches), or into memoised styles. That freezes the light value.
- Navigation headers/status bar are themed centrally in `app/_layout.tsx` (they
  bind to `mode` → `LIGHT`/`DARK`). Don't set header colours per-screen.
- To read the current mode in a component: `const { mode, toggle } = useTheme();`

```ts
import { useTheme } from "../context/ThemeContext";
const { mode, toggle } = useTheme();     // mode: "light" | "dark"
```

> Inline styles are fine and preferred here. Avoid `StyleSheet.create` for anything
> colour-dependent, because it won't update on theme change.

---

## 4. Screen scaffold (copy this for every new screen)

```tsx
import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/ui";

export default function MyFeatureScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">
        <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}>Title</Text>
        <Text style={{ color: COLORS.textDim, fontSize: 14, marginTop: 6, marginBottom: 20 }}>
          Subtitle / one-line description.
        </Text>
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

Rules:
- Root is always `SafeAreaView` with `backgroundColor: COLORS.bg`.
- Use `edges={["bottom"]}` on screens that have a navigation header (the header
  already covers the top). Use full-safe-area (omit `edges`) only on headerless tabs.
- **Screen padding = 22.** Add `paddingBottom: 40` (or `100` if there's a floating
  element) on scroll content.
- Wrap scrollable content in `ScrollView` with `keyboardShouldPersistTaps="handled"`
  when the screen has inputs.

---

## 5. `GlassCard` — the one and only card

`components/GlassCard.tsx`. A flat surface with a hairline border and `RADIUS`
corners. **Every "box" in the app is a GlassCard.** Pass padding via `style`.

```tsx
import GlassCard from "../components/GlassCard";

<GlassCard style={{ padding: 16 }}>
  {/* ... */}
</GlassCard>
```

- Default look: `backgroundColor: COLORS.surface`, `borderWidth: 1`,
  `borderColor: COLORS.glassBorder`, `borderRadius: 22`.
- Standard inner padding: **16** (list/row cards) or **18** (feature cards).
- For an input wrapper, use `padding: 2–4` and let the `TextInput` pad itself.
- Don't add shadows to cards (the app is flat). Shadows are only for floating
  action buttons (§8).

---

## 6. Typography scale

No custom fonts — system default (San Francisco / Roboto). Use these exact sizes
& weights so screens match:

| Role | size | weight | colour |
|---|---|---|---|
| Screen title | 26 | "800" | `COLORS.text` |
| Screen subtitle | 14 | "400" | `COLORS.textDim` |
| Section header | 16 | "800" | `COLORS.text` |
| Card title | 16–17 | "700" | `COLORS.text` |
| Card hint / body | 12–14 | "400" | `COLORS.textDim` |
| Label above input | 12.5 | "600" | `COLORS.textDim` |
| Overline / tag text | 10–11.5 | "800" | `COLORS.textDim`, `letterSpacing: 0.4` |
| Button label | 14–15 | "800" | (see §7) |
| Timestamp / meta | 10.5–11 | "400" | `COLORS.textDim` |

Line height for multi-line body: ~1.4–1.5× (e.g. `fontSize: 13.5, lineHeight: 20`).

---

## 7. Buttons

**Primary (filled):**
```tsx
<TouchableOpacity activeOpacity={0.85}
  style={{ backgroundColor: COLORS.text, borderRadius: 14, paddingVertical: 15,
           flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
  <Feather name="feather" size={16} color={COLORS.bg} />
  <Text style={{ color: COLORS.bg, fontSize: 15, fontWeight: "800", marginLeft: 8 }}>
    Do the thing
  </Text>
</TouchableOpacity>
```

**Secondary (outline):**
```tsx
<TouchableOpacity activeOpacity={0.85}
  style={{ borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 14,
           paddingVertical: 14, paddingHorizontal: 16, alignItems: "center" }}>
  <Text style={{ color: COLORS.text, fontSize: 13.5, fontWeight: "700" }}>Skip</Text>
</TouchableOpacity>
```

**Small chip / pill button** (e.g. export options): outline chip, `borderRadius: 12`,
`paddingHorizontal: 14, paddingVertical: 10`, `backgroundColor: COLORS.surface`,
icon + label, `fontSize: 13, fontWeight: "700"`.

**Icon-only square action** (e.g. submit arrow): `width/height: 44, borderRadius: 12,
backgroundColor: COLORS.text`, icon `color={COLORS.bg}`.

- `activeOpacity` is always **0.7–0.85**.
- Disabled state: set `opacity: 0.6` and show an `ActivityIndicator color={COLORS.bg}`
  inline while busy.
- Destructive text buttons use `color: COLORS.danger`.

---

## 8. Inputs

Wrap inputs in a bordered container (GlassCard or a plain bordered `View`):

```tsx
<GlassCard style={{ padding: 2 }}>
  <TextInput
    value={value}
    onChangeText={setValue}
    placeholder="Type here…"
    placeholderTextColor={COLORS.textDim}
    multiline           // when needed
    style={{
      color: COLORS.text, fontSize: 14.5,
      paddingHorizontal: 12, paddingVertical: 11,
      minHeight: 44,             // 88 for multiline
      textAlignVertical: "top",  // multiline only
    }}
  />
</GlassCard>
```

- Text colour `COLORS.text`; **always** set `placeholderTextColor={COLORS.textDim}`.
- Single-line height ~44; multiline `minHeight: 88` with `textAlignVertical: "top"`.
- Label sits **above** the input: `fontSize: 12.5, fontWeight: "600",
  color: COLORS.textDim, marginBottom: 6`. Append `" *"` for required fields.
- **Validation error state:** label + border turn red — use `#e05a5a` for the
  warning text and `#e05a5a55` for the border tint. Show a summary line below in
  `COLORS.danger`.

---

## 9. Tags / chips / pills

Small rounded label (doc category, status, filters):
```tsx
<View style={{ borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 8,
               paddingHorizontal: 9, paddingVertical: 4 }}>
  <Text style={{ color: COLORS.textDim, fontSize: 10.5, fontWeight: "800",
                 letterSpacing: 0.4 }}>PETITION</Text>
</View>
```

---

## 10. Lists & row cards

A tappable row (history item, list entry): a `GlassCard` with `padding: 14`,
`flexDirection: "row"`, `alignItems: "center"`. Title flexes (`flex: 1`,
`numberOfLines={1}`), meta/tags/actions sit to the right. Row action icons
(rename, delete) are 16–17px `COLORS.textDim` with `hitSlop` of ~12.
Vertical gap between rows: `marginBottom: 10`.

Icon "well" (the rounded square holding a feature icon):
```tsx
<View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.bg,
               borderWidth: 1, borderColor: COLORS.glassBorder,
               alignItems: "center", justifyContent: "center" }}>
  <Feather name="file-text" size={21} color={COLORS.text} />
</View>
```

---

## 11. Modals / popups

Two supported shapes — pick per use:

**Bottom sheet** (previews, pickers): full-screen dim overlay
`rgba(0,0,0,0.55)`, `justifyContent: "flex-end"`; sheet is `COLORS.bg`,
`borderTopLeftRadius/RightRadius: 20`, `maxHeight: "88–92%"`, a header row
(title `fontSize: 16, fontWeight: "800"` + an `x` close button), then content.

**Centered dialog** (rename, confirm): overlay `rgba(0,0,0,0.5)`,
`justifyContent: "center"`, `padding: 30`; dialog is `COLORS.bg`,
`borderRadius: 16`, `padding: 18`, hairline border. Actions bottom-right:
a text "Cancel" (`COLORS.textDim`) + a filled primary button.

Use RN `Modal` with `transparent animationType="fade"` (dialog) or `"slide"`
(sheet). Tapping the overlay closes it. For destructive confirms use
`Alert.alert(...)` with a `style: "destructive"` option.

---

## 12. Floating action button (FAB)

Only when a screen needs a persistent action (rare). 56×56, `borderRadius: 28`,
`backgroundColor: COLORS.text`, positioned `absolute`, `right: 20, bottom: 24–28`.
This is the **only** element that uses a shadow:
```ts
shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8,
shadowOffset: { width: 0, height: 3 }, elevation: 5
```

---

## 13. Icons

- **Feather only.** `import { Feather } from "@expo/vector-icons";`
- Sizes: tab bar 25, feature icons 21–22, inline row icons 13–18, button icons 15–16.
- Colour: `COLORS.text` (primary), `COLORS.textDim` (secondary/meta), `COLORS.bg`
  (on a filled primary button).
- Common names in use: `home, search, file-text, edit-3, edit-2, file, shield,
  check-circle, share-2, clock, trash-2, plus, plus-circle, minus-circle, calendar,
  chevron-right, x, eye, info, feather, arrow-right`.

---

## 14. Spacing scale

Use these; don't invent in-betweens.

| Value | Use |
|---|---|
| 2–4 | input wrapper padding |
| 6–8 | label→input gap, tag padding |
| 10–12 | gaps between rows / inline items |
| 14 | gap between stacked cards; card inner padding (rows) |
| 16–18 | card inner padding (feature cards) |
| 20–22 | **screen edge padding** |
| 28 | section top gap |
| 40–100 | scroll `paddingBottom` (100 if a FAB is present) |

---

## 15. Bottom tab bar (already built — don't duplicate)

Defined once in `app/(tabs)/_layout.tsx`. Height 88, `paddingTop: 10,
paddingBottom: 24`, top hairline border, Feather icons at 25px, active/inactive
use `COLORS.navActive` / `COLORS.navInactive`, labels `fontSize: 11,
fontWeight: "600"`. **To add a feature tab:** create `app/(tabs)/yourfeature.tsx`,
add its route to the `ICONS` map and a `<Tabs.Screen>` entry. Match the existing
title style.

---

## 16. Navigation (expo-router)

- File-based routing under `app/`. Tabs live in `app/(tabs)/`, stack screens at
  `app/*.tsx`, dynamic routes like `app/draft/[type].tsx`.
- Register non-tab screens in `app/_layout.tsx` `<Stack.Screen>` with a `title`.
  **Header colours are themed centrally there — never set them per screen.**
- Navigate with `useRouter().push("/route")`; read params with
  `useLocalSearchParams()`.

---

## 17. Do / Don't

**Do**
- Read every colour from `COLORS`.
- Reuse `GlassCard`, the button/input/tag patterns above.
- Keep it flat, monochrome, generous whitespace, 22px card radius.
- Test **both** light and dark by toggling before you commit.

**Don't**
- Hardcode hex colours (except the white preview paper).
- Use `StyleSheet.create` for colour-dependent styles (breaks theming).
- Add shadows to cards, gradients, or a second icon set.
- Introduce a new accent colour inline — add a token to `ui.ts` and get it reviewed.
- Nest a `SafeAreaView` inside another, or forget `placeholderTextColor`.

---

## 18. Quick-start checklist for a new feature screen

1. Create `app/(tabs)/<name>.tsx` (tab) or `app/<name>.tsx` (stack).
2. Start from the **§4 scaffold**.
3. Use `GlassCard` for every box; buttons/inputs/tags from §7–§9.
4. Colours: `COLORS.*` only. Icons: Feather only.
5. If it's a stack screen, register it in `app/_layout.tsx` with a `title`.
6. Toggle light/dark and confirm nothing is hardcoded.
7. Padding 22 on the screen; radius 22 on cards; primary button = `COLORS.text` bg.
