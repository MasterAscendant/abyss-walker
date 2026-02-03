/**
 * Abyss Walker - Fullscreen API
 * Handles fullscreen toggling and display mode changes
 */

class FullscreenManager {
  constructor() {
    this.isFullscreen = false;
    this.isStandalone = false;
    
    this.init();
  }
  
  init() {
    this.detectDisplayMode();
    this.setupEventListeners();
    this.setupFullscreenButton();
    
    // Request fullscreen on first interaction for immersive experience
    this.setupAutoFullscreen();
    
    console.log('[Fullscreen] Initialized, standalone:', this.isStandalone);
  }
  
  detectDisplayMode() {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      this.isStandalone = true;
      document.body.classList.add('standalone-mode');
    }
    
    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.isStandalone = e.matches;
      if (e.matches) {
        document.body.classList.add('standalone-mode');
      } else {
        document.body.classList.remove('standalone-mode');
      }
    });
  }
  
  setupEventListeners() {
    // Track fullscreen state
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.updateFullscreenButton();
      
      if (this.isFullscreen) {
        document.body.classList.add('fullscreen-mode');
        console.log('[Fullscreen] Entered fullscreen');
      } else {
        document.body.classList.remove('fullscreen-mode');
        console.log('[Fullscreen] Exited fullscreen');
      }
    });
    
    // Handle webkit fullscreen (iOS Safari)
    document.addEventListener('webkitfullscreenchange', () => {
      this.isFullscreen = !!document.webkitFullscreenElement;
      this.updateFullscreenButton();
    });
    
    // Handle orientation changes
    screen.orientation?.addEventListener('change', (e) => {
      console.log('[Fullscreen] Orientation changed:', e.target.type);
      
      // On mobile, try to maintain fullscreen after rotation
      if (this.isMobile() && this.isFullscreen) {
        setTimeout(() => this.resizeCanvas(), 100);
      }
    });
  }
  
  setupFullscreenButton() {
    const btn = document.getElementById('fullscreen-btn');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
      this.toggle();
    });
    
    // Update button icon initially
    this.updateFullscreenButton();
  }
  
  setupAutoFullscreen() {
    // Auto-enter fullscreen on first interaction for mobile
    if (this.isMobile() && !this.isStandalone) {
      const enterFullscreen = () => {
        this.request();
        document.removeEventListener('touchstart', enterFullscreen);
        document.removeEventListener('click', enterFullscreen);
      };
      
      document.addEventListener('touchstart', enterFullscreen, { once: true });
      document.addEventListener('click', enterFullscreen, { once: true });
    }
  }
  
  async request() {
    const element = document.documentElement;
    
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      
      // Try to lock orientation to landscape
      this.lockOrientation();
      
    } catch (err) {
      console.error('[Fullscreen] Failed to enter fullscreen:', err);
    }
  }
  
  async exit() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.error('[Fullscreen] Failed to exit fullscreen:', err);
    }
  }
  
  async toggle() {
    if (this.isFullscreen) {
      await this.exit();
    } else {
      await this.request();
    }
  }
  
  async lockOrientation() {
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape');
        console.log('[Fullscreen] Orientation locked to landscape');
      }
    } catch (err) {
      // Orientation lock may not be supported or allowed
      console.log('[Fullscreen] Could not lock orientation:', err.message);
    }
  }
  
  async unlockOrientation() {
    try {
      if (screen.orientation?.unlock) {
        await screen.orientation.unlock();
      }
    } catch (err) {
      console.log('[Fullscreen] Could not unlock orientation:', err.message);
    }
  }
  
  updateFullscreenButton() {
    const btn = document.getElementById('fullscreen-btn');
    if (!btn) return;
    
    btn.innerHTML = this.isFullscreen ? '⛶' : '⛶';
    btn.title = this.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
    
    // Optional: Change icon based on state
    btn.style.opacity = this.isFullscreen ? '0.7' : '1';
  }
  
  resizeCanvas() {
    // Trigger resize event for game canvas
    window.dispatchEvent(new Event('resize'));
  }
  
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  // Check if we can use fullscreen API
  isSupported() {
    return !!(document.fullscreenEnabled || 
              document.webkitFullscreenEnabled || 
              document.msFullscreenEnabled);
  }
}

// Initialize fullscreen manager
document.addEventListener('DOMContentLoaded', () => {
  window.fullscreenManager = new FullscreenManager();
});