/**
 * Abyss Walker - UI Controller
 * Handles screen navigation, touch controls, and UI interactions
 */

class UIController {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            gameHUD: document.getElementById('gameHUD'),
            pauseMenu: document.getElementById('pauseMenu'),
            settingsPanel: document.getElementById('settingsPanel'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            victoryScreen: document.getElementById('victoryScreen'),
            loadingScreen: document.getElementById('loadingScreen')
        };
        
        this.isPaused = false;
        this.comboCount = 0;
        this.comboTimer = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initJoystick();
        this.initActionButtons();
        this.initSettings();
        this.showScreen('mainMenu');
    }

    /* ============================================
       SCREEN NAVIGATION
       ============================================ */
    
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        // Show target screen
        const target = this.screens[screenName];
        if (target) {
            target.classList.add('active');
            this.currentScreen = screenName;
        }
        
        // Handle special cases
        if (screenName === 'gameHUD') {
            document.getElementById('touchControls').style.display = 'flex';
        } else {
            const touchControls = document.getElementById('touchControls');
            if (touchControls) touchControls.style.display = 'none';
        }
    }

    showLoading(callback) {
        this.showScreen('loadingScreen');
        
        // Simulate loading progress
        let progress = 0;
        const fill = document.getElementById('loadingFill');
        const text = document.getElementById('loadingText');
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(callback, 300);
            }
            
            if (fill) fill.style.width = `${progress}%`;
            if (text) text.textContent = `${Math.floor(progress)}%`;
        }, 150);
    }

    /* ============================================
       EVENT BINDING
       ============================================ */
    
    bindEvents() {
        // Menu buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchSettingsTab(tab);
            });
        });

        // Volume sliders
        ['master', 'music', 'sfx'].forEach(type => {
            const slider = document.getElementById(`${type}Volume`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.updateVolume(type, e.target.value);
                });
            }
        });

        // Mute toggle
        const muteToggle = document.getElementById('muteToggle');
        if (muteToggle) {
            muteToggle.addEventListener('change', (e) => {
                this.toggleMute(e.target.checked);
            });
        }

        // Quick item slots
        document.querySelectorAll('.item-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotNum = e.currentTarget.dataset.slot;
                this.useItem(slotNum);
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    handleAction(action) {
        switch(action) {
            case 'play':
                this.showLoading(() => {
                    this.showScreen('gameHUD');
                    this.startGame();
                });
                break;
            case 'continue':
                this.showLoading(() => {
                    this.showScreen('gameHUD');
                    this.loadGame();
                });
                break;
            case 'settings':
                this.showScreen('settingsPanel');
                break;
            case 'credits':
                // Show achievements/credits
                console.log('Achievements screen');
                break;
            case 'resume':
                this.togglePause();
                break;
            case 'restart':
                this.showLoading(() => {
                    this.togglePause();
                    this.restartLevel();
                });
                break;
            case 'quit':
                this.showScreen('mainMenu');
                break;
            case 'retry':
                this.showLoading(() => {
                    this.showScreen('gameHUD');
                    this.restartLevel();
                });
                break;
            case 'next':
                this.showLoading(() => {
                    this.showScreen('gameHUD');
                    this.nextLevel();
                });
                break;
            case 'mainmenu':
                this.showScreen('mainMenu');
                break;
            case 'closeSettings':
                if (this.currentScreen === 'gameHUD' || this.isPaused) {
                    this.showScreen('pauseMenu');
                } else {
                    this.showScreen('mainMenu');
                }
                break;
        }
    }

    handleKeydown(e) {
        switch(e.key) {
            case 'Escape':
            case 'p':
            case 'P':
                if (this.currentScreen === 'gameHUD') {
                    this.togglePause();
                }
                break;
            case ' ':
                e.preventDefault();
                if (this.currentScreen === 'gameHUD') {
                    this.triggerAttack();
                }
                break;
        }
    }

    /* ============================================
       GAME STATE
       ============================================ */
    
    startGame() {
        console.log('Starting new game...');
        // Reset game state
        this.updateHealth(10000, 10000);
        this.updateMana(500, 500);
        this.updateScore(0);
        this.comboCount = 0;
    }

    loadGame() {
        console.log('Loading saved game...');
        // Load saved state
    }

    restartLevel() {
        console.log('Restarting level...');
        this.startGame();
    }

    nextLevel() {
        console.log('Loading next level...');
        this.startGame();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showScreen('pauseMenu');
        } else {
            this.showScreen('gameHUD');
        }
    }

    /* ============================================
       JOYSTICK
       ============================================ */
    
    initJoystick() {
        const joystick = document.getElementById('joystick');
        const stick = document.getElementById('joystickStick');
        
        if (!joystick || !stick) return;

        let isDragging = false;
        let centerX, centerY;
        const maxDistance = 36; // Max stick movement

        const handleStart = (e) => {
            isDragging = true;
            const rect = joystick.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
            joystick.classList.add('active');
            this.updateStick(e);
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            this.updateStick(e);
        };

        const handleEnd = () => {
            isDragging = false;
            joystick.classList.remove('active');
            stick.style.transform = 'translate(-50%, -50%)';
            
            // Stop movement
            this.onJoystickMove(0, 0);
        };

        const updateStick = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            let deltaX = clientX - centerX;
            let deltaY = clientY - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > maxDistance) {
                const ratio = maxDistance / distance;
                deltaX *= ratio;
                deltaY *= ratio;
            }
            
            stick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            
            // Normalize to -1 to 1
            const normalizedX = deltaX / maxDistance;
            const normalizedY = deltaY / maxDistance;
            this.onJoystickMove(normalizedX, normalizedY);
        };

        joystick.addEventListener('touchstart', handleStart, { passive: false });
        joystick.addEventListener('mousedown', handleStart);
        
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mousemove', handleMove);
        
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('mouseup', handleEnd);

        this.updateStick = updateStick;
    }

    onJoystickMove(x, y) {
        // Emit movement event
        window.dispatchEvent(new CustomEvent('joystickmove', { 
            detail: { x, y } 
        }));
    }

    /* ============================================
       ACTION BUTTONS
       ============================================ */
    
    initActionButtons() {
        // Attack button
        const attackBtn = document.getElementById('attackBtn');
        if (attackBtn) {
            attackBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerAttack();
            });
            attackBtn.addEventListener('mousedown', () => this.triggerAttack());
        }

        // Jump button
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerJump();
            });
            jumpBtn.addEventListener('mousedown', () => this.triggerJump());
        }

        // Special button
        const specialBtn = document.getElementById('specialBtn');
        if (specialBtn) {
            specialBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerSpecial();
            });
            specialBtn.addEventListener('mousedown', () => this.triggerSpecial());
        }
    }

    triggerAttack() {
        window.dispatchEvent(new CustomEvent('gameaction', { detail: { action: 'attack' } }));
        this.showButtonFeedback('attackBtn');
        this.incrementCombo();
    }

    triggerJump() {
        window.dispatchEvent(new CustomEvent('gameaction', { detail: { action: 'jump' } }));
        this.showButtonFeedback('jumpBtn');
    }

    triggerSpecial() {
        const overlay = document.getElementById('specialCooldown');
        if (overlay && overlay.style.clipPath === 'circle(0% at 50% 50%)') {
            return; // On cooldown
        }
        
        window.dispatchEvent(new CustomEvent('gameaction', { detail: { action: 'special' } }));
        this.showButtonFeedback('specialBtn');
        this.startCooldown('specialCooldown', 5000); // 5 second cooldown
    }

    showButtonFeedback(btnId) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 100);
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    startCooldown(elementId, duration) {
        const overlay = document.getElementById(elementId);
        if (!overlay) return;
        
        overlay.style.clipPath = 'circle(100% at 50% 50%)';
        
        let start = Date.now();
        const updateCooldown = () => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, duration - elapsed);
            const percent = (remaining / duration) * 100;
            
            overlay.style.clipPath = `circle(${percent}% at 50% 50%)`;
            
            if (remaining > 0) {
                requestAnimationFrame(updateCooldown);
            }
        };
        
        requestAnimationFrame(updateCooldown);
    }

    /* ============================================
       HUD UPDATES
       ============================================ */
    
    updateHealth(current, max) {
        const fill = document.getElementById('healthFill');
        const text = fill?.parentElement?.querySelector('.bar-text');
        
        const percent = (current / max) * 100;
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${current.toLocaleString()} / ${max.toLocaleString()}`;
        
        // Low health warning
        if (percent < 25) {
            fill?.style.setProperty('animation', 'pulse-glow 1s ease-in-out infinite');
        }
    }

    updateMana(current, max) {
        const fill = document.getElementById('manaFill');
        const text = fill?.parentElement?.querySelector('.bar-text');
        
        const percent = (current / max) * 100;
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${current} / ${max}`;
    }

    updateScore(score) {
        const element = document.getElementById('scoreValue');
        if (element) {
            element.textContent = score.toLocaleString();
        }
    }

    updateXP(current, max, level) {
        const fill = document.getElementById('xpFill');
        const text = document.querySelector('.xp-text');
        
        const percent = (current / max) * 100;
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `Level ${level} • ${Math.floor(percent)}%`;
    }

    incrementCombo() {
        this.comboCount++;
        const display = document.getElementById('comboDisplay');
        const count = display?.querySelector('.combo-count');
        
        if (count) count.textContent = `x${this.comboCount}`;
        if (display) display.classList.add('active');
        
        // Reset combo timer
        clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            this.comboCount = 0;
            if (display) display.classList.remove('active');
        }, 3000);
    }

    showDamageNumber(damage, x, y, isCrit = false) {
        const container = document.getElementById('damageNumbers');
        if (!container) return;
        
        const number = document.createElement('div');
        number.className = `damage-number ${isCrit ? 'critical' : ''}`;
        number.textContent = damage.toLocaleString();
        number.style.left = `${x}px`;
        number.style.top = `${y}px`;
        
        container.appendChild(number);
        
        // Animate and remove
        setTimeout(() => {
            number.classList.add('float-up');
        }, 10);
        
        setTimeout(() => {
            number.remove();
        }, 1000);
    }

    useItem(slot) {
        window.dispatchEvent(new CustomEvent('gameaction', { 
            detail: { action: 'item', slot } 
        }));
    }

    /* ============================================
       SETTINGS
       ============================================ */
    
    switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(`${tabName}Tab`);
        if (targetPanel) targetPanel.classList.add('active');
    }

    updateVolume(type, value) {
        const valueEl = document.getElementById(`${type}VolValue`);
        if (valueEl) valueEl.textContent = `${value}%`;
        
        // Update slider fill
        const slider = document.getElementById(`${type}Volume`);
        const fill = slider?.nextElementSibling;
        if (fill) fill.style.width = `${value}%`;
        
        // Emit volume change event
        window.dispatchEvent(new CustomEvent('volumechange', {
            detail: { type, value: parseInt(value) / 100 }
        }));
    }

    toggleMute(muted) {
        window.dispatchEvent(new CustomEvent('mutechange', { detail: { muted } }));
    }

    initSettings() {
        // Initialize slider fills
        ['master', 'music', 'sfx'].forEach(type => {
            const slider = document.getElementById(`${type}Volume`);
            if (slider) {
                const fill = slider.nextElementSibling;
                if (fill) fill.style.width = `${slider.value}%`;
            }
        });
    }

    /* ============================================
       SCREEN EFFECTS
       ============================================ */
    
    triggerDamageFlash() {
        const flash = document.getElementById('damageFlash');
        if (!flash) return;
        
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 300);
    }

    triggerScreenShake(intensity = 1) {
        const shake = document.getElementById('screenShake');
        if (!shake) return;
        
        shake.style.animation = 'none';
        shake.offsetHeight; // Trigger reflow
        shake.style.animation = `shake ${0.5 * intensity}s ease-out`;
    }

    /* ============================================
       UTILITY
       ============================================ */
    
    showGameOver(stats) {
        // Update stats
        if (stats) {
            const elements = {
                enemiesKilled: document.getElementById('enemiesKilled'),
                soulsEarned: document.getElementById('soulsEarned'),
                timeSurvived: document.getElementById('timeSurvived'),
                bestCombo: document.getElementById('bestCombo')
            };
            
            Object.entries(stats).forEach(([key, value]) => {
                if (elements[key]) elements[key].textContent = value;
            });
        }
        
        this.showScreen('gameOverScreen');
    }

    showVictory(stats) {
        this.showScreen('victoryScreen');
        this.startVictoryParticles();
    }

    startVictoryParticles() {
        const container = document.getElementById('victoryParticles');
        if (!container) return;
        
        // Create confetti/particle effect
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'victory-particle';
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.animationDelay = `${Math.random() * 2}s`;
                container.appendChild(particle);
                
                setTimeout(() => particle.remove(), 3000);
            }, i * 50);
        }
    }
}

// Initialize UI Controller when DOM is ready
let ui;
document.addEventListener('DOMContentLoaded', () => {
    ui = new UIController();
    window.gameUI = ui;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}
