/**
 * DEBUG: Controller Test Version
 * Shows raw gamepad input on screen
 */

class DebugGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DebugGameScene' });
    }

    create() {
        this.add.text(20, 20, '🔍 CONTROLLER DEBUG', { 
            fontSize: '24px', 
            fill: '#ffff00',
            fontFamily: 'monospace'
        });

        this.debugText = this.add.text(20, 60, 'Waiting for controller...', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'monospace',
            lineSpacing: 10
        });

        this.player = this.add.rectangle(400, 300, 50, 50, 0x00ffff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        // Raw gamepad polling
        this.gamepad = null;
        this.pollCount = 0;

        // Test if getGamepads exists
        const hasApi = !!navigator.getGamepads;
        console.log('navigator.getGamepads exists:', hasApi);
        
        this.add.text(20, 500, `API Available: ${hasApi ? 'YES' : 'NO'}`, {
            fontSize: '20px',
            fill: hasApi ? '#00ff00' : '#ff0000'
        });
    }

    update() {
        this.pollCount++;
        
        // Poll for gamepads
        let gamepads;
        try {
            gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        } catch (e) {
            this.debugText.setText(`ERROR: ${e.message}`);
            return;
        }

        let debug = `Poll #${this.pollCount}\n`;
        debug += `Gamepads found: ${gamepads.length}\n\n`;

        let activeGamepad = null;

        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp) {
                debug += `[${i}] ${gp.id}\n`;
                debug += `  Connected: ${gp.connected}\n`;
                debug += `  Buttons: ${gp.buttons.length}\n`;
                debug += `  Axes: ${gp.axes.length}\n`;
                
                // Show button states
                const pressedButtons = [];
                for (let b = 0; b < gp.buttons.length; b++) {
                    if (gp.buttons[b].pressed) {
                        pressedButtons.push(b);
                    }
                }
                if (pressedButtons.length > 0) {
                    debug += `  PRESSED: ${pressedButtons.join(', ')}\n`;
                }
                
                // Show axes
                if (gp.axes.some(a => Math.abs(a) > 0.1)) {
                    debug += `  AXES: ${gp.axes.map(a => a.toFixed(2)).join(', ')}\n`;
                }
                
                debug += '\n';
                activeGamepad = gp;
            }
        }

        this.debugText.setText(debug);

        // Move player with first active gamepad
        if (activeGamepad) {
            const x = activeGamepad.axes[0] || 0;
            const y = activeGamepad.axes[1] || 0;
            
            this.player.body.setVelocity(x * 300, y * 300);
            
            // Jump with button 0
            if (activeGamepad.buttons[0]?.pressed && this.player.body.touching.down) {
                this.player.body.setVelocityY(-500);
            }
        } else {
            this.player.body.setVelocity(0, 0);
        }

        // Also try Phaser's gamepad
        if (this.input.gamepad?.gamepads?.length > 0) {
            const phaserPad = this.input.gamepad.gamepads[0];
            this.add.text(400, 20, 'PHASER DETECTED!', { fill: '#ff00ff' });
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 600 } }
    },
    scene: DebugGameScene,
    input: {
        gamepad: true  // Enable Phaser gamepad plugin
    }
};

new Phaser.Game(config);
