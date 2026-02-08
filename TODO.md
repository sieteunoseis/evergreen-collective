# TODO — Evergreen Collective

## PWA Icons
- [ ] Create separate `any` and `maskable` icons (don't combine purposes)
- [ ] Required sizes: 192x192 and 512x512 (minimum for Chromium install)
- [ ] Maskable icon safe zone: logo must fit within center 80% (410x410 of 512x512)
- [ ] Update manifest.json with separate icon entries
- [ ] Test with [Maskable.app](https://maskable.app/) before deploying

### Current Icon Issues
- Icons currently use `purpose: "any maskable"` which is discouraged
- Need separate icons: standard (any) and maskable variants

### Recommended Manifest Structure
```json
{
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Sources
- [MDN: Define your app icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons)
- [PWA Icon Requirements and Safe Areas](https://logofoundry.app/blog/pwa-icon-requirements-safe-areas)
- [Why not to use "any maskable"](https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78)
