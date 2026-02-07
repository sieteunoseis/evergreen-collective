# Portland Timbers Lock Screen Wallpaper Generator

## Vision

A PWA that lets Portland Timbers fans generate custom iPhone lock screen wallpapers with the upcoming MLS schedule dynamically overlaid. Users pick a background, the app fetches the latest Timbers fixtures, composites the schedule onto the image, and lets the user save it directly to their camera roll — no "Files" download required.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Cloudflare Workers              │
│  ┌────────────────┐  ┌───────────────────┐  │
│  │  Static Assets  │  │  Worker API        │  │
│  │  (React SPA)    │  │  /api/schedule     │  │
│  │                 │  │  - Fetches from    │  │
│  │                 │  │    SportMonks      │  │
│  │                 │  │  - Caches in KV    │  │
│  └────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────┘
         │                       │
         ▼                       ▼
   Browser (PWA)          SportMonks API v3
   - React + Vite           /football/fixtures
   - shadcn/ui              /between/{from}/{to}/{teamId}
   - html-to-image
   - Web Share API
```

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | React 19 + TypeScript | Widely supported, great DX |
| **Build** | Vite + Cloudflare Vite Plugin | First-class CF Workers integration, HMR, single deploy unit |
| **UI Library** | shadcn/ui + Tailwind CSS v4 | Modern, composable, no runtime overhead, great mobile UX |
| **Hosting** | Cloudflare Workers (with Static Assets) | Frontend + backend API in one Worker, global edge, free tier generous |
| **API Proxy** | Cloudflare Worker (server-side) | Hides SportMonks API key from client, adds caching |
| **Cache** | Cloudflare KV | Cache schedule data (TTL ~1 hour) to reduce API calls |
| **Schedule Data** | SportMonks Football API v3 | MLS fixture data, team-specific endpoints |
| **Image Capture** | html-to-image | Modern fork of dom-to-image, better iOS Safari compat than html2canvas |
| **Image Save** | Web Share API → iOS "Save Image" | Native share sheet on iOS, direct to camera roll — no file download |
| **PWA** | Vite PWA Plugin (vite-plugin-pwa) | Auto-generates manifest + service worker, Add to Home Screen support |

### Why Not Next.js / Remix / React Router v7?

Overkill for a single-page app. A plain React SPA with a lightweight Worker API backend is simpler, faster to build, and has fewer edge-case issues on Cloudflare.

### Why Not Bun?

Cloudflare Workers use the `workerd` runtime, not Node.js or Bun. Bun could be used locally for dev tooling, but there's no runtime benefit on CF. We'll use Node.js/npm for consistency with the CF ecosystem.

---

## Image Layout (iPhone Lock Screen)

Target resolution: **1290 × 2796** (iPhone 14 Pro Max / 15 Pro Max logical). We'll also support **1179 × 2556** (iPhone 14 Pro / 15 Pro) via device detection or user selection.

```
┌──────────────────────────┐  0%
│                          │
│                          │
│      Background Image    │
│      (user selected)     │
│                          │
│    ┌──────────────────┐  │
│    │  iOS Clock Zone   │  │  ~15-33% from top
│    │  (kept clear)     │  │
│    └──────────────────┘  │
│                          │
│                          │
│                          │
│                          │
├──────────────────────────┤  75%
│                          │
│   SCHEDULE ZONE (15%)    │
│   Next 3-5 matches       │
│   Date • Opponent • Time │
│   Compact row layout     │
│                          │
├──────────────────────────┤  90%
│                          │
│   DOCK ZONE (10%)        │
│   (reserved/blank for    │
│    iOS dock icons)       │
│                          │
└──────────────────────────┘  100%
```

### Schedule Zone Design

- Semi-transparent dark overlay bar across the width
- Next 3-5 upcoming Timbers matches
- Each row: `MMM DD  •  [Opponent Logo]  Opponent Name  •  7:30 PM`
- Home/Away indicator (small "vs" or "@")
- Timbers green accent color (#004F30) or white text on dark overlay
- Font: system-ui for consistency with iOS lock screen aesthetic

### Dock Zone

- Bottom 10% left completely clear/transparent
- iOS renders the dock app icons here — any content would be hidden

---

## SportMonks API Integration

### Endpoints Used

1. **GET Team by Name** (one-time lookup):
   `GET /v3/football/teams/search/Portland Timbers`
   → Returns team ID (Portland Timbers ID: **1977** in SportMonks)

2. **GET Fixtures by Date Range for Team**:
   `GET /v3/football/fixtures/between/{startDate}/{endDate}/{teamId}?include=participants;venue`
   → Returns upcoming matches with opponent info

3. **GET Season Fixtures (alternative)**:
   `GET /v3/football/schedules/seasons/{seasonId}?filter=teamId:{teamId}&include=fixtures`

### API Key Management

- Store API key as a Cloudflare Worker **secret** (not in client code)
- Worker proxies requests: client calls `/api/schedule` → Worker calls SportMonks
- Response cached in KV for 1 hour (schedule data doesn't change frequently)

### Data Shape (what we need per fixture)

```typescript
interface Fixture {
  id: number;
  date: string;           // "2026-03-15"
  time: string;           // "19:30"
  opponent: string;        // "LA Galaxy"
  opponentLogo: string;   // URL to team crest
  isHome: boolean;
  venue: string;           // "Providence Park" or away venue
  competition: string;     // "MLS" or "US Open Cup" etc.
}
```

---

## Image Save Strategy (iOS Focus)

### Primary: Web Share API (Level 2)

```typescript
const blob = await toBlob(compositeElement);
const file = new File([blob], 'timbers-wallpaper.png', { type: 'image/png' });

if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file] });
  // iOS shows native share sheet → user taps "Save Image" → Camera Roll
}
```

**Why this is best for iOS:**
- Native iOS share sheet appears
- "Save Image" option saves directly to Photos (Camera Roll)
- No "Files" app detour
- Works in Safari and in PWA standalone mode
- Familiar UX for iOS users

### Fallback: Long-press save

- If Web Share API is unavailable, render the final image as an `<img>` tag
- User can long-press → "Add to Photos" (native iOS behavior)
- Show instructional tooltip: "Long press the image and tap Save to Photos"

---

## PWA Configuration

### Manifest

```json
{
  "name": "Timbers Wallpapers",
  "short_name": "PTFC Walls",
  "description": "Portland Timbers lock screen wallpapers with live schedule",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#004F30",
  "theme_color": "#004F30",
  "icons": [...]
}
```

### Features

- Installable via "Add to Home Screen"
- Offline support (cached backgrounds, last-known schedule)
- App-like fullscreen experience
- Splash screen with Timbers branding

---

## UI/UX Flow

### Screen 1: Background Picker

- Grid of available backgrounds (start with the 2 assets)
- Card-based layout similar to Wallpapers Central / iSpazio
- Tap to select → navigates to editor

### Screen 2: Wallpaper Editor / Preview

- Full-screen phone frame preview showing the composed wallpaper
- Schedule automatically populated from API
- Toggle options:
  - Show/hide schedule overlay
  - Light/dark schedule bar style
  - Number of matches to display (3 or 5)
- "Save Wallpaper" button (triggers Web Share API)

### Screen 3: (Future) Upload Custom Background

- Allow users to upload their own Timbers photos
- Crop/position tool

---

## Project Structure

```
lockscreen/
├── asset/                        # Source background images
│   ├── background-1.jpg
│   └── background-2.jpg
├── public/
│   ├── backgrounds/              # Optimized bg images served as static
│   ├── icons/                    # PWA icons
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── BackgroundPicker.tsx  # Grid of wallpaper choices
│   │   ├── WallpaperEditor.tsx   # Preview + compose + save
│   │   ├── ScheduleOverlay.tsx   # The schedule bar component
│   │   ├── PhoneFrame.tsx        # Visual phone frame for preview
│   │   └── InstallPrompt.tsx     # PWA install banner
│   ├── hooks/
│   │   ├── useSchedule.ts       # Fetch schedule from worker API
│   │   └── useImageExport.ts    # html-to-image + share logic
│   ├── lib/
│   │   ├── utils.ts             # shadcn utils
│   │   └── constants.ts         # Timbers colors, team ID, etc.
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # Tailwind base
├── worker/
│   └── index.ts                 # Cloudflare Worker API
│                                #   GET /api/schedule
│                                #   - Proxies SportMonks
│                                #   - Caches in KV
├── wrangler.jsonc               # Cloudflare config
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── PLAN.md
└── TODO.md
```

---

## Cloudflare Resources Used

| Resource | Purpose | Free Tier |
|----------|---------|-----------|
| **Workers** | Serve SPA + API proxy | 100K req/day |
| **Static Assets** | Background images, JS/CSS | Unlimited |
| **KV** | Cache SportMonks responses | 100K reads/day, 1K writes/day |
| **Custom Domain** (optional) | e.g., timberswalls.com | Free with CF DNS |

---

## Partner App Consideration: Wallpapers Central (iSpazio)

[Wallpapers Central](https://wallpapers.ispazio.net/) by iSpazio is a native iOS/Android app for curated wallpapers. Potential partnership:

- **Submission channel**: Submit generated Timbers wallpapers to their platform (they accept community uploads with review)
- **Cross-promotion**: Link to their app for more wallpaper variety
- **Depth Effect**: Their app supports iOS 16+ Depth Effect wallpapers — a future feature for our generator
- **Reality check**: They are an Italian company (iSpazio S.r.l.) focused on general wallpapers, not sports-specific. A true API partnership is unlikely without significant traction. Better to focus on our own PWA first and consider submission to their platform as a distribution channel later.

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SportMonks API cost | Monthly subscription required | Free tier may suffice for dev; cache aggressively in KV |
| iOS Safari image capture bugs | Blank or corrupted exports | Use html-to-image with CORS-safe image loading; test extensively on real devices |
| Web Share API regression on iOS | "Save to Photos" may not appear | Fallback to long-press `<img>` save with instruction tooltip |
| CORS issues with team logos | Opponent logos fail to render in capture | Proxy logos through Worker or pre-cache as base64 |
| Rate limits on SportMonks | 429 errors during traffic spikes | KV cache with 1hr TTL; schedule data is low-frequency |

---

## Phase Plan

### Phase 1: MVP (Current Focus)
- React + Vite + Cloudflare Workers scaffold
- 2 backgrounds from assets
- SportMonks integration (schedule fetch + cache)
- Schedule overlay rendering
- Image export via Web Share API
- PWA manifest + basic service worker
- Deploy to Cloudflare

### Phase 2: Polish
- More backgrounds / community submissions
- Customization options (overlay style, match count, colors)
- Opponent team logos in schedule
- Device-specific resolution support
- Improved offline experience

### Phase 3: Growth
- Custom background upload + crop
- Share to social media
- Depth Effect wallpaper support (iOS 16+)
- Explore Wallpapers Central submission
- Android optimization
- Analytics (Cloudflare Web Analytics — free)
