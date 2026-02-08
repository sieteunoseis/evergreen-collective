# Claude Code Notes

## Project Overview

Evergreen Barracks - A PWA for Portland Timbers fans to create custom iPhone lock screen wallpapers with schedule overlays.

## Key Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Hosting**: Cloudflare Pages (static site, no Workers API yet)
- **PWA**: vite-plugin-pwa with service worker
- **Image Generation**: Canvas API (not html-to-image)

## Important Files

- `src/App.tsx` - Main app, preview modal, pinch-to-zoom
- `src/components/BackgroundPicker.tsx` - Carousel, tab header, theme toggle
- `src/hooks/usePWAInstall.ts` - PWA install detection, `isDesktopStandalone`
- `src/hooks/useImageExport.ts` - Canvas-based wallpaper generation
- `public/backgrounds.json` - Background metadata (loaded dynamically)

## Platform Detection

The app detects several platform states:
- `isInstalled` - Running as installed PWA (standalone mode)
- `isDesktopStandalone` - Installed PWA on desktop (no touch, standalone)
- `isIOS` - iOS device (shows manual install instructions)
- `isMobile` - Touch device or narrow viewport

Desktop Chrome PWA needs special handling because `env(safe-area-inset-top)` returns 0.

## Debugging

Set `VITE_DEBUG=1` to enable:
- Console logging of platform info
- Debug overlay in the app

For mobile testing via ngrok:
```bash
npm run dev
# In another terminal:
ngrok http 5173
```

Note: Dev server has HMR which causes auto-refresh. Use `npm run preview` for static testing.

## Deployment

Push to `main` triggers GitHub Action that deploys to Cloudflare Pages.
- Production URL: https://lockscreen-8ua.pages.dev

## PWA Icons

Current icons use `"any maskable"` which is discouraged. See `ICONS.md` for proper setup:
- Separate `any` and `maskable` icons needed
- Maskable safe zone: center 80% (410x410 of 512x512)

## Tested Platforms

- Chrome on macOS (browser and installed PWA)
- Safari on iOS 26
- Chrome on iOS 26

## Future Work

- Backend logging (Cloudflare Analytics Engine)
- SportMonks API integration for live schedule
- Separate maskable PWA icons
