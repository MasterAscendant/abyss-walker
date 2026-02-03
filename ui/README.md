# Abyss Walker - Game UI/UX System

A comprehensive, dark-themed mobile game UI system with AAA-quality polish.

## 📁 Project Structure

```
game/
├── ui/
│   ├── index.html          # Main UI prototype with all screens
│   ├── styles.css          # Complete styling with design tokens
│   └── ui-controller.js    # UI logic and screen management
├── effects/
│   └── particles.js        # Particle system, screen shake, camera
├── audio/
│   └── audio-manager.js    # Web Audio API sound system
└── design/
    └── design-system.md    # Colors, typography, animations guide
```

## 🎮 Features

### Screens
- **Main Menu** - Animated title, slick buttons with glow effects
- **Game HUD** - Health/mana bars, score, minimap, combo counter
- **Pause Menu** - Run stats, resume/restart options
- **Settings** - Audio, video, controls, gameplay tabs
- **Game Over** - Death stats, rewards, retry
- **Victory** - Rank display, celebration particles

### Touch Controls
- **Virtual Joystick** - Smooth analog movement with 360° control
- **Action Buttons** - Attack, Jump, Special with cooldowns
- **Quick Items** - 3-slot consumable bar
- **Haptic Feedback** - Vibration on button press (if supported)

### Visual Effects
- Particle system with 6 types: Blood, Spark, Magic, Soul, Ember, Dust
- Screen shake on impact
- Damage flash overlay
- Fog and atmospheric effects
- Button press animations

### Audio System
- Web Audio API based
- Master/Music/SFX volume controls
- Procedural sound generation
- Spatial audio support
- Crossfade music transitions

## 🚀 Quick Start

1. Open `game/ui/index.html` in a browser
2. Click "Enter the Abyss" to see the game HUD
3. Use on-screen controls or keyboard:
   - Space: Attack
   - ESC/P: Pause

## 🎨 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --soul-blue: #4a90d9;      /* Primary accent */
    --ember-orange: #ff6b35;   /* Danger/damage */
    --spirit-cyan: #00d4aa;    /* Success/energy */
}
```

### Fonts
Defaults use Google Fonts:
- Display: Cinzel (titles, headers)
- Body: Inter (UI text)

### Particle Effects
```javascript
// Create particle burst
particleSystem.emitBurst(x, y, ParticleSystem.TYPES.MAGIC, 2);

// Continuous emitter
const emitter = particleSystem.createEmitter({
    x: 100, y: 100,
    type: ParticleSystem.TYPES.EMBER,
    rate: 10
});
```

## 📱 Mobile Optimization

- Touch targets minimum 44px
- Responsive layout adapts to screen size
- Viewport locked to prevent zoom
- Optimized for 60fps performance

## 🎯 Performance Tips

- Particle system caps at 1000 particles
- Use `will-change` sparingly on animated elements
- Audio uses object pooling for repeated sounds
- Reduced motion support for accessibility

## 🔧 Browser Support

- Chrome/Edge 80+
- Safari 14+
- Firefox 75+
- iOS Safari 14+
- Chrome Android 80+

## 📝 License

MIT - Free for commercial and personal use.
