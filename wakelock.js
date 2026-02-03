/**
 * Abyss Walker - Wake Lock
 * Prevents screen from sleeping during gameplay
 */

class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isActive = false;
    this.isSupported = 'wakeLock' in navigator;
    
    // Fallback for iOS (video trick)
    this.fallbackVideo = null;
    
    this.init();
  }
  
  init() {
    if (!this.isSupported) {
      console.log('[WakeLock] Screen Wake Lock API not supported, using fallback');
      this.setupFallback();
    } else {
      console.log('[WakeLock] Screen Wake Lock API available');
    }
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Request wake lock when game starts
    document.addEventListener('game-ready', () => {
      this.request();
    });
    
    // Re-acquire wake lock on visibility change (required by spec)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isActive) {
        this.request();
      }
    });
    
    // Handle game pause/resume
    window.addEventListener('game-pause', () => {
      this.release();
    });
    
    window.addEventListener('game-resume', () => {
      this.request();
    });
  }
  
  async request() {
    if (!this.isSupported) {
      this.enableFallback();
      return;
    }
    
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.isActive = true;
      
      console.log('[WakeLock] Screen wake lock acquired');
      
      // Listen for release
      this.wakeLock.addEventListener('release', () => {
        console.log('[WakeLock] Screen wake lock released');
        this.isActive = false;
        this.wakeLock = null;
      });
      
    } catch (err) {
      console.error('[WakeLock] Failed to acquire wake lock:', err);
      // Try fallback
      this.enableFallback();
    }
  }
  
  async release() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch (err) {
        console.error('[WakeLock] Failed to release wake lock:', err);
      }
      this.wakeLock = null;
    }
    
    this.disableFallback();
    this.isActive = false;
  }
  
  // Fallback for browsers without Wake Lock API (mainly iOS Safari)
  setupFallback() {
    // Create a hidden video element that plays silently
    // This prevents screen from sleeping on iOS
    this.fallbackVideo = document.createElement('video');
    this.fallbackVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAACKBtZGF0AAAC'; // Minimal valid MP4
    this.fallbackVideo.loop = true;
    this.fallbackVideo.muted = true;
    this.fallbackVideo.playsInline = true;
    this.fallbackVideo.setAttribute('playsinline', '');
    this.fallbackVideo.style.position = 'absolute';
    this.fallbackVideo.style.width = '1px';
    this.fallbackVideo.style.height = '1px';
    this.fallbackVideo.style.opacity = '0';
    this.fallbackVideo.style.pointerEvents = 'none';
    document.body.appendChild(this.fallbackVideo);
  }
  
  async enableFallback() {
    if (this.fallbackVideo) {
      try {
        await this.fallbackVideo.play();
        this.isActive = true;
        console.log('[WakeLock] Fallback enabled (video playing)');
      } catch (err) {
        console.error('[WakeLock] Fallback failed:', err);
      }
    }
  }
  
  disableFallback() {
    if (this.fallbackVideo) {
      this.fallbackVideo.pause();
      this.isActive = false;
      console.log('[WakeLock] Fallback disabled');
    }
  }
  
  // Alternative fallback using NoSleep.js approach
  // Play a tiny hidden video to keep screen awake
  enableNoSleepFallback() {
    // Create a more robust no-sleep video
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    
    const ctx = canvas.getContext('2d');
    
    // Draw something that changes to keep video encoder active
    function draw() {
      ctx.fillStyle = `hsl(${Date.now() % 360}, 50%, 50%)`;
      ctx.fillRect(0, 0, 10, 10);
      requestAnimationFrame(draw);
    }
    draw();
    
    // Create video stream from canvas
    const stream = canvas.captureStream();
    this.fallbackVideo = document.createElement('video');
    this.fallbackVideo.srcObject = stream;
    this.fallbackVideo.play();
    
    this.fallbackVideo.style.position = 'absolute';
    this.fallbackVideo.style.opacity = '0';
    this.fallbackVideo.style.pointerEvents = 'none';
    document.body.appendChild(this.fallbackVideo);
    
    this.isActive = true;
    console.log('[WakeLock] Canvas stream fallback enabled');
  }
  
  // iOS-specific wake lock using web audio
  enableAudioFallback() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      this.audioContext = new AudioContext();
      
      // Create silent oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start();
      
      console.log('[WakeLock] Audio fallback enabled');
    } catch (err) {
      console.error('[WakeLock] Audio fallback failed:', err);
    }
  }
  
  disableAudioFallback() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
  
  // Manual wake lock button for iOS (requires user interaction)
  createWakeLockButton() {
    const btn = document.createElement('button');
    btn.id = 'wakelock-btn';
    btn.innerHTML = '🔒';
    btn.title = 'Keep Screen Awake';
    btn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 70px;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 200;
      transition: all 0.2s;
    `;
    
    btn.addEventListener('click', () => {
      if (this.isActive) {
        this.release();
        btn.style.opacity = '0.5';
      } else {
        this.request();
        btn.style.opacity = '1';
      }
    });
    
    document.body.appendChild(btn);
  }
  
  // Check if wake lock is active
  get status() {
    return {
      active: this.isActive,
      supported: this.isSupported
    };
  }
}

// Initialize wake lock manager
document.addEventListener('DOMContentLoaded', () => {
  window.wakeLockManager = new WakeLockManager();
  
  // Add wake lock button on iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    window.wakeLockManager.createWakeLockButton();
  }
});