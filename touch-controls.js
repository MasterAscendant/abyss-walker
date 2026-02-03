/**
 * Abyss Walker - Touch Controls
 * Virtual joystick and action buttons for mobile gameplay
 */

class TouchControls {
  constructor() {
    this.joystick = {
      active: false,
      originX: 0,
      originY: 0,
      currentX: 0,
      currentY: 0,
      x: 0, // Normalized -1 to 1
      y: 0  // Normalized -1 to 1
    };
    
    this.maxDistance = 45; // Maximum joystick movement in pixels
    this.deadzone = 0.15;  // Minimum input to register
    
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    this.init();
  }
  
  init() {
    if (!this.isTouchDevice) {
      console.log('[TouchControls] Not a touch device, skipping touch controls');
      return;
    }
    
    this.setupJoystick();
    this.setupActionButtons();
    this.showTouchControls();
    
    console.log('[TouchControls] Initialized');
  }
  
  setupJoystick() {
    const joystickEl = document.getElementById('virtual-joystick');
    const stickEl = document.getElementById('joystick-stick');
    
    if (!joystickEl || !stickEl) return;
    
    let touchId = null;
    
    const handleStart = (e) => {
      e.preventDefault();
      
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      
      const rect = joystickEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      this.joystick.originX = centerX;
      this.joystick.originY = centerY;
      this.joystick.active = true;
      
      this.updateJoystick(touch.clientX, touch.clientY);
    };
    
    const handleMove = (e) => {
      if (!this.joystick.active || touchId === null) return;
      
      // Find our touch
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          e.preventDefault();
          this.updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    };
    
    const handleEnd = (e) => {
      // Check if our touch ended
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          e.preventDefault();
          this.resetJoystick();
          touchId = null;
          break;
        }
      }
    };
    
    joystickEl.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd, { passive: false });
    document.addEventListener('touchcancel', handleEnd, { passive: false });
  }
  
  updateJoystick(clientX, clientY) {
    const stickEl = document.getElementById('joystick-stick');
    
    // Calculate distance from origin
    let dx = clientX - this.joystick.originX;
    let dy = clientY - this.joystick.originY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Clamp to max distance
    if (distance > this.maxDistance) {
      const ratio = this.maxDistance / distance;
      dx *= ratio;
      dy *= ratio;
    }
    
    // Update visual position
    if (stickEl) {
      stickEl.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    
    // Normalize to -1 to 1
    this.joystick.x = dx / this.maxDistance;
    this.joystick.y = dy / this.maxDistance;
    
    // Apply deadzone
    if (Math.abs(this.joystick.x) < this.deadzone) this.joystick.x = 0;
    if (Math.abs(this.joystick.y) < this.deadzone) this.joystick.y = 0;
  }
  
  resetJoystick() {
    const stickEl = document.getElementById('joystick-stick');
    
    this.joystick.active = false;
    this.joystick.x = 0;
    this.joystick.y = 0;
    
    if (stickEl) {
      stickEl.style.transform = 'translate(0, 0)';
    }
  }
  
  setupActionButtons() {
    const attackBtn = document.getElementById('btn-attack');
    const actionBtn = document.getElementById('btn-action');
    
    // Attack button
    if (attackBtn) {
      attackBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        attackBtn.style.transform = 'scale(0.95)';
        attackBtn.style.background = 'rgba(240, 147, 251, 0.5)';
        if (window.gameAction) window.gameAction('attack');
      }, { passive: false });
      
      attackBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        attackBtn.style.transform = 'scale(1)';
        attackBtn.style.background = '';
      }, { passive: false });
    }
    
    // Action/Defend button
    if (actionBtn) {
      actionBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        actionBtn.style.transform = 'scale(0.95)';
        actionBtn.style.background = 'rgba(118, 75, 162, 0.5)';
        if (window.gameAction) window.gameAction('action');
      }, { passive: false });
      
      actionBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        actionBtn.style.transform = 'scale(1)';
        actionBtn.style.background = '';
      }, { passive: false });
    }
    
    // Also support click for testing on desktop
    if (attackBtn) {
      attackBtn.addEventListener('mousedown', () => {
        if (window.gameAction) window.gameAction('attack');
      });
    }
    
    if (actionBtn) {
      actionBtn.addEventListener('mousedown', () => {
        if (window.gameAction) window.gameAction('action');
      });
    }
  }
  
  showTouchControls() {
    const joystick = document.getElementById('virtual-joystick');
    const buttons = document.getElementById('action-buttons');
    
    if (joystick) joystick.classList.add('visible');
    if (buttons) buttons.classList.add('visible');
  }
  
  hideTouchControls() {
    const joystick = document.getElementById('virtual-joystick');
    const buttons = document.getElementById('action-buttons');
    
    if (joystick) joystick.classList.remove('visible');
    if (buttons) buttons.classList.remove('visible');
  }
  
  getJoystick() {
    return {
      active: this.joystick.active,
      x: this.joystick.x,
      y: this.joystick.y
    };
  }
  
  // Check if touch controls should be visible
  // (e.g., hide when using keyboard on hybrid devices)
  checkInputMethod() {
    let lastInputWasTouch = false;
    
    const touchHandler = () => {
      lastInputWasTouch = true;
      this.showTouchControls();
    };
    
    const keyHandler = () => {
      if (lastInputWasTouch) {
        // User switched to keyboard
        this.hideTouchControls();
      }
      lastInputWasTouch = false;
    };
    
    document.addEventListener('touchstart', touchHandler, { passive: true });
    document.addEventListener('keydown', keyHandler);
  }
}

// Initialize touch controls
document.addEventListener('DOMContentLoaded', () => {
  window.touchControls = new TouchControls();
});