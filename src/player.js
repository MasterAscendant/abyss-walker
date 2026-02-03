/**
 * Player Controller with Bluetooth Gamepad Support
 * Handles keyboard, touch, and Bluetooth controller input
 */

class PlayerController {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        
        // Player stats
        this.speed = 200;
        this.jumpPower = 400;
        this.abilities = {
            double_jump: false,
            wall_jump: false,
            dash: false,
            grappling: false
        };
        
        // State
        this.canDoubleJump = false;
        this.isDashing = false;
        this.facingRight = true;
        
        this.setupPhysics();
        this.setupInput();
        this.setupGamepad();
    }
    
    setupPhysics() {
        this.sprite.setBounce(0.1);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(800);
    }
    
    setupInput() {
        // Keyboard controls
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        
        // WASD alternative
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            dash: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });
        
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    setupGamepad() {
        this.gamepad = null;
        this.gamepadIndex = null;
        
        // iOS Safari requires polling - events don't work reliably
        // Poll for gamepad connection every 500ms
        this.gamepadPollInterval = setInterval(() => {
            this.pollGamepad();
        }, 500);
        
        // Also listen for Phaser events as backup
        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.on('connected', (pad) => {
                console.log('Phaser gamepad connected:', pad.id);
                this.gamepad = pad;
                this.updateControllerStatus('🎮 Controller Connected');
            });
        }
    }
    
    pollGamepad() {
        // Use raw navigator.getGamepads() API for iOS compatibility
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp && gp.connected) {
                if (!this.gamepad || this.gamepadIndex !== i) {
                    console.log('Raw gamepad detected:', gp.id, 'index:', i);
                    this.gamepad = gp;
                    this.gamepadIndex = i;
                    this.updateControllerStatus('🎮 Controller Connected');
                }
                return;
            }
        }
        
        // No gamepad found
        if (this.gamepad) {
            this.gamepad = null;
            this.gamepadIndex = null;
            this.updateControllerStatus('Connect Bluetooth Controller');
        }
    }
    
    setupTouchControls() {
        // Virtual joystick zone (left side)
        const joystickZone = this.scene.add.zone(80, this.scene.scale.height - 80, 120, 120);
        joystickZone.setInteractive();
        
        // Jump button (right side)
        const jumpBtn = this.scene.add.circle(this.scene.scale.width - 80, this.scene.scale.height - 80, 40, 0x4a9eff, 0.5);
        jumpBtn.setInteractive();
        
        jumpBtn.on('pointerdown', () => {
            this.jump();
        });
        
        // Touch movement tracking
        this.touchInput = { x: 0, y: 0, active: false };
        
        joystickZone.on('pointerdown', (pointer) => {
            this.touchInput.active = true;
            this.updateTouchInput(pointer, joystickZone);
        });
        
        joystickZone.on('pointermove', (pointer) => {
            if (this.touchInput.active) {
                this.updateTouchInput(pointer, joystickZone);
            }
        });
        
        joystickZone.on('pointerup', () => {
            this.touchInput.active = false;
            this.touchInput.x = 0;
            this.touchInput.y = 0;
        });
    }
    
    updateTouchInput(pointer, zone) {
        const dx = pointer.x - zone.x;
        const dy = pointer.y - zone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 40;
        
        if (distance > maxDistance) {
            const scale = maxDistance / distance;
            this.touchInput.x = (dx * scale) / maxDistance;
            this.touchInput.y = (dy * scale) / maxDistance;
        } else {
            this.touchInput.x = dx / maxDistance;
            this.touchInput.y = dy / maxDistance;
        }
    }
    
    updateControllerStatus(status) {
        const statusEl = document.getElementById('controller-status');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }
    
    update() {
        // Handle movement input
        let moveX = 0;
        let jumpPressed = false;
        let dashPressed = false;
        
        // Gamepad input - use raw API for iOS Safari compatibility
        if (this.gamepad) {
            // Refresh gamepad data (required for iOS)
            const gamepads = navigator.getGamepads();
            const gp = this.gamepadIndex !== null ? gamepads[this.gamepadIndex] : null;
            
            if (gp) {
                // Left stick (axes 0 = X, 1 = Y)
                const leftStickX = gp.axes[0];
                if (Math.abs(leftStickX) > 0.15) {
                    moveX = leftStickX;
                }
                
                // D-pad buttons (12-15) as alternative
                if (gp.buttons[14]?.pressed) moveX = -1; // D-pad left
                if (gp.buttons[15]?.pressed) moveX = 1;  // D-pad right
                
                // Button 0 (A on Xbox, X on PS) = Jump
                if (gp.buttons[0]?.pressed) jumpPressed = true;
                
                // Button 1 (B on Xbox, Circle on PS) = Dash
                if (gp.buttons[1]?.pressed) dashPressed = true;
                
                // Button 2 (X on Xbox, Square on PS) = also Jump (alternative)
                if (gp.buttons[2]?.pressed) jumpPressed = true;
            }
        }
        
        // Keyboard input
        if (this.cursors.left?.isDown || this.wasd.left?.isDown) {
            moveX = -1;
        } else if (this.cursors.right?.isDown || this.wasd.right?.isDown) {
            moveX = 1;
        }
        
        if (this.cursors.up?.isDown || this.wasd.jump?.isDown || this.wasd.up?.isDown) {
            jumpPressed = true;
        }
        
        if (this.wasd.dash?.isDown) {
            dashPressed = true;
        }
        
        // Touch input
        if (this.touchInput.active) {
            moveX = this.touchInput.x;
        }
        
        // Apply movement
        if (moveX !== 0) {
            this.sprite.setVelocityX(moveX * this.speed);
            this.facingRight = moveX > 0;
            this.sprite.setFlipX(!this.facingRight);
        } else {
            this.sprite.setVelocityX(0);
        }
        
        // Handle jump
        if (jumpPressed && !this.jumpPressedLastFrame) {
            this.jump();
        }
        this.jumpPressedLastFrame = jumpPressed;
        
        // Handle dash
        if (dashPressed && !this.dashPressedLastFrame && this.abilities.dash) {
            this.dash();
        }
        this.dashPressedLastFrame = dashPressed;
        
        // Apply gravity based on wall jump
        if (this.abilities.wall_jump) {
            this.handleWallSlide();
        }
    }
    
    jump() {
        const onGround = this.sprite.body.touching.down;
        const onWall = this.sprite.body.touching.left || this.sprite.body.touching.right;
        
        if (onGround) {
            this.sprite.setVelocityY(-this.jumpPower);
            this.canDoubleJump = this.abilities.double_jump;
        } else if (onWall && this.abilities.wall_jump) {
            // Wall jump
            const jumpDir = this.sprite.body.touching.left ? 1 : -1;
            this.sprite.setVelocityX(jumpDir * this.speed * 1.5);
            this.sprite.setVelocityY(-this.jumpPower * 0.9);
        } else if (this.canDoubleJump) {
            // Double jump
            this.sprite.setVelocityY(-this.jumpPower * 0.85);
            this.canDoubleJump = false;
        }
    }
    
    dash() {
        if (!this.isDashing) {
            this.isDashing = true;
            const dashSpeed = this.speed * 3;
            this.sprite.setVelocityX(this.facingRight ? dashSpeed : -dashSpeed);
            this.sprite.setVelocityY(0);
            
            // Dash duration
            this.scene.time.delayedCall(200, () => {
                this.isDashing = false;
            });
        }
    }
    
    handleWallSlide() {
        const onWall = (this.sprite.body.touching.left || this.sprite.body.touching.right) && 
                       !this.sprite.body.touching.down;
        
        if (onWall && this.sprite.body.velocity.y > 0) {
            // Slow fall when sliding on wall
            this.sprite.body.setVelocityY(this.sprite.body.velocity.y * 0.8);
        }
    }
    
    unlockAbility(ability) {
        if (this.abilities.hasOwnProperty(ability)) {
            this.abilities[ability] = true;
            
            // Visual feedback
            this.scene.cameras.main.flash(500, 100, 200, 255);
            
            // Show notification
            this.showAbilityNotification(ability);
        }
    }
    
    showAbilityNotification(ability) {
        const names = {
            double_jump: 'DOUBLE JUMP',
            wall_jump: 'WALL JUMP',
            dash: 'DASH',
            grappling: 'GRAPPLING HOOK'
        };
        
        // Create floating text
        const text = this.scene.add.text(this.sprite.x, this.sprite.y - 50, 
            `UNLOCKED: ${names[ability]}`, {
            fontSize: '20px',
            fill: '#4a9eff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }
}
