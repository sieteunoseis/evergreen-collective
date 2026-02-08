# Evergreen Collective

A PWA for Portland Timbers fans to create custom iPhone lock screen wallpapers featuring the upcoming match schedule.

## Features

- **Custom Wallpapers** - Choose from curated Timbers-themed backgrounds
- **Live Schedule Overlay** - Displays the next 5 matches with opponent logos
- **Home/Away Styling** - Bold dates for home matches, italic for away
- **Mobile-First Design** - Optimized for iPhone with safe area support
- **Easy Sharing** - Uses Web Share API on mobile for one-tap save to Photos

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Canvas API for image generation
- Web Share API for mobile sharing

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

1. User browses the wallpaper carousel and taps a design
2. App loads the current Timbers schedule (mock data in dev, API in production)
3. Canvas API composites the background with opponent logos and match dates
4. On mobile, the Web Share API opens the share sheet for saving to Photos
5. On desktop, a download button saves the PNG directly

## Project Structure

```text
src/
├── components/
│   ├── BackgroundPicker.tsx  # Main carousel and UI
│   ├── ScheduleOverlay.tsx   # Schedule rendering
│   └── WallpaperEditor.tsx   # Canvas composition
├── hooks/
│   ├── useSchedule.ts        # Schedule data fetching
│   └── useImageExport.ts     # Canvas export logic
├── lib/
│   ├── constants.ts          # Colors, dimensions, backgrounds
│   ├── mockData.ts           # Development fixture data
│   └── utils.ts              # Utility functions
└── App.tsx                   # Main app component
```

## Adding Backgrounds

Add new wallpaper images to `public/backgrounds/` and register them in `src/lib/constants.ts`:

```typescript
{
  id: 'bg-new',
  name: 'Display Name',
  thumbnail: '/backgrounds/your-image.jpg',
  fullRes: '/backgrounds/your-image.jpg',
  credit: 'Artist Name', // optional
}
```

## Screen Dimensions

Wallpapers are generated at iPhone Pro Max resolution (1290 x 2796) for maximum quality. The layout accounts for iOS safe areas:

- Clock zone: 15-33% from top
- Schedule overlay: 72-90% from top
- Dock zone: bottom 10%

## License

Built by fans, for fans. Rose City Til I Die.
