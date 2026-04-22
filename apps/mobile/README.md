# Schwankie Mobile

Native iOS/Android app built with Expo (SDK 55, React 19, React Native 0.83).

## Setup

1. Copy `.env.example` to `.env` and fill in environment variables:
   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:3001  # or production URL
   EXPO_PUBLIC_API_KEY=your-bearer-token
   ```

2. From the monorepo root:
   ```bash
   bun install
   bun run dev:mobile
   ```

3. In the Expo CLI, press `i` for iOS simulator or `a` for Android.

## Architecture

- **Tabs**: Queue (default), Feeds, Emails, Settings
- **Queue**: Lists queued links from the API, paginates on scroll
- **Theme**: Stone & Slate color system (light/dark mode)
- **Client**: Shared API client from `packages/client`
- **State**: React Query for server state management

## Environment Variables

- `EXPO_PUBLIC_API_URL`: API base URL (required)
- `EXPO_PUBLIC_API_KEY`: Bearer token for auth-protected endpoints (optional)

## EAS Deployment

Build profiles are defined in `eas.json`:
- **development**: Internal build with dev client
- **preview**: Internal TestFlight build
- **production**: App Store production build

```bash
eas build --platform ios --profile preview
eas submit --platform ios --profile production
```

## Testing Locally

### iOS Simulator

```bash
bun run dev:mobile
# Press 'i' in Expo CLI
```

### TestFlight

```bash
eas build --platform ios --profile preview
# Follow prompts to submit to TestFlight
```
