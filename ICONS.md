# PWA Icon Requirements

## Minimum Required Sizes

- **192x192** - Android/Chrome minimum for install
- **512x512** - Android/Chrome splash, high-res displays

## Icon Types (Don't Combine!)

### Standard Icons (`purpose: "any"` or omit)

- Used by Windows, macOS Ventura or lower
- Logo can extend to edges
- No special padding needed

### Maskable Icons (`purpose: "maskable"`)

- Used by Chrome OS, macOS Sonoma+, Android adaptive icons
- **Safe zone**: Logo must fit within center 80% (circle with 40% radius)
- For 512x512: keep logo within 410x410 centered area (51px margin each side)
- Background must extend to full edges (no transparency)

## Current Issues

Your manifest uses `"purpose": "any maskable"` which is **discouraged** because:

- Maskable icons have extra padding, so they look too small when used as "any"
- Standard icons have no padding, so they get cropped badly when masked

## Recommended Setup

Create **separate** icon files:

| File | Size | Purpose | Notes |
|------|------|---------|-------|
| `icon-192.png` | 192x192 | any | Standard, logo to edges |
| `icon-512.png` | 512x512 | any | Standard, logo to edges |
| `maskable-512.png` | 512x512 | maskable | Logo in center 80%, full bleed background |
| `apple-touch-icon.png` | 180x180 | iOS | Standard, no transparency |

## Manifest Example

```json
{
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## Testing

Use [Maskable.app](https://maskable.app/) to preview how your maskable icon will look across different OS mask shapes.

## Sources

- [MDN: Define your app icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons)
- [PWA Icon Requirements and Safe Areas](https://logofoundry.app/blog/pwa-icon-requirements-safe-areas)
- [Why not to use "any maskable"](https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78)
- [Vite PWA Minimal Requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html)
