# FeELINE

## Folder Structure

```
feeline/
├── app/                    # Expo Router-based application screens
│   ├── (screens)/          # Screen groups
│   │   ├── (tabs)/         # Screens that live inside a tab navigator
│   │   └── (auth)/         # User authentication (Google)
│   ├── api/                # Client-side API route handlers or wrappers for calling the backend
│   ├── components/         # Reusable UI components
│   ├── data/                # Static or seed data, mock data, constants used for local reference
│   ├── hooks/               # Custom React hooks (e.g., useAuth, useLocation, useFetchUser) — reusable stateful logic
│   ├── services/            # Business logic services
│   ├── types/               # TypeScript type/interface definitions shared across the app
│   ├── utils/                # Helper/utility functions — formatting, validation, calculations — pure functions with no UI
│   ├── _layout.tsx           # Root layout
│   └── index.tsx             # Entry point
├── assets/                 # Static assets (theme, images, etc.)
├── backend/                # Backend API
├── web-admin/              # Admin dashboard (if applicable)
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm
- Expo CLI
- iOS Simulator / Android Emulator / physical device for testing

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env` (if applicable)
   - Set `EXPO_PUBLIC_API_URL` to your backend API endpoint

## Development

To start the development server:

```bash
# Start Expo development server
npx expo start

# For Android
npx expo start --android

# For iOS
npx expo start --ios

# For Web
npx expo start --web
```

## Available Scripts

| Script | Description |
|---|---|
| `npm start` or `expo start` | Start the development server |
| `npm run android` | Start on Android emulator/device |
| `npm run ios` | Start on iOS simulator/device |
| `npm run web` | Start on web browser |
| `npm run lint` | Run ESLint for code quality |
| `npm run reset-project` | Reset to blank project state |

## Learn More

To learn more about developing your project with Expo, check out the following resources:

- [Expo documentation](https://docs.expo.dev/) — learn fundamentals, or go deeper with the [guides](https://docs.expo.dev/guides)
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/) — a step-by-step tutorial where you'll build a project that runs on Android, iOS, and the web

## Join the Community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo) — view the open source platform and contribute
- [Discord community](https://chat.expo.dev) — chat with Expo users and ask questions