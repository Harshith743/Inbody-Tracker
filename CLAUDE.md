# InBody Tracker — Claude Code Context

## Project Overview
A personal Android app for tracking InBody body composition scan results over time.
Built for personal use only — not intended for public deployment.
Developer: Harshith

---

## Tech Stack
- **React Native + Expo SDK 51** (custom dev client — NOT standard Expo Go)
- **TypeScript** (strict mode)
- **React Navigation v6** (Bottom Tab + Stack navigators)
- **expo-sqlite** — local persistence
- **Zustand** — global state
- **react-hook-form + zod** — form validation
- **react-native-gifted-charts** — line, bar, radar, donut charts
- **react-native-calendars** — calendar view
- **react-native-svg** — segmental body map figure
- **react-native-image-picker** — camera + gallery
- **Groq Vision API** — OCR auto-fill (model: `meta-llama/llama-4-scout-17b-16e-instruct`)
- **expo-file-system/legacy** — base64 image conversion (MUST use `/legacy` not `/`)

---

## Project Location
```
C:\Users\harsh\Desktop\Projects\personal\inbody-tracker
```

## Environment (set in every new PowerShell session)
```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:PATH += ";C:\Android\Sdk\platform-tools"
```

## Running the App
```powershell
npx expo run:android
```
Physical device connected via USB debugging. ADB device: `RZCX90N5YWB`

## Building APK
```powershell
cd android
.\gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```
> ⚠️ Known issue: Windows 260-char path limit may cause build failure.
> Fix: Run as Admin → `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force` → Restart PC

---

## Folder Structure
```
inbody-tracker/
├── app/
│   ├── index.tsx              # Dashboard
│   ├── reports.tsx            # Reports list
│   ├── add-report.tsx         # Add/Edit form + OCR scan
│   ├── report/[id].tsx        # Report detail
│   ├── compare.tsx            # Compare screen
│   └── calendar.tsx           # Calendar view
├── components/
│   ├── StatCard.tsx
│   ├── TrendChart.tsx
│   ├── SegmentalBodyMap.tsx   # Swipeable lean/fat body map cards
│   └── ScoreGauge.tsx
├── db/
│   ├── schema.ts              # SQLite table definitions
│   └── queries.ts             # insertReport, getAllReports, getReportById,
│                              # updateReportDate, deleteReport
├── store/
│   └── reportStore.ts         # Zustand store
├── types/
│   └── report.ts              # InBodyReport interface (see below)
├── utils/
│   ├── extractWithGroq.ts     # ✅ ACTIVE — Groq Vision OCR pipeline
│   ├── parseInBodyText.ts     # ❌ ABANDONED — zone-based ML Kit (do not use)
│   └── extractZone.ts         # ❌ ABANDONED — zone cropping (do not use)
└── theme/
    └── index.ts               # Design tokens
```

---

## InBodyReport Type
```typescript
interface InBodyReport {
  id: string;
  date: string;                 // ISO date string YYYY-MM-DD
  inbodyScore: number;
  weight: number;
  totalBodyWater: number;
  protein: number;
  mineral: number;
  bodyFatMass: number;
  fatFreeMass: number;
  skeletalMuscleMass: number;
  bmi: number;
  percentBodyFat: number;
  visceralFatLevel: number;
  waistHipRatio: number;
  basalMetabolicRate: number;
  obesityDegree: number;
  segLeanLeftArm: number;      segLeanLeftArmPct: number;
  segLeanRightArm: number;     segLeanRightArmPct: number;
  segLeanTrunk: number;        segLeanTrunkPct: number;
  segLeanLeftLeg: number;      segLeanLeftLegPct: number;
  segLeanRightLeg: number;     segLeanRightLegPct: number;
  segFatLeftArm: number;       segFatLeftArmPct: number;
  segFatRightArm: number;      segFatRightArmPct: number;
  segFatTrunk: number;         segFatTrunkPct: number;
  segFatLeftLeg: number;       segFatLeftLegPct: number;
  segFatRightLeg: number;      segFatRightLegPct: number;
  notes?: string;
}
```

---

## Screen Descriptions

### Dashboard (app/index.tsx)
- InBody Score as cyan donut gauge (Bebas_Neue font, shows X/100)
- Key metrics: Weight, SMM, Body Fat%, Visceral Fat Level with delta vs previous scan
- Trend line chart with Weight/SMM/PBF toggle
- Segmental bar summary per body segment

### Reports List (app/reports.tsx)
- Sorted newest first
- Each row: date, score badge, weight, SMM, PBF
- Swipe left to delete (with confirmation)
- Tap → Report Detail

### Add/Edit Report (app/add-report.tsx)
- "📷 Scan Report (Auto-fill)" button at top
  - Alert: "Take Photo" | "Choose from Gallery" | "Cancel"
  - Calls `extractWithGroq(imageUri)` → pre-fills form
  - Cyan left border on auto-filled fields
  - Toast: "X fields auto-filled — please review before saving"
- Fields grouped in collapsible sections
- Edit mode: pre-fills from existing report, calls `updateReport` on save

### Report Detail (app/report/[id].tsx)
- Full metric breakdown with range bars (red if out of range)
- InBody Score gauge
- Segmental Balance: horizontal ScrollView, 2 swipeable cards (Lean / Fat)
  - SVG body figure with overlaid pill labels per segment
  - Pagination dots + swipe hint text
  - Colors: green (#00C97B) = normal, orange (#FF6B35) = over, red (#FF4444) = under
- Share (expo-sharing) + Edit buttons

### Compare (app/compare.tsx)
- Multi-select up to 4 reports
- Grouped bar chart: Weight, SMM, BFM, PBF
- Delta table with colored arrows (↑↓)
- Radar chart: Segmental Lean % — labels are L.Arm, R.Arm, Trunk, L.Leg, R.Leg

### Calendar (app/calendar.tsx)
- Month view, cyan dots on scan dates
- Tap date → bottom sheet: key stats + "View Full Report" + "Change Date"

---

## OCR Pipeline (utils/extractWithGroq.ts)

```
User taps "Scan Report"
→ Alert sheet: Take Photo / Choose from Gallery
→ react-native-image-picker
→ extractWithGroq(imageUri):
    1. FileSystem.readAsStringAsync(uri, { encoding: Base64 })
       — import from 'expo-file-system/legacy' (NOT 'expo-file-system')
    2. POST to https://api.groq.com/openai/v1/chat/completions
       model: meta-llama/llama-4-scout-17b-16e-instruct
       image sent as base64 data URL
    3. Prompt asks for raw JSON of all 35+ InBodyReport fields
    4. JSON.parse → Partial<InBodyReport>
→ react-hook-form reset() merges parsed values
→ Cyan highlights + toast
```

**API key (.env):**
```
EXPO_PUBLIC_GROQ_API_KEY=your_key_here
```

**Critical import — always use legacy:**
```typescript
import * as FileSystem from 'expo-file-system/legacy'; // ✅
import * as FileSystem from 'expo-file-system';         // ❌ throws deprecation error
```

---

## Design System (theme/index.ts)

| Token | Value |
|---|---|
| Background | `#0D0F14` |
| Surface | `#161B24` |
| Card | `#1E2533` |
| Accent / Cyan | `#00E5FF` |
| Over / Warning | `#FF6B35` |
| Normal / Success | `#00C97B` |
| Under / Error | `#FF4444` |
| Text Primary | `#F0F4FF` |
| Text Muted | `#6B7A99` |

**Fonts:** `Bebas_Neue` for large stat numbers, `Space_Grotesk` for body text

**Tab bar:** background `#161B24`, border `#1E2533`
**Tab icons (Ionicons):**
- Dashboard → `stats-chart`
- Reports → `document-text`
- Compare → `git-compare`
- Calendar → `calendar`
- Active: `#00E5FF` | Inactive: `#6B7A99`

---

## Important Notes & Gotchas

1. **App cannot run in Expo Go** — expo-dev-client is installed, always use `npx expo run:android`
2. **expo-file-system import** — always `expo-file-system/legacy`, never bare `expo-file-system` (for OCR pipeline in `extractWithGroq.ts`)
3. **parseInBodyText.ts and extractZone.ts** — these files exist but are completely unused. The ML Kit zone-based OCR approach was abandoned after many failed calibration attempts. Do not refactor or reactivate them.
4. **Build warnings** — all `w:` deprecation warnings during Gradle build come from third-party libraries, safe to ignore
5. **TypeScript errors** — always run `npx tsc --noEmit` and fix all errors before considering a step complete
6. **Seeded data** — 3 test reports exist: Jan 1 2025, Feb 11 2026, Mar 15 2026
7. **Windows path length** — if build fails with "Filename longer than 260 characters", enable long paths via registry (see Build section above)

---

## Error Handling Conventions

- **All `.then()` chains must have `.catch()`** — unhandled promise rejections crash the app on Android
- **`extractWithGroq` throws on failure** — callers must wrap in try/catch; `add-report.tsx` already does this via `runOCR`'s catch block
- **User-visible errors** — always use `Alert.alert()` for errors the user needs to know about; never swallow with just `console.error`
- **`insertReport`** — returns the generated UUID string; `addReport` in the store uses this return value
- **Error Boundary** — `App.tsx` wraps the entire app in an `ErrorBoundary` class component; any screen-level crash shows a "Try Again" screen instead of a white screen

---

## Workflow Convention
- One step at a time, confirm zero TypeScript errors before proceeding
- Run `npx tsc --noEmit` after every code change
- Always use theme constants — no hardcoded colors anywhere
- Keep all styling consistent with the dark theme design system above
- No `console.log` / `console.error` in production paths — use `Alert.alert` for user-facing errors
