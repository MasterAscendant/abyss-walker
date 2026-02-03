# Abyss Walker - Design System

## Overview
A dark, immersive mobile RPG with a gothic-fantasy aesthetic. The UI emphasizes atmosphere, readability, and tactile feedback optimized for touch devices.

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Abyss Black | `#0a0a0f` | Backgrounds, deep shadows |
| Void Purple | `#1a0a2e` | Primary dark surfaces |
| Soul Blue | `#4a90d9` | Primary accent, health bars |
| Ember Orange | `#ff6b35` | Danger, damage, critical actions |
| Spirit Cyan | `#00d4aa` | Success, energy, positive feedback |

### Secondary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Mist Gray | `#8b8b9a` | Secondary text, borders |
| Shadow Gray | `#2a2a3a` | Cards, panels, elevated surfaces |
| Blood Red | `#e63946` | Low health, enemy attacks |
| Gold Accent | `#ffd700` | Premium, rewards, legendary items |
| Ghost White | `#f0f0f5` | Primary text, highlights |

### Gradients
```css
/* Soul Flame Gradient */
--gradient-soul: linear-gradient(135deg, #4a90d9 0%, #00d4aa 100%);

/* Void Gradient */
--gradient-void: linear-gradient(180deg, #1a0a2e 0%, #0a0a0f 100%);

/* Ember Gradient */
--gradient-ember: linear-gradient(135deg, #ff6b35 0%, #e63946 100%);

/* Mystic Glow */
--gradient-mystic: radial-gradient(circle, rgba(74,144,217,0.3) 0%, transparent 70%);
```

---

## Typography

### Font Stack
```css
--font-display: 'Cinzel', 'Trajan Pro', serif;
--font-body: 'Inter', 'Roboto', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 48px / 3rem | 700 | Game title, victory headers |
| H2 | 32px / 2rem | 600 | Section headers |
| H3 | 24px / 1.5rem | 600 | Card titles, menu items |
| H4 | 18px / 1.125rem | 500 | Subsection headers |
| Body | 16px / 1rem | 400 | General text |
| Small | 14px / 0.875rem | 400 | Secondary text, labels |
| Tiny | 12px / 0.75rem | 500 | Stats, numbers, badges |

### Text Styles
```css
/* Glowing Text Effect */
.text-glow {
  text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
}

/* Embossed Text */
.text-emboss {
  text-shadow: 0 1px 2px rgba(255,255,255,0.1), 0 -1px 2px rgba(0,0,0,0.5);
}

/* Outline Text */
.text-outline {
  -webkit-text-stroke: 1px currentColor;
  text-shadow: 0 0 8px currentColor;
}
```

---

## Spacing System

### Base Unit: 4px
| Token | Value |
|-------|-------|
| --space-xs | 4px |
| --space-sm | 8px |
| --space-md | 16px |
| --space-lg | 24px |
| --space-xl | 32px |
| --space-2xl | 48px |
| --space-3xl | 64px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | Small buttons, tags |
| --radius-md | 8px | Cards, inputs |
| --radius-lg | 12px | Panels, modals |
| --radius-xl | 16px | Large cards |
| --radius-full | 9999px | Circular buttons, avatars |

---

## Shadows & Elevation

```css
/* Glow Effects */
--glow-soul: 0 0 20px rgba(74, 144, 217, 0.5), 0 0 40px rgba(74, 144, 217, 0.3);
--glow-ember: 0 0 20px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 107, 53, 0.3);
--glow-spirit: 0 0 20px rgba(0, 212, 170, 0.5), 0 0 40px rgba(0, 212, 170, 0.3);

/* Elevated Surfaces */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);
```

---

## Animations

### Timing Functions
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-expo: cubic-bezier(0.7, 0, 0.84, 0);
--ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```

### Duration Scale
| Token | Value | Usage |
|-------|-------|-------|
| --duration-fast | 150ms | Micro-interactions, hovers |
| --duration-normal | 250ms | Standard transitions |
| --duration-slow | 400ms | Page transitions, modals |
| --duration-dramatic | 800ms | Victory, game over screens |

### Key Animations

#### Button Pulse
```css
@keyframes button-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 144, 217, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(74, 144, 217, 0); }
}
```

#### Float Animation
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

#### Shake (Damage)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
```

#### Pulse Glow
```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; filter: blur(20px); }
  50% { opacity: 1; filter: blur(30px); }
}
```

#### Slide In Up
```css
@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Fade In Scale
```css
@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## Components

### Buttons

#### Primary Button
- Background: `var(--gradient-soul)`
- Text: White, 600 weight
- Padding: 16px 32px
- Border-radius: 12px
- Hover: Scale 1.02, increased glow
- Active: Scale 0.98

#### Secondary Button
- Background: transparent
- Border: 2px solid `var(--soul-blue)`
- Text: `var(--soul-blue)`
- Hover: Background `rgba(74,144,217,0.1)`

#### Danger Button
- Background: `var(--gradient-ember)`
- Used for: Exit, delete, destructive actions

### Cards

#### Panel Card
```css
.panel-card {
  background: linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

#### Glass Card (HUD elements)
```css
.glass-card {
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
```

### Progress Bars

#### Health Bar
- Background: `rgba(230, 57, 70, 0.2)`
- Fill: Gradient from `#e63946` to `#ff6b35`
- Height: 12px
- Border-radius: 6px
- Glow on low health (< 25%)

#### Energy/Mana Bar
- Background: `rgba(0, 212, 170, 0.2)`
- Fill: Gradient from `#00d4aa` to `#4a90d9`
- Same dimensions as health

#### Experience Bar
- Background: `rgba(255, 215, 0, 0.2)`
- Fill: `var(--gold-accent)`
- Thinner: 6px height

---

## Touch Targets

### Minimum Sizes
- **Buttons**: 56px × 56px (44px minimum for secondary)
- **Joystick**: 120px diameter base, 48px stick
- **Spacing between controls**: 16px minimum

### Feedback
- **Visual**: Scale down 0.95 on press, ripple effect
- **Haptic**: Light impact on button press
- **Audio**: Subtle click sound

---

## Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile S | 320px | Compact HUD, smaller text |
| Mobile M | 375px | Standard mobile layout |
| Mobile L | 425px | Larger touch targets |
| Tablet | 768px | Side-by-side menus |
| Desktop | 1024px | Full layout with margins |

---

## Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Background | 0 | Game world |
| Particles | 10 | Effects below UI |
| HUD | 100 | In-game interface |
| Controls | 200 | Touch controls |
| Modals | 300 | Pause, settings |
| Overlays | 400 | Screen effects, transitions |
| Notifications | 500 | Toasts, alerts |
| Loading | 1000 | Loading screens |

---

## Iconography

### Icon Style
- Outlined style with 2px stroke
- Consistent 24px default size
- Soul blue color, white on dark backgrounds

### Key Icons
- ⚔️ Attack / Combat
- 🛡️ Defense / Shield
- ⚡ Special / Ultimate
- 🏃 Dash / Movement
- ❤️ Health / Heal
- ✨ Magic / Mana
- 🎒 Inventory
- ⚙️ Settings
- 🔊 Audio / Sound

---

## Accessibility

### Contrast
- Minimum 4.5:1 for body text
- Minimum 3:1 for large text/UI components

### Touch
- All interactive elements ≥ 44px
- 8px minimum spacing between touch targets

### Motion
- Respect `prefers-reduced-motion`
- Provide static alternatives for animated content

---

## Brand Voice

### Tone
- Epic and atmospheric
- Concise, punchy text
- Mysterious undertones
- Empowering the player

### Examples
- "Enter the Abyss" (not "Start Game")
- "Your soul awaits" (not "Continue")
- "Victory is yours" (not "You Win")
- "Fallen, but not forgotten" (not "Game Over")
