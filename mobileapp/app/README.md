# Cosaarthi Mobile

Production-oriented Expo mobile app for the Cosaarthi Data Platform Crowd Worker persona.

## Run

```bash
npm install
npm start
```

Use Expo Go with this project's Expo SDK. For a physical iPhone on the same network, run `npx expo start --clear` and scan the QR code from Expo CLI with the iPhone Camera app. If port 8081 is busy, use:

```bash
npx expo start --port 8099
```

## Environment

Copy `.env.example` and point it at the standalone mobile backend.

```bash
EXPO_PUBLIC_API_MODE=real
EXPO_PUBLIC_API_URL=http://<LAN_IP>:8001/api/v1
```

Use the Mac LAN IP for physical-device testing. `localhost` works only for simulator/web.

## Architecture

- `src/app`: Expo Router screens and navigation groups.
- `src/api`: centralized Cosaarthi API adapter, mock adapter, and real adapter.
- `src/services`: SecureStore session and SQLite upload queue services.
- `src/features/uploads`: upload queue hooks and queue processor.
- `src/components`: reusable mobile UI components and work-specific cards.
- `src/types`: Cosaarthi domain and form types.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo export --platform ios --clear
```
