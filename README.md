# Daily Planner 2

A cross-platform mobile task management app built with React Native and Expo. Organize your daily to-dos with drag-and-drop reordering, calendar navigation, and automatic dark mode support.

## Features

- **Daily task management** — create, complete, and delete tasks per day
- **Date navigation** — browse dates with arrow buttons or a pop-up calendar
- **Drag-and-drop reordering** — long-press a task and drag to reprioritize
- **Swipe to delete** — right-swipe gesture to remove tasks
- **Calendar dot markers** — see at a glance which dates have tasks
- **Dark mode** — automatically follows your device's color scheme
- **Persistent storage** — all tasks saved locally via AsyncStorage

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo ~54.0.0 |
| UI | React Native 0.81.5, React 19 |
| Language | TypeScript ~5.9.2 (strict) |
| Calendar | react-native-calendars |
| Drag & drop | react-native-draggable-flatlist |
| Gestures | react-native-gesture-handler |
| Animations | react-native-reanimated |
| Storage | @react-native-async-storage/async-storage |

## Project Structure

```
DailyPlanner2/
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Date navigation & calendar toggle
│   │   ├── CalendarPanel.tsx # Calendar with task markers
│   │   ├── TodoList.tsx      # List view with add input
│   │   └── TodoItem.tsx      # Individual task row
│   ├── screens/
│   │   └── MainScreen.tsx    # Root screen & state orchestration
│   ├── hooks/
│   │   └── useTodos.ts       # Task CRUD logic & persistence
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── utils/
│   │   ├── date.ts           # Date formatting helpers
│   │   └── storage.ts        # AsyncStorage helpers
│   └── theme/
│       └── colors.ts         # Light & dark color palettes
├── App.tsx                   # Root component
├── app.json                  # Expo configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For iOS: macOS with Xcode or an iOS device with the Expo Go app
- For Android: Android Studio emulator or an Android device with the Expo Go app

### Install

```bash
npm install
```

### Run

```bash
npm start          # Launch Expo CLI (choose platform interactively)
npm run android    # Open on Android emulator or device
npm run ios        # Open on iOS simulator or device
npm run web        # Open in the browser
```

Scan the QR code shown in the terminal with the **Expo Go** app to run on a physical device.

## Platform Targets

| Platform | Bundle ID |
|---|---|
| iOS | `com.dailyplanner.app` |
| Android | `com.dailyplanner.app` |
| Web | Browser |

> iOS is locked to portrait orientation. Tablet support is not enabled.

## Storage

Tasks are stored locally using the AsyncStorage key `@DailyPlanner:todos`. Data is organized per date (`YYYY-MM-DD`) and persists across sessions. No server or account required.

## License

MIT
