# InBody Tracker

A personal Android app for tracking [InBody](https://inbody.com/) body composition scan results over time.

## Features

- **Dashboard** — InBody Score gauge, key metrics with delta vs previous scan, trend charts, segmental analysis
- **Report Detail** — Full metric breakdown with range indicators and swipeable segmental lean/fat body maps
- **OCR Auto-fill** — Scan your InBody printout with your camera; Groq Vision AI extracts all 35+ fields automatically
- **Compare** — Side-by-side comparison of up to 4 scans with bar charts and radar chart
- **Calendar** — Month view showing all scan dates; tap to see a summary and reassign dates
- **Local storage** — All data stays on your device via SQLite; no account or internet required (except for OCR)

## Screenshots

> Coming soon

## Tech Stack

- React Native + Expo SDK 54
- TypeScript
- expo-sqlite (local persistence)
- Zustand (state management)
- react-hook-form + Zod (form validation)
- react-native-gifted-charts (charts)
- Groq Vision API — `meta-llama/llama-4-scout-17b-16e-instruct` (OCR)

## Download

Get the latest APK from the [Releases](https://github.com/Harshith743/Inbody-Tracker/releases) page.

> Enable **Install from unknown sources** in Android settings before installing.

## Running Locally

### Prerequisites

- Node.js 18+
- Android SDK + JDK 17
- Physical Android device with USB debugging enabled

### Setup

```bash
git clone https://github.com/Harshith743/Inbody-Tracker.git
cd Inbody-Tracker
npm install
```

Create a `.env` file in the project root:

```
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com).

### Run on device

```bash
npx expo run:android
```

> The app uses `expo-dev-client` and cannot run in standard Expo Go.

### Build release APK

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Project Structure

```
app/               # Screens (Expo Router file-based)
├── index.tsx      # Dashboard
├── reports.tsx    # Reports list
├── add-report.tsx # Add / Edit report with OCR
├── report/[id].tsx# Report detail
├── compare.tsx    # Compare scans
└── calendar.tsx   # Calendar view
components/        # Shared UI components
db/                # SQLite schema and queries
store/             # Zustand store
types/             # TypeScript interfaces
utils/             # Groq OCR pipeline
theme/             # Design tokens (colors, fonts, spacing)
```

## Notes

- Personal use only — not published to any app store
- OCR works best with good lighting and a flat, undistorted photo of the printout
- All data is stored locally; uninstalling the app will erase all records
