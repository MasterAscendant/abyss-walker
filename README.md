# Abyss Walker - PWA Game Framework

A complete Progressive Web App game framework with offline support, touch controls, and native app-like experience.

## Features

### PWA Capabilities
- **Installable** - Add to home screen on iOS/Android
- **Offline Play** - Service worker caches assets for offline gameplay
- **Background Sync** - Queue high scores for sync when connection returns
- **Fullscreen Experience** - Standalone display mode, landscape orientation

### Mobile Optimizations
- **Virtual Joystick** - Touch-friendly movement controls
- **Action Buttons** - Attack and defend touch controls
- **Fullscreen API** - Toggle fullscreen on supported devices
- **Wake Lock** - Prevent screen sleep during gameplay
- **Orientation Lock** - Landscape-only gameplay
- **Safe Area Support** - Respects notches and home indicators

### Game Engine
- **Canvas-based Rendering** - Hardware-accelerated 2D graphics
- **Delta Time Game Loop** - Consistent gameplay across frame rates
- **RequestAnimationFrame** - Smooth 60fps animation
- **Auto-pause** - Pause when tab loses focus
- **FPS Counter** - Built-in performance monitoring

## Project Structure

```
game/
├── index.html           # App shell with splash screen
├── manifest.json        # PWA manifest
├── sw.js               # Service worker (offline/background sync)
├── game.js             # Main game engine
├── touch-controls.js   # Virtual joystick & action buttons
├── fullscreen.js       # Fullscreen API wrapper
├── wakelock.js         # Screen wake lock management
├── assets/
│   └── styles.css      # Additional styles
├── icons/              # App icons (add your own)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-256x256.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── README.md
```

## Setup

### 1. Add Icons
Generate PWA icons and place them in `game/icons/`. Recommended sizes: 72, 96, 128, 144, 152, 192, 256, 384, 512px.

Use a tool like:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [Favicon.io](https://favicon.io/)

### 2. Add Splash Screens (iOS)
Generate iOS splash screens and place them in `game/assets/`:
- iPad Pro 12.9": 2048×2732
- iPad Pro 11": 1668×2388
- iPad 10.5": 1668×2224
- iPad 9.7": 1536×2048
- iPhone XS Max: 1242×2688
- iPhone XS: 1125×2436
- iPhone XR: 828×1792
- iPhone 8: 750×1334
- iPhone SE: 640×1136

### 3. Serve with HTTPS
PWAs require HTTPS. For local development:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (npx serve)
npx serve -l 8000

# Using Vite
npm create vite@latest
```

### 4. Test PWA
Use Chrome DevTools → Lighthouse to audit PWA compliance.

## Usage

### Basic Game Loop
```javascript
// Access the game instance
const game = window.abyssGame;

// Game is automatically started
// Access properties:
game.fps;           // Current FPS
game.isPaused;      // Pause state
game.player;        // Player object
game.entities;      // Game entities
game.particles;     // Particle system
```

### Adding Entities
```javascript
// Add a custom entity
game.entities.push({
  x: 100,
  y: 100,
  update: function(dt) {
    // Update logic
  },
  render: function(ctx) {
    // Render logic
    ctx.fillStyle = '#f00';
    ctx.fillRect(this.x, this.y, 32, 32);
  }
});
```

### Spawning Particles
```javascript
game.spawnParticle(x, y, color, life);
```

### High Scores
```javascript
// Save a high score (auto-syncs when online)
await game.saveHighScore(1000);

// Get all high scores
const scores = game.getHighScores();
```

## Touch Controls

The framework automatically detects touch devices and shows virtual controls.

### Accessing Joystick Input
```javascript
const joystick = window.touchControls.getJoystick();
if (joystick.active) {
  // joystick.x and joystick.y are -1 to 1
  console.log(joystick.x, joystick.y);
}
```

### Handling Action Buttons
Action buttons automatically call `window.gameAction()`:
```javascript
window.gameAction = function(action) {
  switch(action) {
    case 'attack':
      // Handle attack
      break;
    case 'defend':
    case 'action':
      // Handle defend/action
      break;
  }
};
```

## Fullscreen API

```javascript
// Access fullscreen manager
const fs = window.fullscreenManager;

// Methods
fs.request();   // Enter fullscreen
fs.exit();      // Exit fullscreen
fs.toggle();    // Toggle fullscreen

// Properties
fs.isFullscreen;  // Current state
fs.isStandalone;  // Running as installed PWA
fs.isSupported(); // Fullscreen API available
```

## Wake Lock

```javascript
// Access wake lock manager
const wl = window.wakeLockManager;

// Methods
wl.request();  // Prevent screen sleep
wl.release();  // Allow screen sleep

// Properties
wl.status;     // { active, supported }
```

## Service Worker

The service worker provides:
- **Static caching** - Core app files cached on install
- **Dynamic caching** - Game assets cached on demand
- **Image caching** - Separate cache for images
- **Background sync** - Queue high scores for later sync
- **Update handling** - Notify users of new versions

### Manual Cache Management
```javascript
// From main thread
navigator.serviceWorker.controller?.postMessage({
  type: 'CACHE_ASSETS',
  assets: ['./new-asset.png', './new-level.json']
});

// Clear all caches
navigator.serviceWorker.controller?.postMessage({
  type: 'CLEAR_CACHE'
});
```

## Customization

### Theme Colors
Edit `manifest.json` and `index.html` meta tags:
```json
{
  "theme_color": "#0a0a0f",
  "background_color": "#0a0a0f"
}
```

### Game Resolution
Change in `game.js`:
```javascript
this.gameWidth = 1280;
this.gameHeight = 720;
```

### Joystick Settings
Change in `touch-controls.js`:
```javascript
this.maxDistance = 45;  // Max stick travel
this.deadzone = 0.15;   // Minimum input
```

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+ (iOS 13.4+)
- Samsung Internet 12+

### iOS Limitations
- Fullscreen API not supported (uses standalone mode instead)
- Wake Lock API not supported (uses fallback)
- Orientation lock requires installed PWA

## License

MIT License - Modify and distribute freely.

## Credits

Built for Abyss Walker - An immersive dungeon adventure game.