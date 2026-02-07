# TODO — Portland Timbers Lock Screen Generator

## Phase 1: MVP

### Project Setup
- [ ] Initialize React + TypeScript project with Vite
- [ ] Install and configure Cloudflare Vite plugin (`@cloudflare/vite-plugin`)
- [ ] Configure wrangler.jsonc (Workers, KV namespace, static assets, SPA routing)
- [ ] Install and initialize shadcn/ui + Tailwind CSS v4
- [ ] Set up path aliases (`@/` → `./src`)
- [ ] Configure TypeScript (tsconfig.json, tsconfig.app.json)
- [ ] Set up PWA plugin (vite-plugin-pwa) with Timbers-branded manifest
- [ ] Create PWA icons from Timbers branding (192x192, 512x512)
- [ ] Add .gitignore, .env.example

### Cloudflare Worker API
- [ ] Create `worker/index.ts` with request router
- [ ] Implement `GET /api/schedule` endpoint
- [ ] Integrate SportMonks API v3 — fetch Timbers fixtures by date range
- [ ] Add KV caching layer (1hr TTL for schedule data)
- [ ] Store SportMonks API key as Worker secret (`wrangler secret put SPORTMONKS_API_KEY`)
- [ ] Proxy opponent team logo images through Worker (CORS workaround)
- [ ] Add error handling and graceful fallbacks (empty schedule, API down)

### Background Images
- [ ] Optimize existing assets (WebP conversion, multiple resolutions)
- [ ] Copy optimized backgrounds to `public/backgrounds/`
- [ ] Create background metadata (id, name, thumbnail, full-res path, credit)

### UI Components
- [ ] **App.tsx** — routing (background picker ↔ editor), global state
- [ ] **BackgroundPicker.tsx** — grid of background cards, tap to select
- [ ] **WallpaperEditor.tsx** — full preview, controls, save button
- [ ] **ScheduleOverlay.tsx** — semi-transparent bar with next 3-5 matches
- [ ] **PhoneFrame.tsx** — visual iPhone frame around preview (optional, nice-to-have)
- [ ] **InstallPrompt.tsx** — PWA "Add to Home Screen" banner for Safari

### Schedule Overlay Design
- [ ] Semi-transparent dark bar positioned at 75-90% of image height
- [ ] Render match rows: date, home/away indicator, opponent name, time
- [ ] Handle edge cases: no upcoming matches, season break, postponed matches
- [ ] Style with Timbers brand colors (#004F30 green, #EBE4D3 gold/cream)

### Image Export
- [ ] Install and configure `html-to-image`
- [ ] Create `useImageExport` hook — captures composite div as PNG blob
- [ ] Implement Web Share API flow (primary: `navigator.share({ files })`)
- [ ] Implement long-press fallback (render `<img>` tag for manual save)
- [ ] Show instructional UI for fallback path ("Long press → Save to Photos")
- [ ] Handle CORS: ensure background images load from same origin
- [ ] Test on real iOS device (Safari + PWA standalone mode)

### Data Hooks
- [ ] **useSchedule.ts** — fetch `/api/schedule`, loading/error states, auto-refresh
- [ ] Transform SportMonks response into internal `Fixture[]` type

### PWA
- [ ] Configure manifest.json (name, icons, theme_color, background_color)
- [ ] Service worker: cache backgrounds, app shell, last-known schedule
- [ ] Test "Add to Home Screen" flow on iOS Safari
- [ ] Verify standalone mode works (no Safari chrome)

### Deploy
- [ ] Test build locally (`npm run build && npm run preview`)
- [ ] Deploy to Cloudflare (`wrangler deploy`)
- [ ] Bind KV namespace in Cloudflare dashboard
- [ ] Set SportMonks API secret in production
- [ ] Verify production deployment end-to-end
- [ ] (Optional) Configure custom domain

---

## Phase 2: Polish
- [ ] Add more background options (community / new designs)
- [ ] Customization toggles: overlay theme (light/dark), match count (3/5), font style
- [ ] Fetch and display opponent team logos (small crests) in schedule rows
- [ ] Device resolution picker or auto-detect (iPhone 14/15/16 variants)
- [ ] Improved offline UX: stale schedule indicator, retry button
- [ ] Add loading skeleton states
- [ ] Smooth page transitions / animations (Framer Motion or CSS)
- [ ] Accessibility audit (color contrast, screen reader)

---

## Phase 3: Growth
- [ ] Custom background upload with crop/position tool
- [ ] Social media share (Instagram stories, Twitter)
- [ ] iOS 16+ Depth Effect wallpaper support (separate foreground/background layers)
- [ ] Investigate Wallpapers Central (iSpazio) submission as distribution channel
- [ ] Android-specific testing and optimization
- [ ] Cloudflare Web Analytics integration
- [ ] Multiple team support (Thorns, future expansion)
- [ ] Schedule widget showing match countdown

---

## Research / Decisions Needed
- [ ] Obtain SportMonks API key and confirm Portland Timbers team ID (likely 1977)
- [ ] Decide on custom domain name
- [ ] Evaluate SportMonks free tier limits vs. paid plan needs
- [ ] Test Web Share API "Save to Photos" on iOS 17+ (confirm no regression from iOS 16 bug)
- [ ] Determine if opponent logos need licensing consideration
