/**
 * Abyss Walker - Main Game Engine
 * Canvas-based game loop with delta time handling and RAF optimization
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.totalTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateInterval = 500; // Update FPS every 500ms
    this.lastFpsUpdate = 0;
    
    // Target frame rate (60fps)
    this.targetFps = 60;
    this.targetFrameTime = 1000 / this.targetFps;
    
    // Game dimensions (internal resolution)
    this.gameWidth = 1280;
    this.gameHeight = 720;
    
    // Camera
    this.camera = { x: 0, y: 0 };
    
    // Input state
    this.input = {
      keys: {},
      mouse: { x: 0, y: 0, down: false },
      touch: { active: false, x: 0, y: 0 },
      gamepad: { index: null, buttons: {} }
    };
    
    // Game entities
    this.player = null;
    this.entities = [];
    this.particles = [];

    // Enemy (zombie) spawning
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 2.0;
    
    // Background sync for high scores
    this.pendingSync = false;
    
    // Visibility state
    this.isVisible = true;
    
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupVisibilityHandling();
    this.createPlayer();
    this.resize();
    
    // Dispatch game ready event
    setTimeout(() => {
      window.dispatchEvent(new Event('game-ready'));
    }, 1500);
    
    // Start game loop
    this.start();
  }
  
  setupCanvas() {
    // Set internal resolution
    this.canvas.width = this.gameWidth;
    this.canvas.height = this.gameHeight;
    
    // Enable crisp pixel art rendering
    this.ctx.imageSmoothingEnabled = false;
  }
  
  setupEventListeners() {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      
      // Pause toggle
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });
    
    // Mouse input
    this.canvas.addEventListener('mousedown', (e) => {
      this.input.mouse.down = true;
      this.updateMousePosition(e);
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMousePosition(e);
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.input.mouse.down = false;
    });
    
    // Touch input (basic)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.input.touch.active = true;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.input.touch.x = (touch.clientX - rect.left) * (this.gameWidth / rect.width);
      this.input.touch.y = (touch.clientY - rect.top) * (this.gameHeight / rect.height);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.input.touch.x = (touch.clientX - rect.left) * (this.gameWidth / rect.width);
      this.input.touch.y = (touch.clientY - rect.top) * (this.gameHeight / rect.height);
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', () => {
      this.input.touch.active = false;
    });
    
    // Gamepad connect/disconnect
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[Gamepad] connected:', e.gamepad.id);
      this.input.gamepad.index = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.input.gamepad.index === e.gamepad.index) {
        this.input.gamepad.index = null;
        this.input.gamepad.buttons = {};
      }
    });

    // Window resize
    window.addEventListener('resize', () => this.resize());
  }
  
  updateMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.gameWidth / rect.width;
    const scaleY = this.gameHeight / rect.height;
    
    this.input.mouse.x = (e.clientX - rect.left) * scaleX;
    this.input.mouse.y = (e.clientY - rect.top) * scaleY;
  }
  
  setupVisibilityHandling() {
    // Handle tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isVisible = false;
        this.pause();
      } else {
        this.isVisible = true;
        this.resume();
      }
    });
    
    // Handle window blur/focus
    window.addEventListener('blur', () => {
      this.pause();
    });
    
    window.addEventListener('focus', () => {
      if (this.isVisible) {
        this.resume();
      }
    });
  }
  
  createPlayer() {
    this.player = {
      x: this.gameWidth / 2,
      y: this.gameHeight / 2,
      width: 32,
      height: 32,
      speed: 200,
      color: '#667eea',
      vx: 0,
      vy: 0,
      angle: 0,
      health: 100,
      maxHealth: 100
    };
  }
  
  resize() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Maintain aspect ratio
    const aspectRatio = this.gameWidth / this.gameHeight;
    const containerRatio = containerWidth / containerHeight;
    
    let displayWidth, displayHeight;
    
    if (containerRatio > aspectRatio) {
      displayHeight = containerHeight;
      displayWidth = displayHeight * aspectRatio;
    } else {
      displayWidth = containerWidth;
      displayHeight = displayWidth / aspectRatio;
    }
    
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  stop() {
    this.isRunning = false;
  }
  
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      console.log('[Game] Paused');
    }
  }
  
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now(); // Reset to prevent large delta
      console.log('[Game] Resumed');
    }
  }
  
  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    // Request next frame immediately for smooth animation
    requestAnimationFrame((time) => this.gameLoop(time));
    
    // Calculate delta time in seconds
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    
    // Cap delta time to prevent huge jumps after tab switch
    const maxDeltaTime = 0.1; // 100ms max
    if (this.deltaTime > maxDeltaTime) {
      this.deltaTime = maxDeltaTime;
    }
    
    this.lastTime = currentTime;
    this.totalTime += this.deltaTime;
    this.frameCount++;
    
    // Update FPS counter
    if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
    
    // Only update and render if not paused
    if (!this.isPaused) {
      this.update(this.deltaTime);
      this.render();
    } else {
      // Still render but don't update (shows pause screen)
      this.renderPauseScreen();
    }
  }
  
  update(dt) {
    // Update player
    this.updatePlayer(dt);
    
    // Update entities
    this.entities.forEach(entity => {
      if (entity.update) entity.update(dt);
    });
    
    // Update particles
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return p.life > 0;
    });
    
    // Update camera to follow player
    this.updateCamera();
  }
  
  updatePlayer(dt) {
    const p = this.player;
    let dx = 0;
    let dy = 0;

    // Poll gamepad first (if any)
    const gp = this.pollGamepad();
    if (gp) {
      const deadzone = 0.18;
      const ax = gp.axes?.[0] ?? 0;
      const ay = gp.axes?.[1] ?? 0;
      dx = Math.abs(ax) > deadzone ? ax : 0;
      dy = Math.abs(ay) > deadzone ? ay : 0;

      // D-pad as fallback/override
      if (gp.buttons?.[14]?.pressed) dx = -1; // left
      if (gp.buttons?.[15]?.pressed) dx = 1;  // right
      if (gp.buttons?.[12]?.pressed) dy = -1; // up
      if (gp.buttons?.[13]?.pressed) dy = 1;  // down

      // Actions
      if (this.wasButtonPressed(gp, 0)) this.attack(); // A
      if (this.wasButtonPressed(gp, 1)) this.defend(); // B
    } else {
      // Keyboard movement
      if (this.input.keys['KeyW'] || this.input.keys['ArrowUp']) dy -= 1;
      if (this.input.keys['KeyS'] || this.input.keys['ArrowDown']) dy += 1;
      if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft']) dx -= 1;
      if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) dx += 1;

      // Virtual joystick input (if available)
      if (window.touchControls) {
        const joystick = window.touchControls.getJoystick();
        if (joystick.active) {
          dx = joystick.x;
          dy = joystick.y;
        }
      }
    }
    
    // Normalize diagonal movement
    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 1) {
        dx /= length;
        dy /= length;
      }
    }
    
    // Apply movement
    p.vx = dx * p.speed;
    p.vy = dy * p.speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    
    // Keep player in bounds
    p.x = Math.max(p.width/2, Math.min(this.gameWidth - p.width/2, p.x));
    p.y = Math.max(p.height/2, Math.min(this.gameHeight - p.height/2, p.y));
    
    // Calculate angle toward mouse/touch
    let targetX, targetY;
    if (this.input.touch.active) {
      targetX = this.input.touch.x;
      targetY = this.input.touch.y;
    } else {
      targetX = this.input.mouse.x;
      targetY = this.input.mouse.y;
    }
    
    p.angle = Math.atan2(targetY - p.y, targetX - p.x);
    
    // Spawn trail particles when moving
    if (dx !== 0 || dy !== 0) {
      if (Math.random() < 0.3) {
        this.spawnParticle(p.x, p.y, '#667eea', 0.5);
      }
    }
  }
  
  updateCamera() {
    // Smooth camera follow
    const targetX = this.player.x - this.gameWidth / 2;
    const targetY = this.player.y - this.gameHeight / 2;
    
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
    
    // Clamp camera to world bounds
    this.camera.x = Math.max(0, Math.min(this.gameWidth - this.gameWidth, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.gameHeight - this.gameHeight, this.camera.y));
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;

    if (this.input.gamepad.index !== null) {
      gp = pads[this.input.gamepad.index];
    }
    if (!gp) {
      gp = pads.find(p => p && p.connected) || null;
      if (gp) this.input.gamepad.index = gp.index;
    }
    return gp;
  }

  wasButtonPressed(gp, index) {
    const prev = this.input.gamepad.buttons[index] || false;
    const cur = !!gp.buttons?.[index]?.pressed;
    this.input.gamepad.buttons[index] = cur;
    return cur && !prev;
  }
  
  spawnParticle(x, y, color, life = 1) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
      color: color,
      life: life,
      maxLife: life,
      size: Math.random() * 4 + 2
    });
  }
  
  render() {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    
    // Save context for camera transform
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw grid background
    this.renderGrid(ctx);
    
    // Draw particles
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // Draw entities
    this.entities.forEach(entity => {
      if (entity.render) entity.render(ctx);
    });
    
    // Draw player
    this.renderPlayer(ctx);
    
    // Restore context
    ctx.restore();
    
    // Draw UI (not affected by camera)
    this.renderUI(ctx);
  }
  
  renderGrid(ctx) {
    const gridSize = 64;
    const offsetX = -this.camera.x % gridSize;
    const offsetY = -this.camera.y % gridSize;
    
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = offsetX; x < this.gameWidth + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + this.camera.x, this.camera.y);
      ctx.lineTo(x + this.camera.x, this.camera.y + this.gameHeight);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = offsetY; y < this.gameHeight + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(this.camera.x, y + this.camera.y);
      ctx.lineTo(this.camera.x + this.gameWidth, y + this.camera.y);
      ctx.stroke();
    }
  }
  
  spawnZombie() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = -40; y = Math.random() * this.gameHeight; break;
      case 1: x = this.gameWidth + 40; y = Math.random() * this.gameHeight; break;
      case 2: x = Math.random() * this.gameWidth; y = -40; break;
      default: x = Math.random() * this.gameWidth; y = this.gameHeight + 40; break;
    }

    const zombie = {
      type: 'zombie',
      x, y,
      speed: 90 + Math.random() * 40,
      update: (dt) => {
        const dx = this.player.x - zombie.x;
        const dy = this.player.y - zombie.y;
        const len = Math.hypot(dx, dy) || 1;
        zombie.x += (dx / len) * zombie.speed * dt;
        zombie.y += (dy / len) * zombie.speed * dt;
      },
      render: (ctx) => {
        ctx.save();
        ctx.translate(zombie.x, zombie.y);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-10, -14, 20, 6);
        ctx.restore();
      }
    };

    this.entities.push(zombie);
  }

  renderPlayer(ctx) {
    const p = this.player;
    
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    
    // Glow effect
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-p.width, -p.height, p.width * 2, p.height * 2);
    
    // Player body
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
    
    // Direction indicator
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, -4, p.width/2, 8);
    
    ctx.restore();
  }
  
  renderUI(ctx) {
    // Health bar
    const barWidth = 200;
    const barHeight = 16;
    const barX = 20;
    const barY = 20;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthPercent = this.player.health / this.player.maxHealth;
    const healthColor = healthPercent > 0.6 ? '#4ade80' : healthPercent > 0.3 ? '#fbbf24' : '#ef4444';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Health text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(this.player.health)}/${this.player.maxHealth}`, barX + barWidth/2, barY + 12);
    
    // FPS counter
    ctx.textAlign = 'right';
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`${this.fps} FPS`, this.gameWidth - 20, 30);
    
    // Controls hint
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px sans-serif';
    ctx.fillText('WASD/Arrows: Move | Mouse: Aim | ESC: Pause', 20, this.gameHeight - 20);
  }
  
  renderPauseScreen() {
    // Draw the last frame dimmed
    this.render();
    
    const ctx = this.ctx;
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    
    // Pause text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.gameWidth / 2, this.gameHeight / 2 - 30);
    
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Press ESC or P to resume', this.gameWidth / 2, this.gameHeight / 2 + 30);
  }
  
  // High score management with background sync
  async saveHighScore(score) {
    const highScore = {
      score: score,
      date: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    // Save locally
    const scores = JSON.parse(localStorage.getItem('abyssHighScores') || '[]');
    scores.push(highScore);
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // Keep top 10
    localStorage.setItem('abyssHighScores', JSON.stringify(scores));
    
    // Queue for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-high-scores');
        console.log('[Game] High score queued for sync');
      } catch (err) {
        console.error('[Game] Failed to queue sync:', err);
      }
    }
  }
  
  getHighScores() {
    return JSON.parse(localStorage.getItem('abyssHighScores') || '[]');
  }
  
  // Action methods for touch controls
  attack() {
    console.log('[Game] Attack!');
    // Spawn attack particles
    for (let i = 0; i < 8; i++) {
      const angle = this.player.angle + (Math.random() - 0.5) * 0.5;
      const dist = 40;
      this.spawnParticle(
        this.player.x + Math.cos(angle) * dist,
        this.player.y + Math.sin(angle) * dist,
        '#f093fb',
        0.3
      );
    }
  }
  
  defend() {
    console.log('[Game] Defend!');
    // Spawn shield effect
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 30;
      this.spawnParticle(
        this.player.x + Math.cos(angle) * dist,
        this.player.y + Math.sin(angle) * dist,
        '#4ade80',
        0.5
      );
    }
  }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  
  // Expose game instance for debugging
  window.abyssGame = game;
});

// Handle game actions from touch controls
window.gameAction = function(action) {
  if (!game) return;
  
  switch(action) {
    case 'attack':
      game.attack();
      break;
    case 'defend':
    case 'action':
      game.defend();
      break;
  }
};