# Maestro E2E Tests

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro) installed globally
- Expo Go app on device/simulator (for native tests)

## Test Flow

`scripts-browse-preview-save.yaml` — Tests the full Scripts screen flow:

1. Navigate to Scripts tab
2. Search for "Bad Moon Rising"
3. Preview first result → verify no unknown roles
4. Save the script → verify Saved count updates
5. Open Saved tab → click the script → verify no unknown roles

## Running on Expo Go

```bash
# Start Expo dev server + run tests
.maestro/run-expo-go.sh

# Or manually:
npx expo start
# In another terminal:
maestro test .maestro/scripts-browse-preview-save.yaml
```

## Running on Web (Chromium)

```bash
# Start Expo web server + run tests
.maestro/run-web.sh

# Or manually:
npx expo start --web
# In another terminal:
maestro test .maestro/scripts-browse-web.yaml
```

## Running with Maestro Studio

```bash
maestro studio
# Then point-and-click to explore and debug flows
```

## Adding New Tests

Create `.yaml` files in this directory. Maestro discovers all `.yaml` files when you run `maestro test`.

### Key Selectors Used

| Selector | Element | Notes |
|----------|---------|-------|
| `"Scripts tab"` | Bottom tab bar | accessibilityLabel |
| `"Browse tab"` | Browse/Saved toggle | accessibilityLabel |
| `"Saved tab"` | Browse/Saved toggle | accessibilityLabel |
| `"Search scripts"` | TextInput | accessibilityLabel (matched via `text:`) |
| `"Preview Bad Moon Rising"` | Preview button | accessibilityLabel (via `text:` selector) |
| `"Save Bad Moon Rising"` | Save button | accessibilityLabel (via `text:` selector) |
| `"Save Script"` | Modal save button | accessibilityLabel |
| `"Close"` | Modal close button | accessibilityLabel |
| `"Unknown roles"` | Modal text | Only visible when unknownCount > 0 |
