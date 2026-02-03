/**
 * Abyss Walker - Particle Effects System
 * High-performance particle engine for visual effects
 */

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.emitters = [];
        this.maxParticles = 1000;
        this.isRunning = false;
        this.lastTime = 0;
        
        // Resize canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
    }

    /* ============================================
       PARTICLE TYPES
       ============================================ */
    
    static TYPES = {
        BLOOD: 'blood',
        SPARK: 'spark',
        MAGIC: 'magic',
        DUST: 'dust',
        SOUL: 'soul',
        EMBER: 'ember',
        SHOCKWAVE: 'shockwave',
        TRAIL: 'trail'
    };

    /* ============================================
       EMISSION
       ============================================ */
    
    emit(config) {
        const {
            x,
            y,
            type = ParticleSystem.TYPES.SPARK,
            count = 10,
            spread = Math.PI * 2,
            speed = { min: 50, max: 150 },
            size = { min: 2, max: 6 },
            lifetime = { min: 0.5, max: 1.5 },
            color = '#ffffff',
            gravity = 0,
            drag = 0.98
        } = config;

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            
            const angle = (Math.random() * spread) - (spread / 2);
            const velocity = Math.random() * (speed.max - speed.min) + speed.min;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: Math.random() * (size.max - size.min) + size.min,
                initialSize: Math.random() * (size.max - size.min) + size.min,
                lifetime: Math.random() * (lifetime.max - lifetime.min) + lifetime.min,
                age: 0,
                color: this.parseColor(color),
                type,
                gravity,
                drag,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 4
            });
        }
    }

    emitBurst(x, y, type = 'spark', intensity = 1) {
        const configs = {
            [ParticleSystem.TYPES.BLOOD]: {
                count: 15 * intensity,
                color: ['#e63946', '#ff6b35', '#8b0000'],
                speed: { min: 100, max: 300 },
                size: { min: 2, max: 8 },
                gravity: 500,
                lifetime: { min: 0.3, max: 0.8 }
            },
            [ParticleSystem.TYPES.SPARK]: {
                count: 20 * intensity,
                color: ['#ffd700', '#ffaa00', '#ffffff'],
                speed: { min: 150, max: 400 },
                size: { min: 1, max: 4 },
                gravity: 200,
                lifetime: { min: 0.2, max: 0.6 }
            },
            [ParticleSystem.TYPES.MAGIC]: {
                count: 25 * intensity,
                color: ['#4a90d9', '#00d4aa', '#a855f7'],
                speed: { min: 50, max: 200 },
                size: { min: 3, max: 10 },
                gravity: -50,
                lifetime: { min: 0.8, max: 1.5 }
            },
            [ParticleSystem.TYPES.SOUL]: {
                count: 10 * intensity,
                color: ['#00d4aa', '#4a90d9'],
                speed: { min: 30, max: 80 },
                size: { min: 4, max: 12 },
                gravity: -100,
                lifetime: { min: 1, max: 2 }
            },
            [ParticleSystem.TYPES.EMBER]: {
                count: 30 * intensity,
                color: ['#ff6b35', '#e63946', '#ffaa00'],
                speed: { min: 20, max: 100 },
                size: { min: 1, max: 3 },
                gravity: -30,
                lifetime: { min: 1.5, max: 3 }
            },
            [ParticleSystem.TYPES.DUST]: {
                count: 20 * intensity,
                color: ['#8b8b9a', '#666666'],
                speed: { min: 30, max: 100 },
                size: { min: 2, max: 6 },
                gravity: 50,
                lifetime: { min: 0.5, max: 1.2 }
            }
        };

        const config = configs[type] || configs[ParticleSystem.TYPES.SPARK];
        
        // Handle array of colors
        const color = Array.isArray(config.color) 
            ? config.color[Math.floor(Math.random() * config.color.length)]
            : config.color;
        
        this.emit({
            x,
            y,
            type,
            ...config,
            color
        });
    }

    /* ============================================
       CONTINUOUS EMITTERS
       ============================================ */
    
    createEmitter(config) {
        const emitter = {
            id: Math.random().toString(36).substr(2, 9),
            x: config.x,
            y: config.y,
            type: config.type || ParticleSystem.TYPES.EMBER,
            rate: config.rate || 10, // particles per second
            config: config.particleConfig || {},
            elapsed: 0,
            active: true
        };
        
        this.emitters.push(emitter);
        return emitter.id;
    }

    removeEmitter(id) {
        this.emitters = this.emitters.filter(e => e.id !== id);
    }

    updateEmitter(id, updates) {
        const emitter = this.emitters.find(e => e.id === id);
        if (emitter) {
            Object.assign(emitter, updates);
        }
    }

    /* ============================================
       UPDATE & RENDER
       ============================================ */
    
    update(deltaTime) {
        const dt = Math.min(deltaTime, 0.1); // Cap at 100ms to prevent spiral
        
        // Update emitters
        this.emitters.forEach(emitter => {
            if (!emitter.active) return;
            
            emitter.elapsed += dt;
            const particlesToEmit = Math.floor(emitter.elapsed * emitter.rate);
            
            if (particlesToEmit > 0) {
                emitter.elapsed -= particlesToEmit / emitter.rate;
                
                this.emit({
                    x: emitter.x,
                    y: emitter.y,
                    type: emitter.type,
                    count: particlesToEmit,
                    ...emitter.config
                });
            }
        });
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.age += dt;
            
            if (p.age >= p.lifetime) return false;
            
            // Physics
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.vy += p.gravity * dt;
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            p.rotation += p.rotationSpeed * dt;
            
            return true;
        });
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Enable additive blending for glow effect
        this.ctx.globalCompositeOperation = 'lighter';
        
        this.particles.forEach(p => {
            const progress = p.age / p.lifetime;
            const alpha = 1 - this.easeOutCubic(progress);
            const size = p.initialSize * (1 - progress * 0.5);
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = alpha;
            
            switch (p.type) {
                case ParticleSystem.TYPES.BLOOD:
                    this.renderBlood(p, size);
                    break;
                case ParticleSystem.TYPES.MAGIC:
                    this.renderMagic(p, size);
                    break;
                case ParticleSystem.TYPES.SOUL:
                    this.renderSoul(p, size, alpha);
                    break;
                case ParticleSystem.TYPES.SPARK:
                    this.renderSpark(p, size);
                    break;
                case ParticleSystem.TYPES.EMBER:
                    this.renderEmber(p, size, alpha);
                    break;
                default:
                    this.renderDefault(p, size);
            }
            
            this.ctx.restore();
        });
        
        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }

    /* ============================================
       RENDERERS
       ============================================ */
    
    renderDefault(p, size) {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderBlood(p, size) {
        // Irregular blood splat shape
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        
        const points = 6;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = size * (0.5 + Math.random() * 0.5);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    renderMagic(p, size) {
        // Glowing orb with ring
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, this.adjustAlpha(p.color, 0.5));
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Outer ring
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    renderSoul(p, size, alpha) {
        // Wisp-like soul particle
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
        gradient.addColorStop(0, `rgba(0, 212, 170, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(74, 144, 217, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Core
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderSpark(p, size) {
        // Streaky spark
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = size * 0.5;
        this.ctx.lineCap = 'round';
        
        const length = size * 3;
        const vx = p.vx * 0.05;
        const vy = p.vy * 0.05;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-vx - length/2, -vy - length/2);
        this.ctx.lineTo(vx + length/2, vy + length/2);
        this.ctx.stroke();
        
        // Core glow
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderEmber(p, size, alpha) {
        // Flickering ember
        const flicker = 0.7 + Math.random() * 0.3;
        const actualAlpha = alpha * flicker;
        
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        gradient.addColorStop(0, `rgba(255, 107, 53, ${actualAlpha})`);
        gradient.addColorStop(0.5, `rgba(230, 57, 70, ${actualAlpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /* ============================================
       SPECIAL EFFECTS
       ============================================ */
    
    createShockwave(x, y, color = '#4a90d9', maxRadius = 100) {
        const shockwave = {
            x, y,
            radius: 0,
            maxRadius,
            color,
            alpha: 1,
            speed: 300
        };
        
        // Add to a separate shockwave list if you want to track them
        this.shockwaves = this.shockwaves || [];
        this.shockwaves.push(shockwave);
        
        return shockwave;
    }

    createSlashEffect(x, y, angle, color = '#ffffff') {
        // Emit particles in an arc
        const arcWidth = Math.PI / 3;
        const count = 15;
        
        for (let i = 0; i < count; i++) {
            const particleAngle = angle - arcWidth/2 + (arcWidth * i / count);
            const speed = 200 + Math.random() * 100;
            
            this.particles.push({
                x: x + Math.cos(particleAngle) * 20,
                y: y + Math.sin(particleAngle) * 20,
                vx: Math.cos(particleAngle) * speed,
                vy: Math.sin(particleAngle) * speed,
                size: 3 + Math.random() * 4,
                initialSize: 3 + Math.random() * 4,
                lifetime: 0.3 + Math.random() * 0.2,
                age: 0,
                color: this.parseColor(color),
                type: ParticleSystem.TYPES.SPARK,
                gravity: 0,
                drag: 0.95,
                rotation: particleAngle,
                rotationSpeed: 0
            });
        }
    }

    createImpactEffect(x, y, intensity = 1) {
        // Combined effect for impacts
        this.emitBurst(x, y, ParticleSystem.TYPES.SPARK, intensity);
        this.emitBurst(x, y, ParticleSystem.TYPES.DUST, intensity * 0.5);
        
        if (intensity > 1) {
            this.createShockwave(x, y, '#ff6b35', 80 * intensity);
        }
    }

    createLevelUpEffect(x, y) {
        // Celebration effect
        this.emitBurst(x, y, ParticleSystem.TYPES.MAGIC, 3);
        this.emitBurst(x, y, ParticleSystem.TYPES.SOUL, 2);
        
        // Ring of light
        this.createShockwave(x, y, '#ffd700', 150);
    }

    /* ============================================
       LOOP
       ============================================ */
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.isRunning = false;
    }

    loop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }

    /* ============================================
       UTILITY
       ============================================ */
    
    parseColor(color) {
        // Handle hex colors
        if (typeof color === 'string' && color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }

    adjustAlpha(color, alpha) {
        // Convert rgb to rgba
        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
        }
        return color;
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    clear() {
        this.particles = [];
        this.emitters = [];
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

/* ============================================
   SCREEN SHAKE EFFECT
   ============================================ */

class ScreenShake {
    constructor(element) {
        this.element = element;
        this.intensity = 0;
        this.decay = 5;
        this.isShaking = false;
    }

    shake(intensity = 1, duration = 0.5) {
        this.intensity = intensity * 10;
        this.decay = intensity * 10 / duration;
        
        if (!this.isShaking) {
            this.isShaking = true;
            this.loop();
        }
    }

    loop() {
        if (this.intensity <= 0.1) {
            this.element.style.transform = 'translate(0, 0)';
            this.isShaking = false;
            return;
        }
        
        const x = (Math.random() - 0.5) * this.intensity;
        const y = (Math.random() - 0.5) * this.intensity;
        
        this.element.style.transform = `translate(${x}px, ${y}px)`;
        this.intensity -= this.decay * 0.016; // Approx 60fps
        
        requestAnimationFrame(() => this.loop());
    }
}

/* ============================================
   DAMAGE FLASH EFFECT
   ============================================ */

class DamageFlash {
    constructor(element) {
        this.element = element;
        this.isFlashing = false;
    }

    flash(duration = 300, color = 'rgba(230, 57, 70, 0.3)') {
        if (this.isFlashing) return;
        
        this.isFlashing = true;
        this.element.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
        this.element.style.opacity = '1';
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.element.style.opacity = '0';
                this.isFlashing = false;
                return;
            }
            
            this.element.style.opacity = String(1 - progress);
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
}

/* ============================================
   CAMERA FOLLOW
   ============================================ */

class Camera {
    constructor(options = {}) {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothness = options.smoothness || 0.1;
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;
        this.bounds = options.bounds || null;
        this.shake = { x: 0, y: 0, intensity: 0 };
    }

    follow(targetX, targetY) {
        this.targetX = targetX + this.offsetX;
        this.targetY = targetY + this.offsetY;
    }

    update() {
        // Smooth follow
        this.x += (this.targetX - this.x) * this.smoothness;
        this.y += (this.targetY - this.y) * this.smoothness;
        
        // Apply shake
        if (this.shake.intensity > 0) {
            this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.intensity *= 0.9;
            
            if (this.shake.intensity < 0.5) {
                this.shake.intensity = 0;
                this.shake.x = 0;
                this.shake.y = 0;
            }
        }
        
        // Apply bounds
        if (this.bounds) {
            this.x = Math.max(this.bounds.left, Math.min(this.x, this.bounds.right));
            this.y = Math.max(this.bounds.top, Math.min(this.y, this.bounds.bottom));
        }
    }

    getPosition() {
        return {
            x: this.x + this.shake.x,
            y: this.y + this.shake.y
        };
    }

    addShake(intensity) {
        this.shake.intensity = Math.max(this.shake.intensity, intensity);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleSystem, ScreenShake, DamageFlash, Camera };
}
